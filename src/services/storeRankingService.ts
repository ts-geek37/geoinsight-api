import { query } from "../db";
import {
  AreaProfile,
  SimilarAreaResult,
  Store,
  StoreAreaSummaryItem,
  StoreAreaSummaryResponse,
} from "../types";
import { getNearestAreaProfile } from "./areaProfileService";
import { buildFeatureVector, computeNormalizationStats, cosineSimilarity, normalizeVector } from "./similarity";

const TOP_STORES = 20;
const TOP_AREAS = 15;
const MIN_SIMILARITY = 75;
const MIN_POPULATION = 50_000;

const IDEAL_POPULATION_3KM = 300_000;
const IDEAL_DISTANCE_KM = 8;

const getTopStoresFromDb = async (): Promise<
  (Store & { rank_score: number; revenue_latest_year: number })[]
> =>
  (
    await query(
      `
      WITH latest_sales AS (
        SELECT
          ss.store_id,
          ss.year,
          SUM(ss.revenue_inr) AS revenue_inr,
          ROW_NUMBER() OVER (
            PARTITION BY ss.store_id
            ORDER BY ss.year DESC
          ) AS rn
        FROM store_sales ss
        GROUP BY ss.store_id, ss.year
      ),
      store_metrics AS (
        SELECT
          s.id,
          s.name,
          s.city,
          s.state,
          s.latitude,
          s.longitude,
          s.rfm_score,
          COALESCE(ls.revenue_inr, 0) AS revenue_latest_year
        FROM stores s
        LEFT JOIN latest_sales ls
          ON ls.store_id = s.id AND ls.rn = 1
      ),
      normalized AS (
        SELECT
          *,
          revenue_latest_year
            / NULLIF(MAX(revenue_latest_year) OVER (), 0)
            AS revenue_norm,
          rfm_score
            / NULLIF(MAX(rfm_score) OVER (), 0)
            AS rfm_norm
        FROM store_metrics
      )
      SELECT
        id,
        name,
        city,
        state,
        latitude,
        longitude,
        rfm_score,
        ROUND(revenue_latest_year, 2) AS revenue_latest_year,
        ROUND(
          revenue_norm * 0.7 + rfm_norm * 0.3,
          2
        ) AS rank_score
      FROM normalized
      ORDER BY rank_score DESC
      LIMIT $1;
      `,
      [TOP_STORES]
    )
  ).rows.map((r) => ({
    ...r,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    rfm_score: Number(r.rfm_score),
    revenue_latest_year: Number(r.revenue_latest_year),
    rank_score: Number(r.rank_score),
  }));

const getTopAreasForStore = async (
  store: Store
): Promise<{ baseArea: AreaProfile; areas: SimilarAreaResult[] }> => {
  const baseArea = await getNearestAreaProfile(store.latitude, store.longitude);

  if (!baseArea) {
    return { baseArea: null as any, areas: [] };
  }

  const candidates = (
    await query(
      `
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
      `,
      [baseArea.id, MIN_POPULATION, store.id]
    )
  ).rows as (AreaProfile & { distance_km: number })[];

  if (!candidates.length) {
    return { baseArea, areas: [] };
  }

  const baseVecRaw = buildFeatureVector(baseArea);
  const candidateVecsRaw = candidates.map(buildFeatureVector);

  const stats = computeNormalizationStats([baseVecRaw, ...candidateVecsRaw]);
  const baseVec = normalizeVector(baseVecRaw, stats);

  const areas: SimilarAreaResult[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const area = candidates[i];
    const vec = normalizeVector(candidateVecsRaw[i], stats);

    const sim01 = cosineSimilarity(baseVec, vec);
    const similarityScore = Math.round(sim01 * 100 * 100) / 100;

    if (similarityScore < MIN_SIMILARITY) continue;

    const population3km = Number(area.population_3km ?? 0);
    if (population3km < MIN_POPULATION) continue;

    const distanceKm = Number(area.distance_km ?? 0);

    const populationFactor = Math.min(population3km / IDEAL_POPULATION_3KM, 1);

    const distanceFactor = Math.min(distanceKm / IDEAL_DISTANCE_KM, 1);

    const priorityScore =
      Math.round(similarityScore * populationFactor * distanceFactor * 100) /
      100;

    areas.push({
      area,
      similarityScore,
      priorityScore,
    });
  }

  areas.sort((a, b) => b.priorityScore - a.priorityScore);

  return {
    baseArea,
    areas: areas.slice(0, TOP_AREAS),
  };
};

export const getStoreAreaSummary =
  async (): Promise<StoreAreaSummaryResponse> => {
    const stores = await getTopStoresFromDb();

    const results: StoreAreaSummaryItem[] = [];

    for (const store of stores) {
      const { baseArea, areas } = await getTopAreasForStore(store);

      results.push({
        store: {
          id: store.id,
          name: store.name,
          city: store.city,
          state: store.state,
          rfm_score: store.rfm_score,
          revenue_latest_year: store.revenue_latest_year,
          rank_score: store.rank_score,
        },
        baseArea,
        areas,
      });
    }

    return {
      generated_at: new Date().toISOString(),
      results,
    };
  };
