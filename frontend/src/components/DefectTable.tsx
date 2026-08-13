import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import InfoButton from './InfoButton'
import { useFlags } from '../context/FlagContext'
import FlagModal from './FlagModal'

interface Defect {
  defect_id: number
  date: string
  defect_name: string
  station: string
  car_model: string
  severity_rating: number
  resolution_time_days: number | null
  rework_time_minutes: number
  defect_category: string
  reporter_name: string
}

interface OutlierMetric {
  outlier_ids?: number[]
  outlier_dates?: string[]
}

interface OutlierData {
  resolution_time_days: OutlierMetric
  rework_time_minutes: OutlierMetric
  defects_per_day: OutlierMetric
  severity_category: OutlierMetric
}

interface DefectTableProps {
  defects: Defect[]
  outliers: OutlierData | null
}

// A small standalone component for the per-row flag button. It reads/writes
// the shared FlagContext directly, and manages its OWN "is my modal open"
// state — this keeps DefectTable itself simpler, since it doesn't need to
// track which row's modal is open globally.
function FlagActionCell({ defectId }: { defectId: number }) {
  const { isFlagged } = useFlags()
  const [modalOpen, setModalOpen] = useState(false)
  const flagged = isFlagged(defectId)

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        style={{
          backgroundColor: flagged ? 'var(--color-outlier)' : '#888',
          borderColor: flagged ? 'var(--color-outlier)' : '#888',
          fontSize: '0.75rem',
          padding: '0.3rem 0.6rem',
        }}
      >
        {flagged ? 'Flagged' : 'Flag'}
      </button>
      {modalOpen && (
        <FlagModal
          defectId={defectId}
          label={`Defect #${defectId}`}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

const columns: ColumnDef<Defect>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
  },
  { accessorKey: 'defect_name', header: 'Defect' },
  { accessorKey: 'station', header: 'Station' },
  { accessorKey: 'car_model', header: 'Model' },
  { accessorKey: 'severity_rating', header: 'Severity' },
  {
    accessorKey: 'resolution_time_days',
    header: 'Resolution (days)',
    cell: (info) => info.getValue() ?? 'Unresolved',
  },
  { accessorKey: 'rework_time_minutes', header: 'Rework (min)' },
  { accessorKey: 'defect_category', header: 'Category' },
  { accessorKey: 'reporter_name', header: 'Reporter' },
  {
    id: 'flag_action',
    header: 'Flag',
    // This column has no matching data field — it's a button per row,
    // so we access the whole row via info.row instead of accessorKey.
    cell: (info) => <FlagActionCell defectId={info.row.original.defect_id} />,
  },
]

function DefectTable({ defects, outliers }: DefectTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const resolutionOutlierIds = new Set(outliers?.resolution_time_days.outlier_ids ?? [])
  const reworkOutlierIds = new Set(outliers?.rework_time_minutes.outlier_ids ?? [])
  const severityOutlierIds = new Set(outliers?.severity_category.outlier_ids ?? [])

  const isRowFlagged = (defectId: number) =>
    resolutionOutlierIds.has(defectId) ||
    reworkOutlierIds.has(defectId) ||
    severityOutlierIds.has(defectId)

  const table = useReactTable({
    data: defects,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="card">
      <div style={{ overflowX: 'auto' }}>
        <h2>
          Defect Records
          <InfoButton
            lines={[
              'Rows are highlighted when a defect is statistically or categorically unusual.',
              'Resolution Time — flagged if it exceeds the dataset average plus 2 standard deviations (currently ~10.8 days).',
              'Rework Time — same method, flagged above ~229.6 minutes.',
              'Severity — flagged if BMW\'s own classification labels it "Extreme" (safety, legal, or major functional risk), not based on the numeric severity rating, which does not correspond to an increasing severity scale.',
              'The specific cell that triggered a flag is shown in bold red; the whole row is tinted so flagged records are easy to spot while scanning.',
            ]}
          />
        </h2>
        <input
          type="text"
          placeholder="Search defects..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{ marginBottom: '1rem', padding: '0.5rem', width: '300px' }}
        />
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: 'pointer' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const defectId = row.original.defect_id
              const flagged = isRowFlagged(defectId)

              return (
                <tr
                  key={row.id}
                  style={flagged ? { backgroundColor: '#fdf2f2' } : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnId = cell.column.id
                    const isFlaggedCell =
                      (columnId === 'resolution_time_days' && resolutionOutlierIds.has(defectId)) ||
                      (columnId === 'rework_time_minutes' && reworkOutlierIds.has(defectId)) ||
                      (columnId === 'severity_rating' && severityOutlierIds.has(defectId))

                    return (
                      <td
                        key={cell.id}
                        style={
                          isFlaggedCell
                            ? { color: '#c0392b', fontWeight: 'bold' }
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </button>
      </div>
    </div>
  )
}

export default DefectTable