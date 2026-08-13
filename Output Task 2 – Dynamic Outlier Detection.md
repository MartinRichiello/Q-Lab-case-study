
# Output Task 2 – Dynamic Outlier Detection

## Where the code lives
- `backend/app/outliers.py` — all outlier detection logic (dynamic, static, and grouped-KPI methods)
- `backend/app/main.py` — `/outliers` and `/kpi-outliers` endpoints
- `frontend/src/components/DefectTable.tsx` — visual outlier marking (row tint + per-cell highlighting)
- `frontend/src/components/DefectsPerDayChart.tsx` — visual outlier marking (red bars for flagged days)
- `frontend/src/components/KpiOutlierPanel.tsx` — interactive KPI monitor with adjustable sensitivity
- `frontend/src/components/InfoButton.tsx` — reusable "?" explanation buttons used throughout

## Summary
Dynamic (mean ± N standard deviations) outlier detection for Resolution Time, Rework Time, and Defects per Day, with a fully adjustable sensitivity slider (1.0–3σ) available via the KPI panel. Static (fixed-rule) detection for Severity — after discovering the numeric severity rating is not ordered, this was switched to a category-label rule. Includes a discussion of static vs. dynamic trade-offs, and an interactive panel exposing 4 additional KPIs (defects per station, root cause rate per reporter, % extreme severity per model, defects per part) with live, adjustable outlier flagging.