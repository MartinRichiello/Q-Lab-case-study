"""
main.py
-------
This is the entry point of the backend server (similar in role to
`index.js` in a Node project).

Running this file starts a small local web server. Once running, other
programs (like our future React frontend) can send it requests and get
data back — this is how frontend and backend "talk" to each other.

We use FastAPI: a Python framework for building this kind of web API
quickly, with good defaults (like automatic interactive API docs, which
we'll see in a moment).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.data import QUALITY_DATA

# Create the actual application object. This "app" variable is what
# the server (uvicorn) will run.
app = FastAPI(title="Q Lab Quality Dashboard API")

# --- CORS setup ---
# CORS = Cross-Origin Resource Sharing.
# By default, browsers block a webpage running on one address
# (e.g. http://localhost:5173, where our React app will run) from making
# requests to a server running on a different address
# (e.g. http://localhost:8000, this backend) — for security reasons.
# Since our frontend and backend are two separate projects running on
# two separate addresses, we need to explicitly tell the backend:
# "it's fine, allow requests from the frontend's address."
# For local development, allowing all origins ("*") is simplest and safe
# enough (we'll tighten this if we ever deploy it publicly).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """
    A simple 'is the server alive' check.
    Visiting http://localhost:8000/ in a browser should show this message.
    """
    return {"message": "Q Lab Quality Dashboard API is running."}


@app.get("/defects")
def get_defects():
    """
    Returns all defect records as JSON.

    This is the first real data endpoint. Later (Task 1), the frontend
    will call this URL to get the data it needs to build the table and
    charts.

    For now, this returns EVERYTHING with no filtering — that's fine at
    this stage since we're just proving the connection works. Filtering,
    pagination, etc. can be added later once the frontend actually needs it.

    Note: QUALITY_DATA is a pandas DataFrame (a table). FastAPI can't send
    a DataFrame directly over the web — we convert it to a list of plain
    Python dictionaries first (one dictionary per row), which FastAPI then
    automatically converts to JSON.
    """
    return QUALITY_DATA.to_dict(orient="records")




##cd backend
##venv\Scripts\activate
## python -m uvicorn app.main:app --reload