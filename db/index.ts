import { Pool } from "pg";

const connectionString = process.env.POSTGRES_URI;

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export default {
  query: (text: string, params: any[]) => pool.query(text, params),
};
