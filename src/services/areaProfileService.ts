import { query } from "../db";
import { AreaProfile } from "../types";

export const getNearestAreaProfile = async (
  lat: number,
  lon: number
): Promise<AreaProfile | null> => {
  const ops = `
    SELECT *,
      ST_Distance(
        geom::geography,
        ST_SetSRID(ST_Point($2, $1), 4326)::geography
      ) AS distance
    FROM area_profiles
    ORDER BY geom <-> ST_SetSRID(ST_Point($2, $1), 4326)
    LIMIT 1;
  `;

  const result = await query(ops, [lat, lon]);
  if (result.rows.length === 0) return null;
  return result.rows[0] as AreaProfile;
};

export const getAreaProfileById = async (
  id: string
): Promise<AreaProfile | null> => {
  const res = await query(`SELECT * FROM area_profiles WHERE id = $1`, [id]);
  return res.rows[0] || null;
};
