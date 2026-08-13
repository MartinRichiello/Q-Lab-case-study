
# Output Task 3 – Interactive Quality Workflow

## Where the code lives
- `frontend/src/context/FlagContext.tsx` — shared state for all flagged items (React Context)
- `frontend/src/components/FlagModal.tsx` — reusable flag/annotate popup (note + status)
- `frontend/src/components/DefectTable.tsx` — click-to-flag on table rows
- `frontend/src/components/DefectsPerDayChart.tsx` — click-to-flag on chart bars
- `frontend/src/components/FlaggedItemsPanel.tsx` — tracking dashboard (filter, search, edit)

## Summary
Users can click a table row or a chart data point to flag it as a quality anomaly, add a note, and assign a tracking status (under review / resolved / dismissed). A dedicated Flagged Items Tracker panel lists all flagged records, live-updating, with search and status filtering. Flags are stored in-memory for the session (see Task 4's reflection for the reasoning and the mitigation built for this limitation).