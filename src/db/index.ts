import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("connect", () => {
  console.log("PostgreSQL pool connected");
});

pool.on("error", (err) => {
  console.error("Unexpected PG pool error:", err);
});

export const query = async (text: string, params?: any[]) => {
  console.log("Executing query:", {
    text,
    paramsCount: params?.length ?? 0,
  });

  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    console.log("Query success", {
      rowCount: result.rowCount,
      durationMs: Date.now() - start,
    });
    return result;
  } catch (error) {
    console.error("Query failed", {
      text,
      params,
      error,
    });
    throw error;
  }
};
