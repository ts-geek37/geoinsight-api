import { query } from "./db";
import { calculateRFMForAllStores } from "./services/rfm";

export async function runRFMSeeder() {
  console.log("🔄 Loading stores...");
  const storeRows = await query(`SELECT id FROM stores ORDER BY id`);
  const stores: string[] = storeRows.rows.map((r: any) => r.id);

  console.log("🔄 Loading store sales...");
  const salesRows = await query(`
    SELECT store_id, year, month, revenue_inr
    FROM store_sales
    ORDER BY store_id, year, month;
  `);

  const storeSalesMap = new Map<
    string,
    { year: number; month: number; revenue_inr: number }[]
  >();

  for (const row of salesRows.rows) {
    if (!storeSalesMap.has(row.store_id)) {
      storeSalesMap.set(row.store_id, []);
    }

    storeSalesMap.get(row.store_id)!.push({
      year: row.year,
      month: row.month,
      revenue_inr: Number(row.revenue_inr),
    });
  }

  const data = stores.map((store_id) => ({
    store_id,
    sales: storeSalesMap.get(store_id) || [],
  }));

  console.log("📊 Computing RFM scores...");
  const rfmResults = calculateRFMForAllStores(data);

  console.log("💾 Saving RFM results into the database...");

  for (const r of rfmResults) {
    await query(
      `
      UPDATE stores
      SET 
        recency_score      = $1,
        frequency_score    = $2,
        monetary_score     = $3,
        rfm_score          = $4,
        rfm_segment        = $5,
        updated_at         = NOW()
      WHERE id = $6
      `,
      [
        r.recency_score,
        r.frequency_score,
        r.monetary_score,
        r.rfm_total,
        r.segment,
        r.store_id,
      ]
    );
  }

  console.log("✅ RFM seeding completed successfully.");
  process.exit(0);
}
