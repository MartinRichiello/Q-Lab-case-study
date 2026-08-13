import { useEffect, useState } from 'react'
import DefectTable from './components/DefectTable'
import DefectsPerDayChart from './components/DefectsPerDayChart'
import DefectsPerModelChart from './components/DefectsPerModelChart'
import ResolutionTimePerReporterChart from './components/ResolutionTimePerReporterChart'
import DefectShareByDimensionChart from './components/DefectShareByDimensionChart'
import TopDefectsTable from './components/TopDefectsTable'
import DefectCategoryDrilldownChart from './components/DefectCategoryDrillDownChart'

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

function App() {
  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [])

  return (
    <div>
      <h1>Q Lab Quality Dashboard</h1>
      {loading ? (
        <p>Loading defect data...</p>
      ) : (
        <>
          <DefectTable defects={defects} />
          <DefectsPerDayChart defects={defects} />
          <DefectsPerModelChart defects={defects} />
          <ResolutionTimePerReporterChart defects={defects} />
          <DefectShareByDimensionChart defects={defects} />
          <TopDefectsTable defects={defects} />
          <DefectCategoryDrilldownChart defects={defects} />
        </>
        
      )}
    </div>
  )
}

export default App