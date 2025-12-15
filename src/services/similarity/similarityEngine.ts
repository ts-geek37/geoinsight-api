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

  const baseArea = await getNearestAreaProfile(
    store.latitude,
    store.longitude
  );
  if (!baseArea) {
    throw new Error("No area profile found for base store");
  }

  const candidateQuery = `
    SELECT
      ap.*,
      ST_Distance(
        ap.geom::geography,
        s.geom::geography
      ) / 1000 AS distance_km
    FROM area_profiles ap
    CROSS JOIN stores s
    WHERE s.id = $3
      AND ap.id <> $1
      AND (ap.population_3km IS NULL OR ap.population_3km >= $2)
      AND ST_Distance(
        s.geom::geography,
        ap.geom::geography
      ) >= 2000;
  `;

  const candidateRes = await query(candidateQuery, [
    baseArea.id,
    MIN_POPULATION_3KM,
    store.id,
  ]);

  const candidateAreas = candidateRes.rows as (AreaProfile & {
    distance_km: number;
  })[];

  if (!candidateAreas.length) {
    return { store, baseArea, similarAreas: [] };
  }

  const baseVecRaw = buildFeatureVector(baseArea);
  const candidateVecsRaw = candidateAreas.map(buildFeatureVector);

  const stats = computeNormalizationStats([
    baseVecRaw,
    ...candidateVecsRaw,
  ]);
  const baseVec = normalizeVector(baseVecRaw, stats);

  const results: SimilarAreaResult[] = [];

  for (let i = 0; i < candidateAreas.length; i++) {
    const area = candidateAreas[i];
    const vec = normalizeVector(candidateVecsRaw[i], stats);

    const sim01 = cosineSimilarity(baseVec, vec);
    const similarityScore =
      Math.round(sim01 * 100 * 100) / 100;

    if (similarityScore < MIN_SIMILARITY_PERCENT) continue;

    const population3km = Number(area.population_3km ?? 0);
    if (population3km < MIN_POPULATION_3KM) continue;

    const distanceKm = Number(area.distance_km ?? 0);

    const populationFactor = Math.min(
      population3km / 300_000,
      1
    );

    const distanceFactor = Math.min(
      distanceKm / 8,
      1
    );

    const priorityScore =
      Math.round(
        similarityScore *
          populationFactor *
          distanceFactor *
          100
      ) / 100;

    results.push({
      area,
      similarityScore,
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
