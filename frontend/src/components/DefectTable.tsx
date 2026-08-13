

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
  defect_category: string
  reporter_name: string
}

// The component receives the defect list as a "prop" — data owned and
// fetched by App.tsx, just passed down here for display.
interface DefectTableProps {
  defects: Defect[]
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
  { accessorKey: 'defect_category', header: 'Category' },
  { accessorKey: 'reporter_name', header: 'Reporter' },
]

function DefectTable({ defects }: DefectTableProps) {
  // Holds which column is currently sorted, and in which direction.
  // This is TanStack Table's required state for enabling sorting.
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
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