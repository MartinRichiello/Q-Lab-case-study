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
  car_model: string
}

interface DefectsPerModelChartProps {
  defects: Defect[]
}

function DefectsPerModelChart({ defects }: DefectsPerModelChartProps) {
  // Same aggregation pattern as DefectsPerDayChart: count occurrences
  // per category (here, car model instead of date).
  const countsByModel: Record<string, number> = {}

  for (const defect of defects) {
    countsByModel[defect.car_model] = (countsByModel[defect.car_model] || 0) + 1
  }

  // Sort descending by count, so the chart reads as a ranked comparison
  // (most-defect-prone model first) — more useful for a quality engineer
  // scanning for problem areas than alphabetical order would be.
  const chartData = Object.entries(countsByModel)
    .map(([car_model, count]) => ({ car_model, count }))
    .sort((a, b) => b.count - a.count)

  return (
    <div>
      <h2>Defects per Car Model</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="car_model" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#a53b3b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default DefectsPerModelChart