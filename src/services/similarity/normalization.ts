import { FeatureVector, NormalizationStats } from "../../types";

const FEATURE_KEYS: (keyof FeatureVector)[] = [
  "population_density",
  "income_high_pct",
  "age_25_55_pct",
  "worker_pct",
  "urban_score",
  "gender_ratio",
  "poi_activity_score",
  "road_connectivity_score",
];

export const computeNormalizationStats = (
  vectors: FeatureVector[]
): NormalizationStats => {
  const min: any = {};
  const max: any = {};

  for (const key of FEATURE_KEYS) {
    min[key] = Infinity;
    max[key] = -Infinity;
  }

  for (const vec of vectors) {
    for (const key of FEATURE_KEYS) {
      const val = vec[key];
      if (val < min[key]) min[key] = val;
      if (val > max[key]) max[key] = val;
    }
  }

  for (const key of FEATURE_KEYS) {
    if (!isFinite(min[key])) min[key] = 0;
    if (!isFinite(max[key])) max[key] = min[key];
  }

  return { min, max } as NormalizationStats;
};

export const normalizeVector = (
  vec: FeatureVector,
  stats: NormalizationStats
): FeatureVector => {
  const out: any = {};

  for (const key of FEATURE_KEYS) {
    const min = stats.min[key];
    const max = stats.max[key];
    const val = vec[key];
    out[key] = max === min ? 0 : (val - min) / (max - min);
  }

  return out as FeatureVector;
};
