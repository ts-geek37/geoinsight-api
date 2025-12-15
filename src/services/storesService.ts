import { query } from "../db";
import { Sales, Store } from "../types";
import { getNearestAreaProfile } from "./areaProfileService";
import { getSalesAll } from "./salesService";

export const getStores = async (): Promise<Store[]> => {
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
      GROUP BY store_id, year
    ) ss ON ss.store_id = s.id
    GROUP BY s.id
    ORDER BY s.city, s.name
    `
  );

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

// export const searchStores = async (searchText: string): Promise<Store[]> => {
//   const like = `%${searchText}%`;
//   console.log("like", like);
//   const result = await query(
//     `SELECT *
//      FROM stores
//      WHERE LOWER(name) LIKE LOWER($1)
//         OR LOWER(city) LIKE LOWER($1)
//         OR LOWER(state) LIKE LOWER($1)
//         OR pincode LIKE $1
//         OR address LIKE $1
//      ORDER BY city, name`,
//     [like]
//   );
//   console.log("res", result.rows);
//   return result.rows as Store[];
// };

// export const createStore = async (store: Partial<Store>): Promise<Store> => {
//   const result = await query(
//     `INSERT INTO stores
//      (store_id, name, address, city, state, pincode, latitude, longitude, store_type, size_sqft, opening_date)
//      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
//      RETURNING *`,
//     [
//       store.store_id,
//       store.name,
//       store.address,
//       store.city,
//       store.state,
//       store.pincode,
//       store.latitude,
//       store.longitude,
//       store.store_type,
//       store.size_sqft,
//       store.opening_date,
//     ]
//   );

//   return result.rows[0] as Store;
// };

// export const updateStore = async (
//   storeId: string,
//   updated: Partial<Store>
// ): Promise<Store | null> => {
//   const result = await query(
//     `UPDATE stores
//      SET name = COALESCE($1, name),
//          address = COALESCE($2, address),
//          city = COALESCE($3, city),
//          state = COALESCE($4, state),
//          pincode = COALESCE($5, pincode),
//          latitude = COALESCE($6, latitude),
//          longitude = COALESCE($7, longitude),
//          store_type = COALESCE($8, store_type),
//          size_sqft = COALESCE($9, size_sqft),
//          opening_date = COALESCE($10, opening_date)
//      WHERE store_id = $11
//      RETURNING *`,
//     [
//       updated.name,
//       updated.address,
//       updated.city,
//       updated.state,
//       updated.pincode,
//       updated.latitude,
//       updated.longitude,
//       updated.store_type,
//       updated.size_sqft,
//       updated.opening_date,
//       storeId,
//     ]
//   );

//   if (!result.rows.length) return null;
//   return result.rows[0] as Store;
// };

// export const deleteStore = async (storeId: string): Promise<boolean> => {
//   const result = await query(`DELETE FROM stores WHERE store_id = $1`, [
//     storeId,
//   ]);
//   return result.rowCount > 0;
// };

// export const getStoresByRFMSegment = async (
//   segment: string
// ): Promise<Store[]> => {
//   const result = await query(
//     `SELECT *
//      FROM stores
//      WHERE rfm_segment = $1`,
//     [segment]
//   );

//   return result.rows as Store[];
// };
