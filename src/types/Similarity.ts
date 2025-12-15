import { AreaProfile } from "./AreaProfile";
import { Store } from "./Store";

export interface FeatureVector {
  population_density: number;
  income_high_pct: number;
  age_25_55_pct: number;

  worker_pct: number;
  urban_score: number;
  gender_ratio: number;

  poi_activity_score: number;

  road_connectivity_score: number;
}

export interface NormalizationStats {
  min: FeatureVector;
  max: FeatureVector;
}

export interface SimilarAreaResult {
  area: AreaProfile;
  similarityScore: number;
  priorityScore: number;
}

export interface SimilarStoreResult {
  store: Store;
  baseArea: AreaProfile;
  similarAreas: SimilarAreaResult[];
}
