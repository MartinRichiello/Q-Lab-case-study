
# Output Task 4 – Reflection & Innovation Section

## Where the code lives
- `frontend/src/components/ReflectionSection.tsx` — the written reflection (displayed in the app)
- `frontend/src/components/FlaggedItemsPanel.tsx` — the paired feature: "Export as JSON" button

## Summary
A ~250-word reflection discussing the main limitation of this build (flagged items are stored in-memory only, with no backend persistence), along with secondary limitations (fixed outlier-detection defaults, small sample sizes for some KPIs). The paired feature directly addresses the primary limitation: an "Export as JSON" button lets users download their session's flagged items before closing the browser, as an interim mitigation ahead of full backend persistence.