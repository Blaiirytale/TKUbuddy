import dotenv from "dotenv";
import { Pool, types } from "pg";

dotenv.config();

types.setTypeParser(1700, (value) => parseFloat(value));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

export default pool;