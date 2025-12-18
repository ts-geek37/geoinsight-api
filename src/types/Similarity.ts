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

export interface SimilarityResponseDTO {
  store: {
    id: string;
    name: string;
  };

  baseArea: {
    id: number;
    name: string;
  };

  candidates: SimilarAreaDTO[];
}

export interface SimilarAreaDTO {
  area: {
    id: number;
    name: string;
    city: string;
    latitude: number;
    longitude: number;
  };

  similarityScore: number;

  metrics: ComparisonMetricDTO[];
}

export interface ComparisonMetricDTO {
  label: string;
  store: string;
  candidate: string;
}
