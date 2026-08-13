function AnalysisSection() {
  const findings = [
    "While analyzing defects by production station, we discovered 6 records with misspelled station names (e.g. 'Axel installaiton' instead of 'Axel installation'), which were silently splitting from their correct station and skewing per-station counts. We corrected these directly in the data pipeline after confirming no other column had similar issues.",
    "The Severity Rating (1–6) might suggest that severity increases with the number, but this conclusion turned out to be misleading. Cross-checking against the dataset's own Severity Category labels showed that ratings 1, 2, and 3 are all classified as 'Extreme' — for different reasons (inoperable, safety/legal, and major functional risk) — while 4, 5, and 6 are all 'Medium.' Because of this, we corrected our outlier detection to flag by category label instead of the numeric rating, since the number alone did not reflect true severity.",
    "The 'Defect Share by Dimension' chart shows each car model's, motor type's, and design package's percentage of total reported defects — not a true defect rate. A true rate would require knowing how many units of each were actually produced, which isn't available in this dataset. A model with a large defect share may simply be a high-volume model, not a lower-quality one.",
    "Dynamic outlier detection flagged 17 specific days with unusually high defect counts (more than 2 standard deviations above the daily average of ~24.7). Similarly, when grouping defects by production station, 'Final quality inspection' stood out sharply as the sole outlier, with 2,143 recorded defects against a station average of ~310 — suggesting this station either catches more issues by design (as a final checkpoint) or may itself warrant closer review.",
    "The KPI monitor's Root Cause Rate (by reporter) and % Extreme Severity (by car model) rarely flag any outliers, even at low sensitivity settings. This is expected, not a flaw: with only 5 reporters and 5 car models, there is little statistical room for any single group to fall meaningfully far from the average. Outlier detection is inherently more powerful with more categories, as seen with the 29 production stations.",
    "About 2,210 of the 9,000 defects have no recorded resolution time or root cause — these appear to be still-open, unresolved defects rather than data errors. We deliberately excluded them from resolution-time and rework-time averages and outlier calculations, rather than treating a missing value as 0 days, since doing so would have made unresolved defects look artificially fast to resolve.",
  ]

  return (
    <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
      <h2>Analysis Notes</h2>
      <p>
        Above is a summary of the most important patterns found across
        9,000 reported defects on BMW iX0 vehicles. Below, a series of
        interactive charts break this down by day, model, station,
        reporter, and defect type — helping quality engineers quickly
        spot where issues are concentrated. The notes below highlight key
        assumptions, data-quality findings, and the reasoning behind how
        outliers were detected.
      </p>
      <ul style={{ lineHeight: '1.8' }}>
        {findings.map((finding, index) => (
          <li key={index} style={{ marginBottom: '0.75rem' }}>
            {finding}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AnalysisSection