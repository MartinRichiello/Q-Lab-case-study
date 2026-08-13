import { useState, useEffect } from 'react'
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

// The available KPIs, each mapping to a (group_by, kpi_type) pair the
// backend understands. Keeping this as one config array means adding a
// future KPI is just adding one more entry here — nothing else changes.
const KPI_OPTIONS = [
  { label: 'Defects per Station', groupBy: 'station', kpiType: 'count', unit: '' },
  { label: 'Root Cause Rate per Reporter', groupBy: 'reporter_name', kpiType: 'root_cause_rate', unit: '%' },
  { label: '% Extreme Severity per Car Model', groupBy: 'car_model', kpiType: 'extreme_severity_rate', unit: '%' },
  { label: 'Defects per Part of Car', groupBy: 'part_of_car', kpiType: 'count', unit: '' },
] as const

// Fixed sensitivity steps for the slider, rather than a fully free drag —
// keeps every possible value clean and explainable (see project notes).
// Includes 1.0 (a genuinely more sensitive option) alongside the standard
// 2 std dev default, while staying within statistically meaningful
// territory — going much below 1.0 would start flagging values that are
// only slightly above average, which defeats the purpose of "outlier"
// detection (see the discussion in outliers.py's module docstring on why
// 2 std dev is a reasonable baseline).
const SENSITIVITY_STEPS = [1.0, 1.5, 2, 2.5, 3]

interface KpiGroup {
  group: string
  value: number
  is_outlier: boolean
}

interface KpiResult {
  mean: number
  std_dev: number
  threshold_used: number
  flag_direction: string
  groups: KpiGroup[]
  outlier_count: number
}

function KpiOutlierPanel() {
  const [selectedKpiIndex, setSelectedKpiIndex] = useState(0)
  const [sensitivity, setSensitivity] = useState(2)
  const [result, setResult] = useState<KpiResult | null>(null)
  const [loading, setLoading] = useState(true)

  const selectedKpi = KPI_OPTIONS[selectedKpiIndex]

  // Re-fetch every time the KPI selection or sensitivity changes — this
  // is what makes the panel feel instantly interactive, matching the
  // pattern used in DefectCategoryDrilldownChart's dropdowns.
  useEffect(() => {
    // NOTE: we deliberately do NOT setLoading(true) here on every change.
    // Doing so would unmount the chart/text and briefly show "Loading..."
    // on every slider drag or dropdown change, causing a visible flicker.
    // Instead, we keep showing the PREVIOUS result while the new one
    // loads, and only show the initial loading message before we have
    // any result at all (handled by the `!result` check in the render).
    const url = `http://localhost:8000/kpi-outliers?group_by=${selectedKpi.groupBy}&kpi_type=${selectedKpi.kpiType}&std_dev_threshold=${sensitivity}`

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Request failed')
        return response.json()
      })
      .then((data: KpiResult) => {
        setResult(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to fetch KPI outliers:', error)
        setLoading(false)
      })
  }, [selectedKpi.groupBy, selectedKpi.kpiType, sensitivity])

  return (
    <div>
      <h2>
        KPI Outlier Monitor
        {result && (
          <InfoButton
            lines={[
              'Each bar represents one group\'s value for the selected KPI.',
              `A group is flagged (red) if its value is more than ${sensitivity}σ ${result.flag_direction} the average across all groups.`,
              `Currently: mean = ${result.mean}${selectedKpi.unit}, threshold = ${result.threshold_used}${selectedKpi.unit}.`,
              'Adjust the slider to make detection stricter or more lenient. Fewer groups will typically be flagged for KPIs with only a few categories, since there\'s less statistical room for a value to be "far" from the average.',
            ]}
          />
        )}
      </h2>
      <p style={{ fontSize: '0.9rem', color: '#555' }}>
        Pick a metric and adjust the sensitivity to see which groups are
        flagged as statistically unusual (mean ± N standard deviations).
      </p>

      <label>
        KPI:{' '}
        <select
          value={selectedKpiIndex}
          onChange={(e) => setSelectedKpiIndex(Number(e.target.value))}
        >
          {KPI_OPTIONS.map((kpi, index) => (
            <option key={kpi.label} value={index}>
              {kpi.label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: '0.75rem' }}>
        <label>
          Sensitivity: <strong>{sensitivity}σ</strong>
          <br />
          <input
            type="range"
            min={0}
            max={SENSITIVITY_STEPS.length - 1}
            step={1}
            value={SENSITIVITY_STEPS.indexOf(sensitivity)}
            onChange={(e) =>
              setSensitivity(SENSITIVITY_STEPS[Number(e.target.value)])
            }
            style={{ width: '250px' }}
          />
        </label>
      </div>

      {!result ? (
        <p>Loading...</p>
      ) : (
        <>
          <p style={{ fontSize: '0.9rem', color: '#555' }}>
            Mean: {result.mean}
            {selectedKpi.unit} | Threshold ({sensitivity}σ,{' '}
            {result.flag_direction}): {result.threshold_used}
            {selectedKpi.unit} | {result.outlier_count} group
            {result.outlier_count === 1 ? '' : 's'} flagged
          </p>

          {/* Horizontally scrollable container: each bar gets a fixed
              minimum width, so charts with many categories (like the 29
              stations) stay readable instead of squeezing to fit. The
              chart's own width grows with the data; the outer div scrolls
              if that width exceeds the visible area. */}
          <div style={{ overflowX: 'auto' }}>
            <div style={{ width: Math.max(result.groups.length * 60, 600) }}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={result.groups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="group"
                    tick={{ fontSize: 11 }}
                    angle={-40}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis unit={selectedKpi.unit} />
                  <Tooltip formatter={(value) => `${value}${selectedKpi.unit}`} />
                  <Bar dataKey="value">
                    {result.groups.map((entry) => (
                      <Cell
                        key={entry.group}
                        fill={entry.is_outlier ? '#c0392b' : '#3b6ea5'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default KpiOutlierPanel