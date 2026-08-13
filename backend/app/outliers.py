"""
outliers.py
-----------
This module is responsible for ONE thing: detecting outlier defect records,
using two different methods depending on the metric:

1. DYNAMIC detection (statistical): for metrics where "normal" can genuinely
   shift depending on conditions (resolution time, rework time, defects per
   day). We calculate the mean and standard deviation directly from the
   data, and flag anything more than 2 standard deviations away from the
   mean. This threshold automatically adapts if the underlying data changes
   — e.g. if next month's typical resolution time shifts, the flagging
   threshold shifts with it.

2. STATIC detection (hard limit): for metrics where "outlier" has a fixed,
   domain-defined meaning that should NOT depend on the rest of the data.
   Severity Rating is the clear example: a severity of 9 or 10 should
   always be flagged as critical, regardless of what the average severity
   happens to be in this particular dataset. If we used a dynamic threshold
   here, a batch with many severe defects would raise the average and
   could make it HARDER to flag exactly the defects that matter most —
   which defeats the purpose.

Why 2 standard deviations specifically (for the dynamic method)?
- In a roughly normal (bell-curve-shaped) distribution, about 95% of values
  fall within 2 standard deviations of the mean. Flagging anything beyond
  that means we're flagging roughly the most extreme ~5% of records — a
  reasonable, commonly used starting point for "unusual" without being so
  strict that it flags nothing, or so loose that it flags too much.
- This is a configurable choice, not a law — we expose it as a parameter
  (see `std_dev_threshold` below) so it could be tuned (e.g. to 2.5 or 3)
  without changing the underlying logic.

Alternative approaches considered (documented here for the write-up):
- IQR (interquartile range) method: flag anything below Q1 - 1.5*IQR or
  above Q3 + 1.5*IQR. More robust to extreme outliers skewing the mean
  itself, but less commonly understood at a glance, and slightly more
  complex to explain to a non-technical audience (quality engineers).
  We chose mean/stdev for this project because the case study explicitly
  suggests it as the primary example, and it's more intuitive to explain
  via an info button ("beyond X days, which is the average plus 2 standard
  deviations").
- Percentile-based (e.g. flag top 5% directly): simpler, but doesn't
  actually measure how UNUSUAL a value is, just its rank — two datasets
  with very different spreads would flag the "same top 5%" even if one
  dataset's outliers are barely unusual and the other's are extreme.
"""

import pandas as pd


def detect_dynamic_outliers(
    df: pd.DataFrame,
    column: str,
    std_dev_threshold: float = 2.0,
) -> dict:
    """
    Flags outliers in a numeric column using the mean +/- N standard
    deviations method.
    """
    valid = df[df[column].notna()]

    mean = valid[column].mean()
    std_dev = valid[column].std()

    lower_bound = mean - (std_dev_threshold * std_dev)
    upper_bound = mean + (std_dev_threshold * std_dev)

    outlier_ids = valid[valid[column] > upper_bound]["defect_id"].tolist()

    return {
        "column": column,
        "method": "dynamic (mean + N std dev)",
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "threshold_used": round(upper_bound, 2),
        "std_dev_multiplier": std_dev_threshold,
        "outlier_ids": outlier_ids,
        "outlier_count": len(outlier_ids),
    }


def detect_static_outliers(
    df: pd.DataFrame,
    column: str,
    hard_limit: float,
) -> dict:
    """
    Flags outliers using a fixed, pre-defined threshold (not derived from
    the data itself).
    """
    outlier_ids = df[df[column] >= hard_limit]["defect_id"].tolist()

    return {
        "column": column,
        "method": "static (fixed hard limit)",
        "mean": None,
        "std_dev": None,
        "threshold_used": hard_limit,
        "std_dev_multiplier": None,
        "outlier_ids": outlier_ids,
        "outlier_count": len(outlier_ids),
    }


def compute_defects_per_day_outliers(df: pd.DataFrame, std_dev_threshold: float = 2.0) -> dict:
    """
    Special case: 'defects per day' isn't a column in the raw data — it's
    a derived count (how many defect records share the same date). We
    compute that count first, then apply the same dynamic method as above.
    """
    # NOTE: data.py converts the whole DataFrame to `object` dtype (as part
    # of the NaN/NaT -> None fix for JSON compatibility). That side effect
    # strips the `date` column's proper datetime dtype, even though the
    # individual values are still real Timestamp objects underneath. The
    # `.dt` accessor requires a genuine datetime64 column, so we explicitly
    # re-convert just this column back before using it, rather than
    # touching the shared fix in data.py (which other code depends on).
    dates_as_datetime = pd.to_datetime(df["date"])
    daily_counts = dates_as_datetime.groupby(dates_as_datetime.dt.date).size()

    mean = daily_counts.mean()
    std_dev = daily_counts.std()
    upper_bound = mean + (std_dev_threshold * std_dev)

    outlier_dates = daily_counts[daily_counts > upper_bound]

    return {
        "column": "defects_per_day",
        "method": "dynamic (mean + N std dev)",
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "threshold_used": round(upper_bound, 2),
        "std_dev_multiplier": std_dev_threshold,
        "outlier_dates": [str(d) for d in outlier_dates.index],
        "outlier_count": len(outlier_dates),
    }