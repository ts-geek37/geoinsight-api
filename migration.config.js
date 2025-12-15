require("ts-node/register");
require("dotenv").config();

module.exports = {
  migrationsTable: "pgmigrations",
  dir: "migrations",
  extension: "ts",
  databaseUrl: process.env.DATABASE_URL,
};
