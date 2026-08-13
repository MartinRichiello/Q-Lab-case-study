function ReflectionSection() {
  return (
    <div className="card">
      <h2>Reflection &amp; Innovation</h2>
      <p>
        This dashboard's quality workflow (Task 3) stores flagged items
        entirely in the browser's memory for the duration of the session —
        nothing is persisted to a backend or database. This kept the build
        fast and required no additional infrastructure, but it means all
        flagged items, notes, and statuses are lost the moment the page is
        refreshed or closed. In a real production deployment, this would
        need to be backed by a proper database with user accounts, so flags
        persist across sessions and multiple engineers can collaborate on
        the same tracking queue without losing each other's work.
      </p>
      <p>
        Beyond persistence, a few other limitations are worth naming.
        Outlier detection currently defaults to 2 standard deviations
        across most metrics — a reasonable general starting point, but a
        production system would likely need per-metric thresholds tuned by
        domain experts rather than one default applied everywhere. Several
        KPIs (like root cause rate by reporter) are also limited by small
        sample sizes (only 5 reporters, 5 car models), which reduces how
        statistically meaningful their outlier detection can be.
      </p>
      <p>
        As a first step toward addressing the persistence limitation,
        we've added an "Export Flagged Items" button, allowing engineers
        to download their current session's flags as a JSON file before
        closing the browser — a lightweight safeguard against losing work,
        without requiring a full backend build-out. This is not a
        substitute for real persistence, but it demonstrates the intended
        direction and gives users a practical way to preserve their
        findings today.
      </p>
    </div>
  )
}

export default ReflectionSection