
import dotenv from "dotenv";
import { Pool, types } from "pg";

dotenv.config();

types.setTypeParser(1700, (value) => parseFloat(value));

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;
