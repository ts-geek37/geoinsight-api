import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

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
  try {
    const result = await pool.query(text, params);

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
