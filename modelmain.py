import pandas as pd
import numpy as np
import joblib
import os
from sklearn.metrics.pairwise import cosine_similarity
from fasttext import load_model

# Resolve paths relative to this file, not the working directory the
# server happens to be launched from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load data and models once (to avoid reloading every request)
df = pd.read_csv(os.path.join(BASE_DIR, "universities.csv"))
model = joblib.load(os.path.join(BASE_DIR, "xgb_qs_model_1.pkl"))
fasttext_model = load_model(os.path.join(BASE_DIR, "cc.en.300.bin"))  # download separately, see README

# Convert necessary columns to numeric
df['QS Overall Score'] = pd.to_numeric(df['QS Overall Score'], errors='coerce')
df['Out-of-State Tuition'] = pd.to_numeric(df['Out-of-State Tuition'], errors='coerce')
df['Average GPA'] = pd.to_numeric(df['Average GPA'], errors='coerce')
df['Average GRE Score'] = pd.to_numeric(df['Average GRE Score'], errors='coerce')

# --- COURSE MAPPING DICTIONARY ---
course_aliases = {
    "MS in Biomedical Sciences": ["molecular biology", "biochemistry", "genetics", "microbiology", "clinical research", "human physiology", "immunology", "biotechnology"],
    "MS in Business Analysis": ["business analytics", "decision sciences", "operations research", "quantitative business", "enterprise analytics"],
    "MS in Business Analytics": ["data analytics", "predictive modeling", "marketing analytics", "analytics in finance", "supply chain analytics"],
    "MS in Chemistry": ["analytical chemistry", "organic chemistry", "physical chemistry", "polymer science", "industrial chemistry"],
    "MS in Civil Engineering": ["structural engineering", "urban planning", "environmental engineering", "geotechnical engineering", "water resources engineering", "architecture", "construction management"],
    "MS in Computer Science": ["ai", "ml", "cloud computing", "artificial intelligence", "machine learning", "web development", "software engineering", "frontend development", "backend development", "app development", "full-stack development", "computer vision", "natural language processing", "deep learning"],
    "MS in Criminal Justice": ["law enforcement", "forensic science", "crime scene investigation", "homeland security", "criminology"],
    "MS in Cybersecurity": ["information security", "ethical hacking", "digital forensics", "network security", "penetration testing"],
    "MS in Data Science": ["data mining", "statistical modeling", "big data", "data engineering", "applied statistics", "business intelligence"],
    "MS in Education": ["curriculum design", "educational technology", "special education", "teacher education", "instructional design", "pedagogy"],
    "MS in Electrical Engineering": ["electronics", "signal processing", "power systems", "telecommunications", "embedded systems", "robotics", "semiconductors"],
    "MS in Finance": ["investment banking", "financial engineering", "financial analytics", "quantitative finance", "corporate finance", "fintech"],
    "MS in Information Systems": ["MIS", "IT management", "enterprise systems", "ERP systems", "database management", "systems analysis"],
    "MS in Management": ["general management", "strategic leadership", "organizational behavior", "operations management", "international business"],
    "MS in Marketing": ["digital marketing", "brand management", "market research", "consumer psychology", "advertising strategy"],
    "MS in Mechanical Engineering": ["thermodynamics", "fluid mechanics", "automotive engineering", "aerospace", "manufacturing systems"],
    "MS in Nursing": ["nurse practitioner", "clinical nursing", "healthcare informatics", "psychiatric nursing"],
    "MS in Public Health": ["epidemiology", "health policy", "biostatistics", "global health", "community health"]
}

def map_to_standard_course(user_input):
    user_input_lower = user_input.lower()
    for standard, aliases in course_aliases.items():
        if user_input_lower == standard.lower():
            return standard
        for alias in aliases:
            if alias in user_input_lower:
                return standard
    return None

def get_sentence_vector(sentence):
    return fasttext_model.get_sentence_vector(sentence)

def get_best_matching_course(course_list, user_vec, threshold=0.5):
    courses = [c.strip() for c in course_list.split(',')]
    sims = [cosine_similarity([user_vec], [get_sentence_vector(c)])[0][0] for c in courses]
    max_sim = max(sims)
    best_course = courses[np.argmax(sims)]

    if max_sim < threshold:
        return None, max_sim
    return best_course, max_sim

def recommend_university(user_course_raw, tuition, gpa, gre):
    user_vec = get_sentence_vector(user_course_raw)

    user_input = pd.DataFrame({
        'Out-of-State Tuition': [tuition],
        'Average GPA': [gpa],
        'Average GRE Score': [gre]
    })

    predicted_qs = model.predict(user_input)[0]
    df['qs_diff'] = abs(df['QS Overall Score'] - predicted_qs)

    df[['best_course_match', 'course_similarity']] = df.apply(
        lambda row: pd.Series(get_best_matching_course(row['MS Courses Offered'], user_vec)),
        axis=1
    )

    df['course_match_found'] = df['best_course_match'].notnull()

    df['best_course_match'] = df.apply(
        lambda row: map_to_standard_course(user_course_raw) if not row['course_match_found'] else row['best_course_match'],
        axis=1
    )

    df['course_match_found'] = df['best_course_match'].notnull()
    filtered_df = df[df['course_match_found']]

    if filtered_df.empty:
        return []

    top_matches = filtered_df.sort_values(by=['qs_diff', 'course_similarity'], ascending=[True, False]).head(10)
    filtered_df.replace({np.nan: None}, inplace=True)

    result_list = []
    for _, row in top_matches.iterrows():
        result_list.append({
            'University': row['University Name'],
            'Courses Offered': row['MS Courses Offered'],
            'Best Match': row['best_course_match'],
            'Tuition': float(row['Out-of-State Tuition']) if pd.notna(row['Out-of-State Tuition']) else None,
            'GPA': float(row['Average GPA']) if pd.notna(row['Average GPA']) else None,
            'GRE': float(row['Average GRE Score']) if pd.notna(row['Average GRE Score']) else None,
            'Predicted QS Score': round(float(predicted_qs), 2),
            'University QS Score': float(row['QS Overall Score']) if pd.notna(row['QS Overall Score']) else None,
            'Course Match Score': round(float(row['course_similarity']) * 100, 2) if pd.notna(row['course_similarity']) else None
        })

    return result_list