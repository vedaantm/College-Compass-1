document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/universities")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#universityTable tbody");

      const renderTable = (filteredData) => {
        tbody.innerHTML = ""; // Clear previous rows
        filteredData.forEach(uni => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${uni.university_name || '-'}</td>
            <td>${uni.city || '-'}</td>
            <td>${uni.state_name || '-'}</td>
            <td>${uni.acceptance_rate !== null && uni.acceptance_rate !== '' ? uni.acceptance_rate : '-'}</td>
            <td>${uni.in_state_tuition !== null && uni.in_state_tuition !== '' ? `$${uni.in_state_tuition}` : '-'}</td>
            <td>${uni.out_of_state_tuition !== null && uni.out_of_state_tuition !== '' ? `$${uni.out_of_state_tuition}` : '-'}</td>
            <td>${uni.cost_of_attendance !== null && uni.cost_of_attendance !== '' ? `$${uni.cost_of_attendance}` : '-'}</td>
            <td>${uni.graduation_rate !== null && uni.graduation_rate !== '' ? uni.graduation_rate : '-'}</td>
            <td>${uni.median_salary !== null && uni.median_salary !== '' ? `$${uni.median_salary}` : '-'}</td>
            <td>${uni.average_gpa !== null && uni.average_gpa !== '' ? uni.average_gpa : '-'}</td>
            <td>${uni.average_gre_score !== null && uni.average_gre_score !== '' ? uni.average_gre_score : '-'}</td>
            <td>${uni.rank_2025 || '-'}</td>
            <td>${uni.rank_2024 || '-'}</td>
            <td>${uni.location || '-'}</td>
            <td>${uni.location_full || '-'}</td>
            <td>${uni.size || '-'}</td>
            <td>${uni.academic_reputation !== null && uni.academic_reputation !== '' ? uni.academic_reputation : '-'}</td>
            <td>${uni.employer_reputation !== null && uni.employer_reputation !== '' ? uni.employer_reputation : '-'}</td>
            <td>${uni.faculty_student !== null && uni.faculty_student !== '' ? uni.faculty_student : '-'}</td>
            <td>${uni.citations_per_faculty !== null && uni.citations_per_faculty !== '' ? uni.citations_per_faculty : '-'}</td>
            <td>${uni.international_faculty !== null && uni.international_faculty !== '' ? uni.international_faculty : '-'}</td>
            <td>${uni.international_students !== null && uni.international_students !== '' ? uni.international_students : '-'}</td>
            <td>${uni.international_research_network !== null && uni.international_research_network !== '' ? uni.international_research_network : '-'}</td>
            <td>${uni.employment_outcomes !== null && uni.employment_outcomes !== '' ? uni.employment_outcomes : '-'}</td>
            <td>${uni.sustainability !== null && uni.sustainability !== '' ? uni.sustainability : '-'}</td>
            <td>${uni.qs_overall_score !== null && uni.qs_overall_score !== '' ? uni.qs_overall_score : '-'}</td>
            <td>
              ${uni.ms_courses_offered 
                ? `<div class="course-list">
                    ${uni.ms_courses_offered.split(',').map(course => 
                      `<span class="course-item">${course.trim()}</span>`).join('')}
                  </div>` 
                : '-'}
            </td>
          `;
          tbody.appendChild(row);
        });
      };

      // Initial full render
      renderTable(data);

      // Search logic
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          const query = searchInput.value.toLowerCase();
          const filtered = data.filter(uni => 
            (uni.university_name || '').toLowerCase().includes(query)
          );
          renderTable(filtered);
        });
      }
    
      const locationInput = document.getElementById("locationSearchInput");
      locationInput.addEventListener("input", () => {
        const locationQuery = locationInput.value.toLowerCase();
        const filtered = data.filter(uni =>
          (uni.state_name || '').toLowerCase().includes(locationQuery)
        );
        renderTable(filtered);
      });
    })

    .catch(err => {
      console.error("Error loading data:", err);
    });
});
