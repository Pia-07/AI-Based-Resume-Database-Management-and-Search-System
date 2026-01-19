# SmartHire – Resume-aware HR RAG Prototype

End-to-end minimal working prototype:
- Backend: FastAPI with PDF ingestion, resume parsing, semantic embedding, and candidate search.
- Frontend: React (Vite) UI for uploading resumes and searching with a job description.

## Backend (FastAPI)
```bash
cd Backend/app
python -m venv .venv
.venv\Scripts\activate       # on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Key endpoints:
- `GET /api/health` – index status
- `POST /api/resumes` – upload PDF resume (multipart form)
- `POST /api/search` – search with job_description, required_skills, top_k, location

Data is stored locally in `data/resumes.json`. Temp PDFs are written to `temp/`.

## Frontend (React)
```bash
cd ..
npm install
npm run dev   # defaults to http://localhost:5173
```

API base defaults to `http://localhost:8000/api`. Override with `VITE_API_BASE`.

## What works now
- Upload a resume PDF → parse text → extract skills/experience/email/phone → embed and index.
- Submit a JD + required skills → semantic + skill-overlap ranking → explanations with matched skills and raw text snippet.

## Notes / Next Steps
- Swap the embedding model or add reranking as needed.
- Add authentication, PII handling, and persistence (Postgres/pgvector) for production.
