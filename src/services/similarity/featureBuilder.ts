import {
  AreaProfile,
  FeatureVector
} from "../../types";

export const buildFeatureVector = (area: AreaProfile): FeatureVector => {
  const poiActivity =
    (area.bars ?? 0) * 2.0 +
    (area.clubs ?? 0) * 3.0 +
    (area.restaurants ?? 0) * 1.5 +
    (area.hotels ?? 0) * 1.2;

  return {
    population_density: Number(area.population_density ?? 0),
    income_high_pct: Number(area.income_high_percentage ?? 0),
    age_25_55_pct: Number(area.age_25_55_pct ?? 0),
    worker_pct: Number(area.worker_pct ?? 0),
    urban_score: Number(area.urban_score ?? 0),
    gender_ratio: Number(area.gender_ratio ?? 0),
    poi_activity_score: poiActivity,
    road_connectivity_score: Number(area.road_connectivity_score ?? 0),
  };
};
