"""
ai_suggestion.py
-----------------
Task 5: Embed Gen AI.

This module currently returns a MOCK response, structured exactly like a
real LLM API call would return, so the rest of the pipeline (endpoint,
frontend button, display panel) can be built and tested before wiring in
a real API key. Swapping the mock for a real call later only requires
changing the inside of get_ai_suggestion() — nothing else in the app
needs to change, since the function's input/output shape stays the same.

Design constraints (per the case study):
- NOT a chatbot: this takes a specific, scoped input (one flagged
  defect's context) and returns a fixed-shape structured result — there
  is no free-text conversation.
- Must leverage flagged data: the input is built from an item the user
  has already flagged in the Interactive Quality Workflow (Task 3).
- Output must be short and factual, and should push the user 1-2 steps
  further toward root-causing, not just restate what they already see
  elsewhere in the dashboard.
"""


def get_ai_suggestion(defect_name: str, station: str, category: str, note: str) -> dict:
    """
    Returns a structured root-cause suggestion for a flagged defect.

    Args:
        defect_name: the defect's name (e.g. "Sensor Failure").
        station: the production station where it was found.
        category: the defect category (e.g. "Electrical").
        note: the user's own note from when they flagged it.

    Returns:
        A dict with likely_factors (list), suggested_next_step (str),
        and confidence_note (str) — matching the shape a real LLM call
        would be prompted to return.
    """
    # MOCK IMPLEMENTATION: returns a fixed, plausible-looking response,
    # lightly varied using the actual input so it doesn't look completely
    # static/fake in a demo. A real implementation would replace this
    # entire function body with an API call to Anthropic/OpenAI, passing
    # a prompt built from these same arguments.
    return {
        "likely_factors": [
            f"'{defect_name}' defects at the '{station}' station may indicate a station-specific process or calibration issue rather than a component defect.",
            f"Category '{category}' suggests this falls within a known defect class — cross-referencing similar flagged items may reveal a shared root cause.",
        ],
        "suggested_next_step": f"Review recent maintenance/calibration logs for '{station}' and compare against other flagged '{category}' defects to check for a common upstream cause.",
        "confidence_note": "This is a preliminary, pattern-based suggestion — not a definitive diagnosis. Engineer review of the underlying process logs is recommended before acting.",
    }