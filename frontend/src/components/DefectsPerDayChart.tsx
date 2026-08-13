import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import InfoButton from './InfoButton'

interface Defect {
  date: string
}

interface OutlierMetric {
  outlier_dates?: string[]
}

interface OutlierData {
  defects_per_day: OutlierMetric
}

interface DefectsPerDayChartProps {
  defects: Defect[]
  outliers: OutlierData | null
}


function DefectsPerDayChart({ defects, outliers }: DefectsPerDayChartProps) {
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

  // Set of dates flagged as outlier days, for fast lookup while coloring bars.
  const outlierDates = new Set(outliers?.defects_per_day.outlier_dates ?? [])


  return (
    <div>
      <h2>
        Defects per Day
        <InfoButton
          lines={[
            'A day is marked as unusual if its total defect count exceeds the average daily count plus 2 standard deviations.',
            `Currently: average ≈ ${Math.round(chartData.reduce((sum, d) => sum + d.count, 0) / chartData.length)} defects/day.`,
            'This threshold adapts automatically if overall defect volume changes over time, rather than relying on a fixed number chosen in advance.',
          ]}
        />
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count">
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={outlierDates.has(entry.date) ? '#c0392b' : '#3b6ea5'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DefectsPerDayChart