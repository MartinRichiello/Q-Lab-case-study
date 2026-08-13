# Q Lab Quality Dashboard — BMW Debrecen Case Study

A full-stack quality monitoring dashboard built for BMW Group's Q Lab (Total Vehicle Quality) case study, covering all 6 required tasks.

## Tech Stack
- **Frontend:** React + TypeScript (Vite), Recharts, TanStack Table
- **Backend:** Python, FastAPI, pandas
- **Analysis:** Jupyter Notebook (pandas, scipy, scikit-learn)

## Running the project

**Backend:**
```powershell
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```
Runs at `http://localhost:8000` (interactive API docs at `/docs`).

**Frontend:**
```powershell
cd frontend
npm run dev
```
Runs at `http://localhost:5173`.

Both must be running simultaneously for the app to work.

## Project structure