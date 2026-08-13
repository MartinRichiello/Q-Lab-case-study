interface Defect {
  defect_name: string
  severity_rating: number
  resolution_time_days: number | null
}

interface TopDefectsTableProps {
  defects: Defect[]
}

function TopDefectsTable({ defects }: TopDefectsTableProps) {
  // Step 1: aggregate stats per defect name.
  // For each unique defect name, we track:
  // - count: how many times it occurred (determines the "top 5" ranking)
  // - severitySum / severityCount: to compute average severity
  // - resolutionSum / resolutionCount: to compute average resolution time
  //   (resolutionCount can be LOWER than count, since we skip unresolved
  //   defects — same reasoning as the earlier resolution-time chart: an
  //   unresolved defect isn't a "0 days" resolution, it's "not yet known".)
  const stats: Record<
    string,
    {
      count: number
      severitySum: number
      resolutionSum: number
      resolutionCount: number
    }
  > = {}

  for (const defect of defects) {
    if (!stats[defect.defect_name]) {
      stats[defect.defect_name] = {
        count: 0,
        severitySum: 0,
        resolutionSum: 0,
        resolutionCount: 0,
      }
    }
    const entry = stats[defect.defect_name]
    entry.count += 1
    entry.severitySum += defect.severity_rating

    if (defect.resolution_time_days !== null) {
      entry.resolutionSum += defect.resolution_time_days
      entry.resolutionCount += 1
    }
  }

  // Step 2: rank by frequency (count), descending, and keep only the top 5.
  const topDefects = Object.entries(stats)
    .map(([defect_name, entry]) => ({
      defect_name,
      occurrences: entry.count,
      avg_severity: Math.round((entry.severitySum / entry.count) * 10) / 10,
      avg_resolution_days:
        entry.resolutionCount > 0
          ? Math.round((entry.resolutionSum / entry.resolutionCount) * 10) / 10
          : null, // no resolved instances at all for this defect (rare, but possible)
    }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 5)

  return (
    <div>
      <h2>Top 5 Most Common Defects</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Defect Name</th>
            <th>Occurrences</th>
            <th>Avg Severity</th>
            <th>Avg Resolution (days)</th>
          </tr>
        </thead>
        <tbody>
          {topDefects.map((defect, index) => (
            <tr key={defect.defect_name}>
              <td>{index + 1}</td>
              <td>{defect.defect_name}</td>
              <td>{defect.occurrences}</td>
              <td>{defect.avg_severity}</td>
              <td>{defect.avg_resolution_days ?? 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TopDefectsTable