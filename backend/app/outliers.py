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
    Flags outliers using a fixed, pre-defined NUMERIC threshold (not
    derived from the data itself). Kept as a general-purpose utility for
    any column where a numeric cutoff genuinely makes sense.

    NOTE: we do NOT use this function for severity — see
    detect_severity_outliers() below for why.
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


def detect_severity_outliers(df: pd.DataFrame) -> dict:
    """
    Flags outliers for severity using the CATEGORY label (severity_category)
    rather than the numeric severity_rating column.

    WHY: we initially used a numeric hard limit (severity_rating >= 6),
    assuming — like most people naturally would — that a higher number
    means higher severity. Inspecting the actual data disproved this:

        severity_rating  severity_category
        1                 Extreme - safety/legal/inoperable
        2                 Extreme - safety/legal/homologation
        3                 Extreme - major functional risk
        4                 Medium - immediate dealership
        5                 Medium - ASAP dealership
        6                 Medium - next service visit

    The numeric column does NOT represent an increasing severity scale —
    it behaves more like an arbitrary category ID. Ratings 1, 2, and 3 are
    ALL labeled "Extreme" (for three different reasons: inoperable,
    safety/legal, and functional risk), while 4, 5, 6 are all "Medium".
    A numeric cutoff (whether >=6 or ==1) would either flag the wrong end
    of the scale, or only catch ONE of the three "Extreme" sub-categories
    and silently miss the other two — a meaningful under-detection of
    genuinely critical defects.

    The fix: flag any record whose severity_category starts with
    "Extreme", using BMW's own classification directly, instead of
    re-deriving severity from a numeric column that turned out not to be
    ordered the way it appears.

    This is still a STATIC method (a fixed rule, not derived from this
    dataset's mean/std dev) — it just operates on the category label
    instead of the numeric rating.
    """
    is_extreme = df["severity_category"].str.startswith("Extreme")
    outlier_ids = df[is_extreme]["defect_id"].tolist()

    return {
        "column": "severity_category",
        "method": "static (category label: starts with 'Extreme')",
        "mean": None,
        "std_dev": None,
        "threshold_used": "severity_category starts with 'Extreme'",
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



def compute_grouped_kpi_outliers(
    df: pd.DataFrame,
    group_by_column: str,
    kpi_type: str,
    std_dev_threshold: float = 2.0,
) -> dict:
    """
    Computes a KPI grouped by a category column (e.g. per station, per
    reporter), then applies dynamic (mean + N std dev) outlier detection
    to the resulting groups.

    This single function powers ALL of our additional KPI dropdown
    options, rather than writing one near-duplicate function per KPI —
    since they all share the same underlying shape: "group records by
    some category, compute one number per group, flag groups whose
    number is unusually high."

    Args:
        df: the full defect DataFrame.
        group_by_column: which column defines the groups
            (e.g. 'station', 'reporter_name', 'car_model', 'part_of_car').
        kpi_type: which calculation to perform per group. One of:
            - 'count': how many defect records fall in this group
              (e.g. "defects per station").
            - 'root_cause_rate': % of the group's records where
              root_cause_identified == 'Yes'. NOTE: for this KPI, we flag
              groups BELOW the lower threshold (unusually LOW root-cause
              rate is the problem), not above — the opposite direction
              from every other KPI here. This is intentional and
              documented, not a bug.
            - 'extreme_severity_rate': % of the group's records where
              severity_category starts with 'Extreme'. Uses the category
              label, not the numeric severity_rating — see
              detect_severity_outliers() for why the numeric column can't
              be trusted as an ordered scale.
        std_dev_threshold: how many standard deviations from the mean
            counts as unusual. User-adjustable via the frontend slider —
            this is the "variable input" the case study asks for.

    Returns:
        A dictionary with the per-group results (for charting) plus the
        mean/std_dev/threshold used (for the info text and info buttons).
    """
    if kpi_type == "count":
        grouped = df.groupby(group_by_column).size()
        flag_direction = "above"  # unusually HIGH count is the concern

    elif kpi_type == "root_cause_rate":
        # For each group, % of records where root cause was identified.
        # We treat missing (None) as "No" for this calculation, since a
        # missing root cause means it hasn't been identified either way.
        grouped = df.groupby(group_by_column)["root_cause_identified"].apply(
            lambda x: (x == "Yes").sum() / len(x) * 100
        )
        flag_direction = "below"  # unusually LOW rate is the concern

    elif kpi_type == "extreme_severity_rate":
        grouped = df.groupby(group_by_column)["severity_category"].apply(
            lambda x: x.str.startswith("Extreme").sum() / len(x) * 100
        )
        flag_direction = "above"  # unusually HIGH extreme-defect share is the concern

    else:
        raise ValueError(f"Unknown kpi_type: {kpi_type}")

    mean = grouped.mean()
    std_dev = grouped.std()

    if flag_direction == "above":
        threshold = mean + (std_dev_threshold * std_dev)
        flagged_groups = grouped[grouped > threshold]
    else:
        threshold = mean - (std_dev_threshold * std_dev)
        # A rate can't go below 0%, so we don't let the threshold do so
        # either — otherwise nothing could ever be flagged as "too low"
        # once the calculated threshold itself goes negative.
        threshold = max(threshold, 0)
        flagged_groups = grouped[grouped < threshold]

    # Build the full per-group results (not just the flagged ones), since
    # the chart needs to show ALL bars, with flagged ones colored differently.
    all_groups = [
        {
            "group": str(group_value),
            "value": round(value, 2),
            "is_outlier": group_value in flagged_groups.index,
        }
        for group_value, value in grouped.items()
    ]
    # Sort descending by value so the chart reads as a ranked comparison.
    all_groups.sort(key=lambda g: g["value"], reverse=True)

    return {
        "group_by_column": group_by_column,
        "kpi_type": kpi_type,
        "flag_direction": flag_direction,
        "mean": round(mean, 2),
        "std_dev": round(std_dev, 2),
        "threshold_used": round(threshold, 2),
        "std_dev_multiplier": std_dev_threshold,
        "groups": all_groups,
        "outlier_count": len(flagged_groups),
    }