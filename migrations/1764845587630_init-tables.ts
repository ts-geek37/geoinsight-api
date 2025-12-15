import { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("postgis", { ifNotExists: true });
  pgm.createExtension("postgis_raster", { ifNotExists: true });
  pgm.createExtension("postgis_topology", { ifNotExists: true });

  pgm.createTable("stores", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    name: { type: "text", notNull: true },
    address: { type: "text" },
    city: { type: "text" },
    state: { type: "text" },
    pincode: { type: "text" },

    latitude: { type: "double precision", notNull: true },
    longitude: { type: "double precision", notNull: true },

    store_type: { type: "text" },
    size_sqft: { type: "integer" },
    opening_date: { type: "date" },
 
    recency_score: { type: "integer" },
    frequency_score: { type: "integer" },
    monetary_score: { type: "integer" },
    rfm_score: { type: "integer" },
    rfm_segment: { type: "text" },

    created_at: { type: "timestamptz", default: pgm.func("NOW()") },
    updated_at: { type: "timestamptz", default: pgm.func("NOW()") },
  });
 
  pgm.addColumn("stores", {
    geom: { type: "geometry(Point, 4326)" },
  });
 
  pgm.sql(`
    UPDATE stores
    SET geom = ST_SetSRID(ST_Point(longitude, latitude), 4326);
  `);
 
  pgm.createIndex("stores", "geom", { method: "gist" });

 
  pgm.createTable("store_sales", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    store_id: {
      type: "uuid",
      notNull: true,
      references: "stores",
      onDelete: "CASCADE",
    },

    year: { type: "integer", notNull: true },
    month: { type: "integer", notNull: true },

    revenue_inr: { type: "numeric(14,2)", notNull: true },
    transaction_count: { type: "integer", notNull: true },
    avg_ticket_size: { type: "numeric(10,2)" },

    created_at: { type: "timestamptz", default: pgm.func("NOW()") },
  });

  pgm.createIndex("store_sales", ["store_id"]);
  pgm.createIndex("store_sales", ["year", "month"]);

 
  pgm.createTable("area_profiles", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    area_name: { type: "text" },
    city: { type: "text" },
    state: { type: "text" },

    latitude: { type: "double precision", notNull: true },
    longitude: { type: "double precision", notNull: true },
 
    population_1km: "integer",
    population_3km: "integer",
    population_5km: "integer",

    literacy_rate: "numeric(6,3)",
    age_25_55_pct: "numeric(6,3)",
    gender_ratio: "integer",
    worker_pct: "numeric(6,3)",

    population_density: "numeric(12,2)",
    income_high_percentage: "numeric(6,3)",
    urban_score: "numeric(6,3)",
 
    restaurants: "integer",
    hotels: "integer",
    bars: "integer",
    clubs: "integer",

    poi_total: "integer",
    poi_normalized: "numeric(6,4)",
 
    road_connectivity_score: "numeric(6,3)",
 
    similarity_score: "numeric(6,3)",
    priority_score: "numeric(12,2)",

    created_at: { type: "timestamptz", default: pgm.func("NOW()") },
    updated_at: { type: "timestamptz", default: pgm.func("NOW()") },
  });
 
  pgm.addColumn("area_profiles", {
    geom: { type: "geometry(Point, 4326)" },
  });
 
  pgm.sql(`
    UPDATE area_profiles
    SET geom = ST_SetSRID(ST_Point(longitude, latitude), 4326);
  `);
 
  pgm.createIndex("area_profiles", "geom", { method: "gist" });

  pgm.createIndex("area_profiles", ["city"]);
  pgm.createIndex("area_profiles", ["state"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("store_sales");
  pgm.dropTable("stores");
  pgm.dropTable("area_profiles");

  pgm.dropExtension("postgis_topology");
  pgm.dropExtension("postgis_raster");
  pgm.dropExtension("postgis");
}
