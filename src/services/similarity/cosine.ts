import { FeatureVector } from "../../types";

const FEATURE_WEIGHTS: Record<keyof FeatureVector, number> = {
  population_density: 0.2,
  income_high_pct: 0.2,
  age_25_55_pct: 0.15,
  poi_activity_score: 0.15,
  road_connectivity_score: 0.1,
  worker_pct: 0.1,
  urban_score: 0.05,
  gender_ratio: 0.05,
};

export const cosineSimilarity = (
  a: FeatureVector,
  b: FeatureVector
): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const key in FEATURE_WEIGHTS) {
    const w = FEATURE_WEIGHTS[key as keyof FeatureVector];
    const va = a[key as keyof FeatureVector] * w;
    const vb = b[key as keyof FeatureVector] * w;

    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
