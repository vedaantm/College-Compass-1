// index.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🎯 Root route
app.get('/', (req, res) => {
  res.send('🎓 College Compass API is live!');
});

// 🔐 Signup Route
app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide all fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';

    db.run(query, [name, email, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User created successfully', userId: this.lastID });
    });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed. Try again later.' });
  }
});

// 🔓 Login Route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    res.json({ message: 'Login successful', userId: user.id, name: user.name });
  });
});

// 🏫 Get all universities
app.get('/api/universities', (req, res) => {
  db.all('SELECT * FROM universities', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 📌 Get university by ID
app.get('/api/universities/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM universities WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'University not found' });
    res.json(row);
  });
});

// 🔍 Search universities
app.get('/api/search', (req, res) => {
  const { name, state } = req.query;
  let query = 'SELECT * FROM universities WHERE 1=1';
  const params = [];

  if (name) {
    query += ' AND university_name LIKE ?';
    params.push(`%${name}%`);
  }

  if (state) {
    query += ' AND state = ?';
    params.push(state);
  }

  db.all(query + ' LIMIT 100', params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ⚠️ DEV ONLY: View all users (Don't use in production!)
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, email FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 🖥 Serve dashboard.html for all non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
function loadUniversityData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(path.join(__dirname, 'data', 'universities.csv'))
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}
// 🔍 Get university by name
app.get('/api/get_university', async (req, res) => {
  const nameQuery = req.query.name?.toLowerCase();
  if (!nameQuery) return res.status(400).json({ error: 'University name required' });

  try {
    const universities = await loadUniversityData();
    const match = universities.find(u => u["University Name"].toLowerCase() === nameQuery);

    if (match) {
      res.json({ status: 'success', data: match });
    } else {
      res.status(404).json({ status: 'error', message: 'University not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error loading university data' });
  }
});

