import { query } from "../../db";
import { RFMScore, Sales } from "../../types";
import { calculateRFMForAllStores } from "./rfmCalculator";

export const getStoreSales = async (storeId: string): Promise<Sales[]> => {
  const result = await query(
    `SELECT * FROM store_sales WHERE store_id = $1 ORDER BY year DESC, month DESC`,
    [storeId]
  );

  return result.rows as Sales[];
};

export const getRFMForAllStores = async (): Promise<RFMScore[]> => {
  const result = await query(`SELECT store_id FROM stores ORDER BY store_id`);
  const stores = result.rows.map((r: any) => r.store_id);

  const salesMap = await Promise.all(
    stores.map(async (id) => ({
      store_id: id,
      sales: await getStoreSales(id),
    }))
  );

  return calculateRFMForAllStores(salesMap);
};
