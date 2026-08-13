# Output Task 5 – Gen AI

## Where the code lives
- `backend/app/ai_suggestion.py` — the suggestion-generation logic (currently mock-backed)
- `backend/app/main.py` — `POST /ai-suggestion` endpoint
- `frontend/src/components/FlaggedItemsPanel.tsx` — "AI Suggestion" button + result display

## Summary
A non-chatbot feature: clicking "AI Suggestion" on any flagged item sends its real context (defect name, station, category, user's note) to a backend endpoint, which returns a short, structured root-cause suggestion (likely contributing factors, a suggested next step, and a confidence caveat) — displayed in its own clearly-labeled, visually distinct panel. Currently backed by a deterministic mock function with the exact same input/output shape a real LLM call would use, so it can be swapped for a live API call without changing the endpoint or frontend.