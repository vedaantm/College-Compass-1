// import.js
const fs = require('fs');
const csv = require('csv-parser');
const db = require('./db');

const results = [];

fs.createReadStream('data/universities.csv')
  .pipe(csv())
  .on('data', (row) => results.push(row))
  .on('end', () => {
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT INTO universities (
          university_name, city, state, acceptance_rate, in_state_tuition, out_of_state_tuition,
          cost_of_attendance, graduation_rate, median_salary, average_gpa, average_gre_score,
          rank_2025, rank_2024, location, location_full, size, academic_reputation, employer_reputation,
          faculty_student, citations_per_faculty, international_faculty, international_students,
          international_research_network, employment_outcomes, sustainability, qs_overall_score,
          ms_courses_offered
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      results.forEach((row) => {
        stmt.run([
          row['University Name'],
          row['City'],
          row['State'],
          parseFloat(row['Acceptance Rate']) || null,
          parseInt(row['In-State Tuition']) || null,
          parseInt(row['Out-of-State Tuition']) || null,
          parseInt(row['Cost of Attendance']) || null,
          parseFloat(row['Graduation Rate']) || null,
          parseInt(row['Median Salary']) || null,
          parseFloat(row['Average GPA']) || null,
          parseInt(row['Average GRE Score']) || null,
          parseInt(row['2025 Rank']) || null,
          parseInt(row['2024 Rank']) || null,
          row['Location'],
          row['Location Full'],
          row['Size'],
          parseFloat(row['Academic Reputation']) || null,
          parseFloat(row['Employer Reputation']) || null,
          parseFloat(row['Faculty Student']) || null,
          parseFloat(row['Citations per Faculty']) || null,
          parseFloat(row['International Faculty']) || null,
          parseFloat(row['International Students']) || null,
          parseFloat(row['International Research Network']) || null,
          parseFloat(row['Employment Outcomes']) || null,
          parseFloat(row['Sustainability']) || null,
          parseFloat(row['QS Overall Score']) || null,
          row['MS Courses Offered']
        ]);
      });

      stmt.finalize(() => {
        console.log(`✅ Import complete: ${results.length} universities added.`);
        db.close();
      });
    });
  });
