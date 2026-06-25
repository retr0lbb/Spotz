import { Pool } from "pg"

export async function setupPostGIS(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('[PostGIS] Extension ready');
  } catch (error) {
    console.error('[PostGIS] Failed to setup extension:', error);
    throw error;
  } finally {
    client.release();
  }
}