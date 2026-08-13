import { useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Defect {
  car_model: string
  motor_type: string
  design_package: string
}

interface DefectShareByDimensionChartProps {
  defects: Defect[]
}

const DIMENSIONS = [
  { key: 'car_model', label: 'Car Model' },
  { key: 'motor_type', label: 'Motor Type' },
  { key: 'design_package', label: 'Design Package' },
] as const

type DimensionKey = (typeof DIMENSIONS)[number]['key']

// A small fixed color palette, cycled through for however many slices
// exist. Keeping this explicit (rather than random colors) means the
// chart looks consistent across re-renders and dropdown changes.
const COLORS = ['#3b6ea5', '#c98a1f', '#3ba55d', '#a53b3b', '#7a5ea8', '#4a9d9c']

function DefectShareByDimensionChart({ defects }: DefectShareByDimensionChartProps) {
  const [dimension, setDimension] = useState<DimensionKey>('car_model')

  const counts: Record<string, number> = {}
  for (const defect of defects) {
    const value = defect[dimension]
    counts[value] = (counts[value] || 0) + 1
  }

  const total = defects.length

  // NOTE (also relevant for the written analysis): this is defect SHARE,
  // not a true defect RATE — a true rate would need production volume
  // per group, which isn't available in this dataset.
  const chartData = Object.entries(counts)
    .map(([value, count]) => ({
      value,
      percentage: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  return (
    <div>
      <h2>Defect Share by {DIMENSIONS.find((d) => d.key === dimension)?.label}</h2>
      <label>
        Group by:{' '}
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as DimensionKey)}
        >
          {DIMENSIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="percentage"
            nameKey="value"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            // Shows "ModelName: 24%" directly on each slice, so precision
            // isn't lost compared to a bar chart's exact axis reading.
            label={(props: { name?: string; value?: number }) =>
              `${props.name}: ${props.value}%`
            }
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.85rem', color: '#555' }}>
        Note: this shows each group's share of total reported defects, not a
        true defect rate (which would require production volume per group —
        not available in this dataset).
      </p>
    </div>
  )
}

export default DefectShareByDimensionChart