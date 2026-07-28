// db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the database (path is relative to this file, not the working directory,
// so `node backend/index.js` works the same as `cd backend && node index.js`)
const db = new sqlite3.Database(path.join(__dirname, 'college_compass.db'), (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Universities table
  db.run(`
    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_name TEXT,
      city TEXT,
      state TEXT,
      state_name TEXT,          
      acceptance_rate REAL,
      in_state_tuition INTEGER,
      out_of_state_tuition INTEGER,
      cost_of_attendance INTEGER,
      graduation_rate REAL,
      median_salary INTEGER,
      average_gpa REAL,
      average_gre_score INTEGER,
      rank_2025 INTEGER,
      rank_2024 INTEGER,
      location TEXT,
      location_full TEXT,
      size TEXT,
      academic_reputation REAL,
      employer_reputation REAL,
      faculty_student REAL,
      citations_per_faculty REAL,
      international_faculty REAL,
      international_students REAL,
      international_research_network REAL,
      employment_outcomes REAL,
      sustainability REAL,
      qs_overall_score REAL,
      ms_courses_offered TEXT
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating universities table:', err.message);
    } else {
      console.log('✅ universities table ready.');
    }
  });

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
    } else {
      console.log('✅ users table ready.');
    }
  });
});

module.exports = db;
