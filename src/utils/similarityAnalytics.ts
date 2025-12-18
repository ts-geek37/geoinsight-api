import { AreaProfile, SimilarAreaResult, Store } from "../types";

const n = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : Number(v) || 0;

const num = (v: unknown) =>
  n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const pct = (v: unknown) =>
  `${n(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

const k = (v: unknown) =>
  `${(n(v) / 1000).toLocaleString("en-IN", { maximumFractionDigits: 2 })}k`;

const totalPoi = (a: AreaProfile) =>
  n(a.bars) + n(a.restaurants) + n(a.hotels) + n(a.clubs);

export const buildSimilarityResponseDTO = ({
  store,
  baseArea,
  similarAreas,
}: {
  store: Store;
  baseArea: AreaProfile;
  similarAreas: SimilarAreaResult[];
}) => {
  return {
    store: {
      id: store.id,
      name: store.name,
    },

    baseArea: {
      id: baseArea.id,
      name: baseArea.area_name,
    },

    candidates: similarAreas.map((item) => {
      const area = item.area;

      return {
        area: {
          id: area.id,
          name: area.area_name,
          city: area.city,
          latitude: area.latitude,
          longitude: area.longitude,
        },

        similarityScore: Number(n(item.similarityScore).toFixed(2)),

        metrics: [
          {
            label: "Similarity Score",
            store: "100%",
            candidate: `${num(item.similarityScore)}%`,
          },
          {
            label: "Population (3km)",
            store: k(baseArea.population_3km),
            candidate: k(area.population_3km),
          },
          {
            label: "Income High %",
            store: pct(baseArea.income_high_percentage),
            candidate: pct(area.income_high_percentage),
          },
          {
            label: "Age 25–55 %",
            store: pct(baseArea.age_25_55_pct),
            candidate: pct(area.age_25_55_pct),
          },
          {
            label: "POI Activity Score",
            store: num(totalPoi(baseArea)),
            candidate: num(totalPoi(area)),
          },
          {
            label: "Road Connectivity",
            store: num(baseArea.urban_score),
            candidate: num(area.road_connectivity_score),
          },
          {
            label: "Priority Score",
            store: "100",
            candidate: num(item.priorityScore),
          },
        ],
      };
    }),
  };
};
