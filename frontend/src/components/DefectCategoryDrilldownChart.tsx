import { useState, useMemo } from 'react'
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
  defect_category: string
}

interface DefectCategoryDrilldownChartProps {
  defects: Defect[]
}

const DIMENSIONS = [
  { key: 'car_model', label: 'Car Model' },
  { key: 'motor_type', label: 'Motor Type' },
  { key: 'design_package', label: 'Design Package' },
] as const

type DimensionKey = (typeof DIMENSIONS)[number]['key']

const COLORS = ['#3b6ea5', '#c98a1f', '#3ba55d', '#a53b3b', '#7a5ea8', '#4a9d9c']

function DefectCategoryDrilldownChart({ defects }: DefectCategoryDrilldownChartProps) {
  const [dimension, setDimension] = useState<DimensionKey>('car_model')

  // Every distinct value that exists for the currently chosen dimension
  // (e.g. if dimension = 'car_model', this becomes ['Base', 'IX0M', ...]).
  // We recompute this whenever `dimension` or `defects` changes.
  const availableValues = useMemo(() => {
    const unique = new Set(defects.map((d) => d[dimension]))
    return Array.from(unique).sort()
  }, [defects, dimension])

  // The currently selected specific value (e.g. "Long"). Defaults to the
  // first available option whenever the list changes (e.g. when the
  // dimension dropdown changes and the old selected value no longer applies).
  const [selectedValue, setSelectedValue] = useState<string>('')

  // Keep selectedValue valid: if it's empty or no longer in the list
  // (e.g. right after switching dimension), fall back to the first option.
  const effectiveValue =
    selectedValue && availableValues.includes(selectedValue)
      ? selectedValue
      : availableValues[0]

  // Filter defects down to ONLY the selected value, then count how many
  // fall into each defect_category within that filtered subset.
  const categoryCounts: Record<string, number> = {}
  for (const defect of defects) {
    if (defect[dimension] !== effectiveValue) continue
    categoryCounts[defect.defect_category] =
      (categoryCounts[defect.defect_category] || 0) + 1
  }

  const subsetTotal = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  const chartData = Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      percentage: subsetTotal > 0 ? Math.round((count / subsetTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)

  const dimensionLabel = DIMENSIONS.find((d) => d.key === dimension)?.label

  return (
    <div>
      <h2>Defect Category Breakdown — Drill Down</h2>

      <label>
        Dimension:{' '}
        <select
          value={dimension}
          onChange={(e) => {
            setDimension(e.target.value as DimensionKey)
            setSelectedValue('') // reset so it falls back to first option of new dimension
          }}
        >
          {DIMENSIONS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ marginLeft: '1rem' }}>
        {dimensionLabel}:{' '}
        <select
          value={effectiveValue}
          onChange={(e) => setSelectedValue(e.target.value)}
        >
          {availableValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <p style={{ fontSize: '0.9rem', color: '#555' }}>
        Showing defect category breakdown for {dimensionLabel}:{' '}
        <strong>{effectiveValue}</strong> ({subsetTotal} defects)
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="percentage"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            label={(props: { name?: string; value?: number }) =>
              // Only label slices with enough room to avoid overlap —
              // smaller slices are still identifiable via the Legend
              // below the chart and the Tooltip on hover.
              (props.value ?? 0) >= 8 ? `${props.name}: ${props.value}%` : ''
            }
            labelLine={
              ((props: any) => (props.value ?? 0) >= 8) as unknown as boolean
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
    </div>
  )
}

export default DefectCategoryDrilldownChart