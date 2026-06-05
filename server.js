const express = require('express');
const { createClient } = require('@clickhouse/client');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ClickHouse client
const ch = createClient({
  url:      process.env.CH_URL      || 'http://localhost:8123',
  username: process.env.CH_USER     || 'default',
  password: process.env.CH_PASSWORD || '',
  database: process.env.CH_DATABASE || 'default',
});

// Only allow SELECT queries
function isSafeQuery(sql) {
  return /^\s*SELECT\s/i.test(sql.trim());
}

app.post('/api/query', async (req, res) => {
  const { sql } = req.body;
  if (!sql || !isSafeQuery(sql)) {
    return res.status(400).json({ error: 'Only SELECT queries allowed' });
  }
  try {
    const result = await ch.query({ query: sql, format: 'JSONEachRow' });
    const rows = await result.json();
    res.json({ data: { rows } });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

// Serve index.html for everything else
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Squad Analytics running on port ${PORT}`));
