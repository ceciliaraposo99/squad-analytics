/**
 * server.js — Squad Analytics backend para Railway
 *
 * Serve o index.html estático e expõe POST /api/query
 * que faz proxy das queries SQL para o InCred Mesh (ClickHouse HTTP).
 *
 * Variáveis de ambiente necessárias no Railway:
 *   MESH_URL      → URL HTTP do ClickHouse, ex: https://ch.incredhq.com
 *   MESH_USER     → usuário do ClickHouse
 *   MESH_PASSWORD → senha do ClickHouse
 *   MESH_DB       → database (default: default)
 *   PORT          → porta (Railway injeta automaticamente)
 */

const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve o index.html e assets estáticos da pasta raiz
app.use(express.static(path.join(__dirname)));

// ── /api/query ─────────────────────────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  const { sql } = req.body || {};
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'Campo "sql" obrigatório.' });
  }

  const MESH_URL = process.env.MESH_URL;
  const MESH_USER = process.env.MESH_USER;
  const MESH_PASSWORD = process.env.MESH_PASSWORD;
  const MESH_DB = process.env.MESH_DB || 'default';

  if (!MESH_URL || !MESH_USER || !MESH_PASSWORD) {
    console.error('[api/query] Variáveis de ambiente do Mesh não configuradas.');
    return res.status(500).json({
      error: 'Mesh não configurado. Defina MESH_URL, MESH_USER e MESH_PASSWORD no Railway.'
    });
  }

  try {
    // ClickHouse HTTP interface: POST com o SQL no body, formato JSON cada linha
    const chUrl = new URL('/');
    chUrl.host = new URL(MESH_URL).host;
    chUrl.protocol = new URL(MESH_URL).protocol;
    chUrl.searchParams.set('database', MESH_DB);
    chUrl.searchParams.set('default_format', 'JSONEachRow');

    const chRes = await fetch(chUrl.toString(), {
      method: 'POST',
      headers: {
        'X-ClickHouse-User': MESH_USER,
        'X-ClickHouse-Key': MESH_PASSWORD,
        'Content-Type': 'text/plain',
      },
      body: sql + ' FORMAT JSONEachRow',
    });

    const text = await chRes.text();

    if (!chRes.ok) {
      console.error('[api/query] ClickHouse error:', chRes.status, text.slice(0, 300));
      return res.status(502).json({ error: `ClickHouse retornou ${chRes.status}: ${text.slice(0, 200)}` });
    }

    // JSONEachRow → uma linha JSON por row; parsear cada linha
    const rows = text
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);

    return res.json({ rows });

  } catch (err) {
    console.error('[api/query] Fetch error:', err.message);
    return res.status(502).json({ error: `Erro de conexão com o Mesh: ${err.message}` });
  }
});

// Fallback: qualquer rota desconhecida serve o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Squad Analytics rodando na porta ${PORT}`);
});
