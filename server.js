const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'leaderboard.json');

app.use(express.json());

// Serve static files (login.html, success.html, images, etc.)
app.use(express.static(__dirname));

// ── Helper: read leaderboard data ──────────────────────────────────────────
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { users: {} };
  }
}

// ── Helper: write leaderboard data ─────────────────────────────────────────
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── GET /api/leaderboard ────────────────────────────────────────────────────
// Returns top users sorted by login count
app.get('/api/leaderboard', (req, res) => {
  const data = readData();
  const list = Object.entries(data.users)
    .map(([username, info]) => ({ username, ...info }))
    .sort((a, b) => b.loginCount - a.loginCount)
    .slice(0, 10); // top 10
  res.json(list);
});

// ── POST /api/leaderboard/login ─────────────────────────────────────────────
// Records a login for the given username
app.post('/api/leaderboard/login', (req, res) => {
  const { username, ip } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'username required' });
  }

  const data = readData();

  if (!data.users[username]) {
    data.users[username] = { loginCount: 0, lastLogin: null, ip: null };
  }

  data.users[username].loginCount += 1;
  data.users[username].lastLogin = new Date().toISOString();
  data.users[username].ip = ip || null;

  writeData(data);

  res.json({ ok: true, loginCount: data.users[username].loginCount });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Login page: http://localhost:${PORT}/login.html`);
});
