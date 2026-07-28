# College Compass

An ML-powered university recommender for prospective MS students — matches GPA, GRE, budget, and course interest against 6,484 US universities (sourced from the Department of Education's College Scorecard dataset), and generates a draft Statement of Purpose via a local LLM.

Individual project — designed, built, and iterated on solo.

## Architecture

The app is three independent services, run separately during local development:

| Service | Tech | Port | What it does |
|---|---|---|---|
| `backend/` | Node.js + Express + SQLite | 3000 | Auth (bcrypt), university search/CRUD, serves the frontend |
| `ml-service/` | Python + Flask + XGBoost + FastText | 5000 | `/recommend` — predicts a compatible QS-score tier from GPA/GRE/tuition, matches course interest via FastText embeddings + cosine similarity |
| `sop-service/` | Python + Flask + Ollama | 5001 | Generates a draft Statement of Purpose using a locally-hosted LLM (DeepSeek-R1 via Ollama) |

The frontend (served from `backend/public/`) calls all three: relative `/api/*` calls hit the Node backend on the same origin, while `homepage.html` calls `ml-service` cross-origin at `http://localhost:5000/recommend` (hence `flask-cors` on that service only).

## Setup

**1. Backend**
```bash
cd backend
npm install
node index.js
```

**2. ML service**
```bash
cd ml-service
pip install -r requirements.txt
```
Then download the pretrained FastText English vectors (not committed — it's ~7GB):
```python
import fasttext.util
fasttext.util.download_model('en', if_exists='ignore')  # produces cc.en.300.bin
```
Place `cc.en.300.bin` in `ml-service/`, then:
```bash
python app.py
```

**3. SOP service**
```bash
cd sop-service
pip install -r requirements.txt
ollama pull deepseek-r1:1.5b   # requires Ollama installed locally
python app.py
```

## The model: two versions, on purpose

`ml-service/xgb_qs_model_v1_deprecated.pkl` and `xgb_qs_model_1.pkl` are both included deliberately, not as clutter:

- **v1** was trained on ~15 features, including rank and reputation scores, and scored a suspicious R² of 0.99. Cross-validation exposed it as data leakage — those features are themselves proxies for the QS score being predicted. One fold's R² collapsed to roughly -1.09 × 10¹⁸.
- **v2** (`xgb_qs_model_1.pkl`, the one actually deployed) retrains on only the three inputs a real applicant would provide — GPA, GRE, and out-of-state tuition. Harder, honest problem. RMSE 26.44, R² ≈ 0.25 on the test set, 0.29 average across 5-fold cross-validation.

Full training/evaluation code, including the leakage discovery, is in `ml-service/notebooks/`.

## Data

- `final_university_data.csv` / `universities.csv` — cleaned to 6,484–6,561 US universities (26–30 fields), derived from the Department of Education's [College Scorecard](https://collegescorecard.ed.gov/data/) "Most Recent Cohorts (Institution)" dataset (~3,300 raw columns). The raw source file is not committed (it's 104MB, over GitHub's limit) — download it directly from the link above if you need to reproduce the cleaning pipeline.
- `universities.csv` in `ml-service/` additionally carries a precomputed `course_vector` column (FastText sentence embeddings per university's course list), generated in `notebooks/modeltrain_ft.ipynb`.

## Notes on what's *not* in this repo

- Two early `auth.js` files (one at the project root, one under `routes/`) were dropped — neither was ever actually wired into `backend/index.js`, which has its own inline signup/login logic. They were dead code from an earlier refactor attempt.
- `UI_Form_Sop.html` was dropped — an orphaned draft page never referenced by any route or script.
