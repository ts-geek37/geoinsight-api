export interface AreaProfile {
  id?: number;
  area_name?: string;
  city?: string;
  state?: string;
  latitude: number;
  longitude: number;
  population_1km?: number | null;
  population_3km?: number | null;
  population_5km?: number | null;
  literacy_rate?: number | null;
  age_25_55_pct?: number | null;
  gender_ratio?: number | null;
  worker_pct?: number | null;
  population_density?: number | null;
  income_high_percentage?: number | null;
  restaurants?: number | null;
  hotels?: number | null;
  bars?: number | null;
  clubs?: number | null;
  poi_total?: number | null;
  poi_normalized?: number | null;
  urban_score?: number | null;
  poi_activity_score?: number | null;
  road_connectivity_score?: number | null;
  similarity_score?: number | null;
  priority_score?: number | null;
}
