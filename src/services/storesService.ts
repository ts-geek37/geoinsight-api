import { query } from "../db";
import {
  Sales,
  Store,
  StoreDetailsDTO,
  StoreMapItemDTO,
  StoreMapResponseDTO,
} from "../types";
import { buildStoreAnalytics, formatINR } from "../utils";
import { getNearestAreaProfile } from "./areaProfileService";
import { getSalesAll } from "./salesService";

export const buildStoreMapResponse = (stores: Store[]): StoreMapResponseDTO => {
  const items: StoreMapItemDTO[] = [];

  for (const s of stores) {
    if (!Array.isArray(s.yearly_revenue) || s.yearly_revenue.length === 0) {
      continue;
    }

    const latest = s.yearly_revenue.reduce((a, b) => (a.year > b.year ? a : b));

    items.push({
      id: s.id,
      name: s.name,
      city: s.city,
      state: s.state,
      latitude: s.latitude,
      longitude: s.longitude,
      rfmScore: s.rfm_score,
      rfmSegment: s.rfm_segment,
      latestRevenue: latest.revenue_inr,
      latestRevenueFormatted: formatINR(latest.revenue_inr),
      heatmapWeight: s.rfm_score,
    });
  }

  const states = [...new Set(items.map((s) => s.state))].sort();

  const citiesByState: Record<string, string[]> = {};
  for (const state of states) {
    citiesByState[state] = [
      ...new Set(items.filter((i) => i.state === state).map((i) => i.city)),
    ].sort();
  }

  const revenues = items.map((i) => i.latestRevenue);
  const revenueMin = revenues.length ? Math.min(...revenues) : 0;
  const revenueMax = revenues.length ? Math.max(...revenues) : 0;

  const segmentCounts = {
    champion: items.filter((i) => i.rfmSegment.toLowerCase() === "champion")
      .length,
    promising: items.filter((i) => i.rfmSegment.toLowerCase() === "promising")
      .length,
    attention: items.filter((i) =>
      i.rfmSegment.toLowerCase().includes("attention")
    ).length,
  };

  return {
    stores: items,
    filters: {
      states,
      citiesByState,
      revenueMin,
      revenueMax,
    },
    segmentCounts,
  };
};

export const getStoresRaw = async (): Promise<Store[]> => {
  const result = await query(`
    SELECT 
      s.*,
      COALESCE(
        json_agg(
          json_build_object(
            'year', ss.year,
            'revenue_inr', ss.total_revenue,
            'transaction_count', ss.total_transactions,
            'avg_ticket_size',
              CASE 
                WHEN ss.total_transactions > 0 
                THEN ss.total_revenue / ss.total_transactions
                ELSE 0
              END
          )
          ORDER BY ss.year DESC
        ) FILTER (WHERE ss.year IS NOT NULL),
        '[]'
      ) AS yearly_revenue
    FROM stores s
    LEFT JOIN (
      SELECT 
        store_id,
        year,
        SUM(revenue_inr) AS total_revenue,
        SUM(transaction_count) AS total_transactions
      FROM store_sales
      GROUP BY store_id, year
    ) ss ON ss.store_id = s.id
    GROUP BY s.id
    ORDER BY s.city, s.name
  `);

  return result.rows.map((row) => ({
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    rfm_score: Number(row.rfm_score),
    yearly_revenue: row.yearly_revenue.map((y: any) => ({
      year: Number(y.year),
      revenue_inr: Number(y.revenue_inr),
      transaction_count: Number(y.transaction_count),
      avg_ticket_size: Number(y.avg_ticket_size),
    })),
  }));
};

export const getStores = async (): Promise<StoreMapResponseDTO> => {
  const stores = await getStoresRaw();
  return buildStoreMapResponse(stores);
};

export const getStoreById = async (storeId: string): Promise<Store | null> => {
  const result = await query(
    `
    SELECT 
      s.*,
      COALESCE(
        json_agg(
          json_build_object(
            'year', ss.year,
            'revenue_inr', ss.total_revenue,
            'transaction_count', ss.total_transactions,
            'avg_ticket_size',
              CASE 
                WHEN ss.total_transactions > 0 
                THEN ss.total_revenue / ss.total_transactions
                ELSE 0
              END
          )
          ORDER BY ss.year DESC
        ) FILTER (WHERE ss.year IS NOT NULL),
        '[]'
      ) AS yearly_revenue
    FROM stores s
    LEFT JOIN (
      SELECT 
        store_id,
        year,
        SUM(revenue_inr) AS total_revenue,
        SUM(transaction_count) AS total_transactions
      FROM store_sales
      WHERE store_id = $1
      GROUP BY store_id, year
    ) ss ON ss.store_id = s.id
    WHERE s.id = $1
    GROUP BY s.id
    `,
    [storeId]
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];
  const area = await getNearestAreaProfile(row.latitude, row.longitude);
  return {
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    rfm_score: Number(row.rfm_score),
    area,
    yearly_revenue: row.yearly_revenue.map((y: any) => ({
      year: Number(y.year),
      revenue_inr: Number(y.revenue_inr).toFixed(2),
      transaction_count: Number(y.transaction_count).toFixed(2),
      avg_ticket_size: Number(y.avg_ticket_size).toFixed(2),
    })),
  } as Store;
};

export const getStoreWithSales = async (
  storeId: string
): Promise<{
  storeId: string;
  store: Store;
  sales: Sales[];
} | null> => {
  const store = await getStoreById(storeId);
  if (!store) return null;

  const result = await getSalesAll(storeId);
  if (!result.length) return null;

  return { storeId, sales: result, store };
};

export const getStoreDetailsService = async (
  storeId: string
): Promise<StoreDetailsDTO | null> => {
  const store = await getStoreById(storeId);
  if (!store) return null;

  const sales = await getSalesAll(storeId);
  if (!sales.length) return null;

  const analytics = buildStoreAnalytics(store, sales);

  return {
    store: {
      id: store.id,
      name: store.name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
      rfmSegment: store.rfm_segment,
    },
    ...analytics,
  };
};
