import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
if (process.cwd().endsWith('utils')) { // Adjust path if running from utils directory
  dotenv.config({
      path: process.cwd() + '/../../.env'
  });
} else {
  dotenv.config({
     path: process.cwd() + '/.env'
  });
}

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'dbgis',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: false,
  max: process.env.DB_MAX_POOL ? parseInt(process.env.DB_MAX_POOL) : 10,
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
export { testDBConnection, runQuery, pool };



