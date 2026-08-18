require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { gatherAll } = require('./services/fetchNews');
const { rankHeadlines } = require('./services/rankNews');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory cache so hammering refresh doesn't burn API calls.
// Clears itself after 10 minutes.
let cache = { data: null, timestamp: 0 };
const CACHE_MS = 10 * 60 * 1000;

app.get('/api/briefing', async (req, res) => {
  const forceFresh = req.query.fresh === 'true';
  const now = Date.now();

  if (!forceFresh && cache.data && now - cache.timestamp < CACHE_MS) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const items = await gatherAll();

    if (items.length === 0) {
      return res.status(502).json({
        error: 'No headlines could be fetched from any source feed. Check server logs.'
      });
    }

    const ranked = await rankHeadlines(items);
    const payload = { stories: ranked.stories || [], generatedAt: new Date().toISOString() };

    cache = { data: payload, timestamp: now };
    res.json({ ...payload, cached: false });
  } catch (err) {
    console.error('[server] /api/briefing failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Morning Briefing running at http://localhost:${PORT}`);
});
