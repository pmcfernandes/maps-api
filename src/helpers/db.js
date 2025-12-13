import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  ssl: false,
});

const testDBConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Database connection error', err);
  } finally {
    if (client) client.release();
  }
};

const runQuery = async (text, params) => {
  const start = Date.now();
  let client;

  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Error executing query', { text, err });
    throw err;
  } finally {
    if (client) client.release();
  }
};
export { testDBConnection, runQuery };



