import { query } from "../../db";
import { AreaProfile, SimilarAreaResult, Store } from "../../types";
import { getNearestAreaProfile } from "../areaProfileService";
import { getStoreById } from "../storesService";
import { cosineSimilarity } from "./cosine";
import { buildFeatureVector } from "./featureBuilder";
import { computeNormalizationStats, normalizeVector } from "./normalization";

const MIN_SIMILARITY_PERCENT = 75;
const MIN_POPULATION_3KM = 50000;
const DEFAULT_LIMIT = 20;

export const findSimilarAreasForStore = async (
  storeId: string,
  limit = DEFAULT_LIMIT
): Promise<{
  store: Store;
  baseArea: AreaProfile;
  similarAreas: SimilarAreaResult[];
}> => {
  const store = await getStoreById(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  const baseArea = await getNearestAreaProfile(store.latitude, store.longitude);
  if (!baseArea) {
    throw new Error("No area profile found for base store");
  }

  const candidateQuery = `
    SELECT ap.*
    FROM area_profiles ap
    WHERE ap.id <> $1
      AND (ap.population_3km IS NULL OR ap.population_3km >= $2)
      AND NOT EXISTS (
        SELECT 1
        FROM stores s
        WHERE ST_Distance(s.geom::geography, ap.geom::geography) < 2000
      );
  `;

  const candidateRes = await query(candidateQuery, [
    baseArea.id,
    MIN_POPULATION_3KM,
  ]);

  const candidateAreas: AreaProfile[] = candidateRes.rows;

  if (candidateAreas.length === 0) {
    return { store, baseArea, similarAreas: [] };
  }

  const baseVecRaw = buildFeatureVector(baseArea);
  const candidateVecsRaw = candidateAreas.map(buildFeatureVector);

  const allVectors = [baseVecRaw, ...candidateVecsRaw];
  const stats = computeNormalizationStats(allVectors);
  const baseVec = normalizeVector(baseVecRaw, stats);

  const results: SimilarAreaResult[] = [];

  for (let i = 0; i < candidateAreas.length; i++) {
    const area = candidateAreas[i];
    const vec = normalizeVector(candidateVecsRaw[i], stats);
    const sim01 = cosineSimilarity(baseVec, vec);
    const simPercent = Number((sim01 * 100).toFixed(2));
    const population3km = Number(area.population_3km ?? 0);

    if (simPercent < MIN_SIMILARITY_PERCENT) continue;
    if (population3km < MIN_POPULATION_3KM) continue;

    const priorityScore = simPercent * population3km;

    results.push({
      area,
      similarityScore: simPercent,
      priorityScore,
    });
  }

  results.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    store,
    baseArea,
    similarAreas: results.slice(0, limit),
  };
};
