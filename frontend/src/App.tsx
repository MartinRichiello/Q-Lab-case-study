import { useEffect, useState } from 'react'
import { FlagProvider } from './context/FlagContext'
import DefectTable from './components/DefectTable'
import DefectsPerDayChart from './components/DefectsPerDayChart'
import DefectsPerModelChart from './components/DefectsPerModelChart'
import ResolutionTimePerReporterChart from './components/ResolutionTimePerReporterChart'
import DefectShareByDimensionChart from './components/DefectShareByDimensionChart'
import TopDefectsTable from './components/TopDefectsTable'
import DefectCategoryDrilldownChart from './components/DefectCategoryDrilldownChart'
import KpiOutlierPanel from './components/KpiOutlierPanel'
import AnalysisSection from './components/AnalysisSection'
import FlaggedItemsPanel from './components/FlaggedItemsPanel'
import ReflectionSection from './components/ReflectionSection'

// This describes the shape of ONE defect record coming from the backend.
interface Defect {
  defect_id: number
  date: string
  time: string
  defect_name: string
  station: string
  part_of_car: string
  reporter_name: string
  part_number: string
  severity_rating: number
  severity_category: string
  car_model: string
  motor_type: string
  design_package: string
  production_shift: string
  resolution_time_days: number | null
  root_cause_identified: string | null
  defect_category: string
  resolution_date: string | null
  rework_time_minutes: number
}


// Shape of ONE metric's outlier result, matching outliers.py's return shape.
interface OutlierMetric {
  column: string
  method: string
  mean: number | null
  std_dev: number | null
  threshold_used: number | string
  std_dev_multiplier: number | null
  outlier_ids?: number[]
  outlier_dates?: string[]
  outlier_count: number
}

interface OutlierData {
  resolution_time_days: OutlierMetric
  rework_time_minutes: OutlierMetric
  defects_per_day: OutlierMetric
  severity_category: OutlierMetric
}


function App() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)
  const [outliers, setOutliers] = useState<OutlierData | null>(null)

  useEffect(() => {
    fetch('http://localhost:8000/defects')
      .then((response) => response.json())
      .then((data: Defect[]) => {
        setDefects(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Failed to fetch defects:', error)
        setLoading(false)
      })

    fetch('http://localhost:8000/outliers')
      .then((response) => response.json())
      .then((data: OutlierData) => {
        setOutliers(data)
      })
      .catch((error) => {
        console.error('Failed to fetch outliers:', error)
      })
  }, [])

  return (
    <FlagProvider>
    <div className="page-container">
      <h1>Q Lab Quality Dashboard</h1>
      {loading ? (
        <p>Loading defect data...</p>
      ) : (
        <>
          <DefectTable defects={defects} outliers={outliers} />
          <FlaggedItemsPanel defects={defects} />
          <AnalysisSection />
          <DefectsPerDayChart defects={defects} outliers={outliers} />
          <DefectsPerModelChart defects={defects} />
          <ResolutionTimePerReporterChart defects={defects} />
          <DefectShareByDimensionChart defects={defects} />
          <TopDefectsTable defects={defects} />
          <DefectCategoryDrilldownChart defects={defects} />
          <KpiOutlierPanel />
          <ReflectionSection />
        </>
        
      )}
    </div>
    </FlagProvider>
  )
}

export default App