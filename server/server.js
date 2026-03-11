import 'dotenv/config';
import process from 'node:process';
import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', ping: result.rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'error', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
