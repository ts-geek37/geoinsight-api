import { query } from "../db";
import { Sales } from "../types";

export const getSalesAll = async (storeId: string): Promise<Sales[]> => {
  const result = await query(
    `
      SELECT *
      FROM store_sales
      WHERE store_id = $1
      ORDER BY year DESC, month DESC
    `,
    [storeId]
  );

  return result.rows as Sales[];
};
export const getYearlyStoreSales = async (
  storeId: string
): Promise<{ year: number; revenue_inr: number }[]> => {
  const result = await query(
    `
      SELECT 
        year,
        SUM(revenue_inr) AS revenue_inr
      FROM store_sales
      WHERE store_id = $1
      GROUP BY year
      ORDER BY year DESC
    `,
    [storeId]
  );

  return result.rows.map((row) => ({
    year: Number(row.year),
    revenue_inr: Number(row.revenue_inr),
  }));
};

// export async function getSalesPaginated(
//   storeId: string,
//   page: number,
//   limit: number
// ): Promise<{ rows: SalesRecord[]; total: number }> {
//   const offset = (page - 1) * limit;

//   const rowsResult = await query(
//     `
//       SELECT *
//       FROM store_sales
//       WHERE store_id = $1
//       ORDER BY year DESC, month DESC
//       LIMIT $2
//       OFFSET $3
//     `,
//     [storeId, limit, offset]
//   );

//   const totalResult = await query(
//     `SELECT COUNT(*) FROM store_sales WHERE store_id = $1`,
//     [storeId]
//   );

//   return {
//     rows: rowsResult.rows as SalesRecord[],
//     total: Number(totalResult.rows[0].count),
//   };
// }

// export async function getSalesSummary(
//   storeId: string
// ): Promise<SalesSummary | null> {
//   const result = await query(
//     `
//       SELECT
//         store_id,
//         SUM(revenue_inr) AS total_revenue,
//         SUM(transaction_count) AS total_transactions,
//         AVG(revenue_inr) AS avg_monthly_revenue,
//         AVG(avg_ticket_size) AS avg_ticket_size,
//         COUNT(*) AS months_available
//       FROM store_sales
//       WHERE store_id = $1
//       GROUP BY store_id
//     `,
//     [storeId]
//   );

//   if (!result.rows.length) return null;

//   const summary = result.rows[0] as SalesSummary;

//   const lastMonthResult = await query(
//     `
//       SELECT revenue_inr, transaction_count
//       FROM store_sales
//       WHERE store_id = $1
//       ORDER BY year DESC, month DESC
//       LIMIT 1
//     `,
//     [storeId]
//   );

//   if (lastMonthResult.rows.length) {
//     summary.last_month_revenue = lastMonthResult.rows[0].revenue_inr;
//     summary.last_month_transactions = lastMonthResult.rows[0].transaction_count;
//   }

//   return summary;
// }

// export async function createSales(record: SalesRecord): Promise<SalesRecord> {
//   const result = await query(
//     `
//       INSERT INTO store_sales (
//         store_id,
//         year,
//         month,
//         revenue_inr,
//         transaction_count,
//         avg_ticket_size
//       )
//       VALUES ($1, $2, $3, $4, $5, $6)
//       RETURNING *
//     `,
//     [
//       record.store_id,
//       record.year,
//       record.month,
//       record.revenue_inr,
//       record.transaction_count,
//       record.avg_ticket_size,
//     ]
//   );

//   return result.rows[0] as SalesRecord;
// }

// export async function updateSales(
//   id: number,
//   update: Partial<SalesRecord>
// ): Promise<SalesRecord | null> {
//   const result = await query(
//     `
//       UPDATE store_sales
//       SET
//         revenue_inr = COALESCE($1, revenue_inr),
//         transaction_count = COALESCE($2, transaction_count),
//         avg_ticket_size = COALESCE($3, avg_ticket_size)
//       WHERE id = $4
//       RETURNING *
//     `,
//     [update.revenue_inr, update.transaction_count, update.avg_ticket_size, id]
//   );

//   if (!result.rows.length) return null;

//   return result.rows[0] as SalesRecord;
// }

// export async function deleteSales(id: number): Promise<boolean> {
//   const result = await query(
//     `DELETE FROM store_sales WHERE id = $1 RETURNING id`,
//     [id]
//   );

//   return result.rows.length > 0;
// }
