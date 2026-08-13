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
  date: string
}

interface DefectsPerDayChartProps {
  defects: Defect[]
}

function DefectsPerDayChart({ defects }: DefectsPerDayChartProps) {
  // --- Step 1: aggregate raw records into { date, count } pairs ---
  //
  // We use a plain JS object as a "counter": for each defect, extract just
  // the date part (dropping the time), and increment that date's count.
  // This is the standard pattern for turning row-level data into
  // chart-ready summary data.
  const countsByDate: Record<string, number> = {}

  for (const defect of defects) {
    // defect.date arrives as a full ISO string, e.g. "2025-07-03T00:00:00".
    // We only want the date part, so we split on 'T' and keep the first piece.
    const dateOnly = defect.date.split('T')[0]
    countsByDate[dateOnly] = (countsByDate[dateOnly] || 0) + 1
  }

  // Recharts expects an ARRAY of objects, not the object-as-counter shape
  // we just built. We convert it here, and sort chronologically so the
  // chart reads left-to-right in date order (object key order isn't
  // guaranteed to be sorted).
  const chartData = Object.entries(countsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div>
      <h2>Defects per Day</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b6ea5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DefectsPerDayChart