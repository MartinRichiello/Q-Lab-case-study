"""
data.py
-------
This module is responsible for ONE thing: loading the quality defect data
from the Excel file into memory, once, and making it available to the rest
of the backend (API endpoints).

Why load once instead of reading the Excel file on every request?
- The file is small (9,000 rows), so it easily fits in memory.
- Reading an Excel file from disk is much slower than reading a Python
  object that is already loaded — Excel parsing has real overhead.
- This mirrors how a real production service would behave: expensive
  operations (like parsing a file, or querying a slow system) are done
  once at startup, and the result is cached in memory for fast repeated
  access. In a real plant system this might instead be a database query,
  but the *pattern* (load/cache once, serve many times) is the same.
"""

from pathlib import Path
import pandas as pd

# Path to the Excel file, relative to this file's location.
# Using Path(__file__) instead of a hardcoded string keeps this working
# no matter where the project is run from.
DATA_PATH = Path(__file__).parent.parent / "data" / "quality_data.xlsx"


def load_quality_data() -> pd.DataFrame:
    """
    Reads the quality defect Excel file and returns a cleaned pandas DataFrame.

    Cleaning steps and WHY each one is needed:

    1. Parse "Date" and "Resolution Date" as actual datetime objects.
       - Excel already stores them as dates, but we make sure pandas treats
         them as datetimes (not text), so we can sort/filter/plot by date later.

    2. Standardize column names to be code-friendly (no spaces).
       - The raw file has headers like "Time to Resolution (days)".
         Spaces and parentheses make the column awkward to reference in code
         and in the frontend. We keep a "friendly" internal name here, while
         still being able to show the original label in the UI later.

    3. Leave missing values (NaN) as-is for now, rather than filling them in.
       - We found that "Time to Resolution (days)", "Root Cause Identified",
         and "Resolution Date" have missing values (~1,000-2,200 rows out of 9,000).
       - These are very likely defects that are still OPEN / unresolved
         (i.e. there's no resolution time yet because it hasn't been resolved).
       - Silently filling these with 0 or an average would be misleading —
         it would make unresolved defects look like fast, resolved ones.
         We'll handle this explicitly and visibly in Task 1/2, not hide it here.

    Returns:
        pd.DataFrame: the cleaned defect data, one row per defect.
    """
    df = pd.read_excel(DATA_PATH)

    # Step 1: ensure proper datetime types
    df["Date"] = pd.to_datetime(df["Date"])
    df["Resolution Date"] = pd.to_datetime(df["Resolution Date"])

    # Step 2: rename columns to be easier to work with in code.
    # We keep this mapping explicit (not automatic) so it's clear and documented.
    df = df.rename(columns={
        "Time to Resolution (days)": "resolution_time_days",
        "Root Cause Identified": "root_cause_identified",
        "Rework Time (minutes)": "rework_time_minutes",
        "Severity Rating": "severity_rating",
        "Severity Category": "severity_category",
        "Car Model": "car_model",
        "Motor Type": "motor_type",
        "Design Package": "design_package",
        "Production Shift": "production_shift",
        "Defect Category": "defect_category",
        "Defect Name": "defect_name",
        "Part of the Car": "part_of_car",
        "Reporter Name": "reporter_name",
        "Part Number": "part_number",
        "Station": "station",
        "Date": "date",
        "Time": "time",
        "Resolution Date": "resolution_date",
    })




    # Step 2.5: fix known typos in the "station" column.
    #
    # WHY: while building outlier detection grouped by station, we found
    # 6 records with clearly misspelled station names (e.g. "Axel
    # installaiton" instead of "Axel installation"), each appearing only
    # once, while the correctly-spelled version already exists with many
    # occurrences. Left uncorrected, these would silently split into
    # separate groups from their correct counterpart, subtly undercounting
    # the real station and creating a handful of meaningless "stations"
    # with a count of 1 each — this would distort any per-station
    # analysis (e.g. "defects per station" outlier detection).
    #
    # We checked every other categorical column (reporter_name, car_model,
    # motor_type, design_package, defect_category, part_of_car) for the
    # same issue and found none — this appears to be isolated to `station`.
    #
    # We use an explicit mapping (rather than a fuzzy-matching algorithm)
    # because it's transparent and auditable: every correction made here
    # can be checked by eye against the original data, rather than trusting
    # an opaque similarity score that could make an incorrect correction.
    station_typo_corrections = {
        "Axel installaiton": "Axel installation",
        "EVb attery installation": "EV battery installation",
        "Rera bumper installation": "Rear bumper installation",
        "eRar bumper installation": "Rear bumper installation",
        "Windhsield installation": "Windshield installation",
        "Wire harness installtaion": "Wire harness installation",
    }
    df["station"] = df["station"].replace(station_typo_corrections)


    

    # Step 3: add a stable unique ID per row.
    # The raw data has no single "defect ID" column, but we need one so the
    # frontend can reference a specific row later (Task 3: flagging a row).
    df = df.reset_index(drop=True)
    df.insert(0, "defect_id", df.index)

    # Step 4: replace pandas' missing-value markers (NaN / NaT) with None.
    # WHY: pandas represents "missing" internally as NaN (for numbers) or
    # NaT (for dates). Both are perfectly normal inside pandas, but neither
    # is valid JSON — JSON only understands "null" for a missing value.
    # If we don't do this conversion, the API crashes as soon as it tries
    # to send any row with a missing value (~2,000+ of our 9,000 rows).
    #
    # GOTCHA we hit here: simply doing `df.where(df.notna(), None)` is NOT
    # enough. pandas columns have a fixed dtype (e.g. "this column holds
    # decimal numbers"). If you put a `None` into a numeric/date column,
    # pandas silently converts it right back into NaN/NaT to keep the
    # column's dtype consistent — undoing the fix invisibly.
    #
    # The fix: convert the whole DataFrame to `object` dtype FIRST, which
    # tells pandas "let each cell hold any type" (number, text, or None),
    # so None actually survives instead of being coerced back to NaN/NaT.
    df = df.astype(object).where(df.notna(), None)

    return df

# Loaded ONCE, when this module is first imported (i.e. when the app starts).
# Every other part of the backend imports `QUALITY_DATA` from here, instead
# of calling load_quality_data() again.
QUALITY_DATA: pd.DataFrame = load_quality_data()


if __name__ == "__main__":
    # Small manual check: run `python app/data.py` to sanity-check the data
    # loads correctly, without needing to start the whole API server.
    print(QUALITY_DATA.shape)
    print(QUALITY_DATA.head())
    print(QUALITY_DATA.isna().sum())