import { useState } from 'react'
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
import { useFlags } from '../context/FlagContext'
import FlagModal from './FlagModal'

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
  const { isFlagged } = useFlags()
  const [flaggingDate, setFlaggingDate] = useState<string | null>(null)

  // Dates aren't defect IDs, but FlagContext expects a numeric ID. We
  // convert a date string into a stable, unique negative number (so it
  // can never collide with a real defect_id, which are always >= 0).
  // This is a pragmatic workaround rather than redesigning FlagContext
  // to support multiple ID "kinds" under time pressure — documented here
  // as a known limitation/shortcut for the write-up.
  const dateToFlagId = (date: string) => {
    let hash = 0
    for (let i = 0; i < date.length; i++) {
      hash = (hash * 31 + date.charCodeAt(i)) | 0
    }
    return -Math.abs(hash) - 1 // always negative, never 0
  }

  // --- Step 1: aggregate raw records into { date, count } pairs ---
  const countsByDate: Record<string, number> = {}

  for (const defect of defects) {
    const dateOnly = defect.date.split('T')[0]
    countsByDate[dateOnly] = (countsByDate[dateOnly] || 0) + 1
  }

  const chartData = Object.entries(countsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const outlierDates = new Set(outliers?.defects_per_day.outlier_dates ?? [])

  return (
    <div className="card">
      <h2>
        Defects per Day
        <InfoButton
          lines={[
            'A day is marked as unusual if its total defect count exceeds the average daily count plus 2 standard deviations.',
            `Currently: average ≈ ${Math.round(chartData.reduce((sum, d) => sum + d.count, 0) / chartData.length)} defects/day.`,
            'This threshold adapts automatically if overall defect volume changes over time, rather than relying on a fixed number chosen in advance.',
            'Click any bar to flag that day for follow-up — flagged days appear in purple and show up in the Flagged Items Tracker.',
          ]}
        />
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" onClick={(data: any) => setFlaggingDate(data.date)} cursor="pointer">
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={
                  isFlagged(dateToFlagId(entry.date))
                    ? '#8e44ad' // distinct purple: "user-flagged", separate from red "statistical outlier"
                    : outlierDates.has(entry.date)
                    ? '#c0392b'
                    : 'var(--color-primary)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {flaggingDate && (
        <FlagModal
          defectId={dateToFlagId(flaggingDate)}
          label={`Day: ${flaggingDate}`}
          onClose={() => setFlaggingDate(null)}
        />
      )}
    </div>
  )
}

export default DefectsPerDayChart