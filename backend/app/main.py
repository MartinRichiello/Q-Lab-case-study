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
from app.outliers import (
    detect_dynamic_outliers,
    detect_severity_outliers,
    compute_defects_per_day_outliers,
    compute_grouped_kpi_outliers,
)

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


@app.get("/outliers")
def get_outliers():
    """
    Returns outlier detection results for all monitored metrics, combining
    both detection methods used in this project (see outliers.py for the
    full reasoning behind each choice):

    - Dynamic (statistical, mean + 2 std dev): resolution time, rework
      time, and defects per day — metrics where "normal" can genuinely
      shift over time/conditions.
    - Static (fixed hard limit): severity rating — a metric with a fixed,
      domain-defined meaning that shouldn't depend on this batch's data.

    The frontend uses this to mark outlier points visually on charts, and
    to power the "info button" explanations required by the case study
    (each result includes the actual threshold/mean/std_dev used, not
    just a yes/no flag).
    """
    return {
        "resolution_time_days": detect_dynamic_outliers(QUALITY_DATA, "resolution_time_days"),
        "rework_time_minutes": detect_dynamic_outliers(QUALITY_DATA, "rework_time_minutes"),
        "defects_per_day": compute_defects_per_day_outliers(QUALITY_DATA),
        "severity_category": detect_severity_outliers(QUALITY_DATA),
    }


@app.get("/kpi-outliers")
def get_kpi_outliers(
    group_by: str,
    kpi_type: str,
    std_dev_threshold: float = 2.0,
):
    """
    Powers the interactive KPI monitoring panel (Task 2's "several other
    KPIs with variable inputs" requirement). The frontend calls this with
    the user's chosen metric and sensitivity, and gets back grouped
    results with outlier flags computed fresh on demand.

    Query parameters (sent by the frontend as URL parameters, e.g.
    /kpi-outliers?group_by=station&kpi_type=count&std_dev_threshold=2.5):
        group_by: which column to group by (e.g. 'station', 'reporter_name').
        kpi_type: 'count' | 'root_cause_rate' | 'extreme_severity_rate'.
        std_dev_threshold: sensitivity, adjustable via the frontend slider.
    """
    return compute_grouped_kpi_outliers(QUALITY_DATA, group_by, kpi_type, std_dev_threshold)




##cd backend
##venv\Scripts\activate
## python -m uvicorn app.main:app --reload