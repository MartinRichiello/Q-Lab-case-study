

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

// Same shape as in App.tsx. In a bigger project we'd put this type in its
// own shared file (e.g. types.ts) to avoid repeating it — we'll do that
// once we have a second component that also needs it.
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

// The component receives the defect list as a "prop" — data owned and
// fetched by App.tsx, just passed down here for display.
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

// Column definitions: this tells TanStack Table WHICH fields to show,
// what header label to use, and (implicitly) enables sorting on each,
// since we're not disabling it per-column.
const columns: ColumnDef<Defect>[] = [
  {
    accessorKey: 'date',
    header: 'Date',
    // Dates arrive as full ISO strings (e.g. "2025-07-03T00:00:00").
    // We format them to just the date part for readability.
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
  },
  { accessorKey: 'defect_name', header: 'Defect' },
  { accessorKey: 'station', header: 'Station' },
  { accessorKey: 'car_model', header: 'Model' },
  { accessorKey: 'severity_rating', header: 'Severity' },
  {
    accessorKey: 'resolution_time_days',
    header: 'Resolution (days)',
    // Missing resolution time means the defect is still unresolved —
    // we show that explicitly instead of a blank cell, since silently
    // showing nothing could be mistaken for a data error rather than
    // a meaningful "still open" status.
    cell: (info) => info.getValue() ?? 'Unresolved',
  },
  { accessorKey: 'rework_time_minutes', header: 'Rework (min)' },
  { accessorKey: 'defect_category', header: 'Category' },
  { accessorKey: 'reporter_name', header: 'Reporter' },
]

function DefectTable({ defects, outliers }: DefectTableProps) {
  // Holds which column is currently sorted, and in which direction.
  // This is TanStack Table's required state for enabling sorting.
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')



  // Build a Set of defect_ids flagged by ANY outlier metric, for fast
  // O(1) lookup per row instead of searching an array on every render.
  // A Set is the right tool here specifically because we only need to
  // ask "is this ID in here?" — not iterate or sort it.
  const resolutionOutlierIds = new Set(outliers?.resolution_time_days.outlier_ids ?? [])
  const reworkOutlierIds = new Set(outliers?.rework_time_minutes.outlier_ids ?? [])
  const severityOutlierIds = new Set(outliers?.severity_category.outlier_ids ?? [])

  // A row gets the light background tint if it's flagged by ANY metric,
  // for quick scanning. Which SPECIFIC cell turns red text is decided
  // per-column below, so the reason is immediately clear, not just "something's off".
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
    <div>
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
                // Determine if THIS SPECIFIC cell is the one that triggered
                // a flag, based on which column it belongs to.
                const columnId = cell.column.id
                const isFlaggedCell =
                  (columnId === 'resolution_time_days' && resolutionOutlierIds.has(defectId)) ||
                  (columnId === 'rework_time_minutes' && reworkOutlierIds.has(defectId)) ||
                  (columnId === 'severity_rating' && severityOutlierIds.has(defectId))
                  // Note: rework_time_minutes isn't currently a visible
                  // column in this table, so it can't be highlighted at
                  // the cell level yet — it still contributes to the row
                  // tint via isRowFlagged above.

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

      {/* Pagination controls */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default DefectTable