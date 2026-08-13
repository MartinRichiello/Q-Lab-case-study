import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Defect {
  reporter_name: string
  resolution_time_days: number | null
}

interface ResolutionTimePerReporterChartProps {
  defects: Defect[]
}

function ResolutionTimePerReporterChart({ defects }: ResolutionTimePerReporterChartProps) {
  // We need to compute an AVERAGE per reporter, which requires two running
  // totals per reporter: the sum of resolution times, and how many
  // resolved defects contributed to that sum (so we can divide at the end).
  //
  // IMPORTANT: we skip records where resolution_time_days is null.
  // Those are unresolved defects — including them as 0 would make
  // reporters with many open defects look unrealistically fast, which
  // would be misleading rather than informative.
  const totals: Record<string, { sum: number; count: number }> = {}

  for (const defect of defects) {
    if (defect.resolution_time_days === null) continue

    if (!totals[defect.reporter_name]) {
      totals[defect.reporter_name] = { sum: 0, count: 0 }
    }
    totals[defect.reporter_name].sum += defect.resolution_time_days
    totals[defect.reporter_name].count += 1
  }

  const chartData = Object.entries(totals)
    .map(([reporter_name, { sum, count }]) => ({
      reporter_name,
      // Rounded to 1 decimal place for a cleaner tooltip/axis display.
      avg_resolution_days: Math.round((sum / count) * 10) / 10,
    }))
    .sort((a, b) => b.avg_resolution_days - a.avg_resolution_days)

  return (
    <div>
      <h2>Average Resolution Time per Reporter (days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="reporter_name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="avg_resolution_days" fill="#3ba55d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ResolutionTimePerReporterChart