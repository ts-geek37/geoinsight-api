import { query } from "../../db";
import { AreaProfile, SimilarAreaResult, Store } from "../../types";
import { getNearestAreaProfile } from "../areaProfileService";
import { getStoreById } from "../storesService";
import { cosineSimilarity } from "./cosine";
import { buildFeatureVector } from "./featureBuilder";
import { computeNormalizationStats, normalizeVector } from "./normalization";

const MIN_SIMILARITY_PERCENT = 75;
const MIN_POPULATION_3KM = 50_000;
const DEFAULT_LIMIT = 20;

const POPULATION_NORMALIZER = 300_000;
const DISTANCE_NORMALIZER = 8;

export const findSimilarAreasForStore = async (
  storeId: string,
  limit = DEFAULT_LIMIT
): Promise<{
  store: Store;
  baseArea: AreaProfile;
  similarAreas: SimilarAreaResult[];
}> => {
  const store = await getStoreById(storeId);
  if (!store) throw new Error("Store not found");

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
    JOIN stores s ON s.id = $3
    WHERE ap.id <> $1
      AND (ap.population_3km IS NULL OR ap.population_3km >= $2)
      AND ST_Distance(
        s.geom::geography,
        ap.geom::geography
      ) >= 2000;
  `;

  const { rows } = await query(candidateQuery, [
    baseArea.id,
    MIN_POPULATION_3KM,
    store.id,
  ]);

  if (rows.length === 0) {
    return { store, baseArea, similarAreas: [] };
  }

  const candidateAreas = rows as (AreaProfile & {
    distance_km: number;
  })[];
 
  const baseVecRaw = buildFeatureVector(baseArea);

  const candidateVecsRaw = new Array(candidateAreas.length);
  for (let i = 0; i < candidateAreas.length; i++) {
    candidateVecsRaw[i] = buildFeatureVector(candidateAreas[i]);
  }

  const stats = computeNormalizationStats([
    baseVecRaw,
    ...candidateVecsRaw,
  ]);

  const baseVec = normalizeVector(baseVecRaw, stats);

  const results: SimilarAreaResult[] = [];

  for (let i = 0; i < candidateAreas.length; i++) {
    const area = candidateAreas[i];

    const population3km = area.population_3km ?? 0;
    if (population3km < MIN_POPULATION_3KM) continue;

    const vec = normalizeVector(candidateVecsRaw[i], stats);
    const similarityScore =
      Math.round(cosineSimilarity(baseVec, vec) * 10_000) / 100;

    if (similarityScore < MIN_SIMILARITY_PERCENT) continue;

    const distanceKm = area.distance_km ?? 0;

    const populationFactor =
      population3km >= POPULATION_NORMALIZER
        ? 1
        : population3km / POPULATION_NORMALIZER;

    const distanceFactor =
      distanceKm >= DISTANCE_NORMALIZER
        ? 1
        : distanceKm / DISTANCE_NORMALIZER;

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
