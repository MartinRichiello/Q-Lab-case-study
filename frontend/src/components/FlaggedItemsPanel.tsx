import { useState } from 'react'
import { useFlags, type FlaggedItem } from '../context/FlagContext'
import FlagModal from './FlagModal'

const STATUS_COLORS: Record<FlaggedItem['status'], string> = {
  'under review': '#c98a1f',
  resolved: '#3ba55d',
  dismissed: '#888',
}

interface Defect {
  defect_id: number
  defect_name: string
  station: string
  defect_category: string
}

interface FlaggedItemsPanelProps {
  defects: Defect[]
}

function FlaggedItemsPanel({ defects }: FlaggedItemsPanelProps) {
  const { flags } = useFlags()
  const [statusFilter, setStatusFilter] = useState<'all' | FlaggedItem['status']>('all')
  const [searchText, setSearchText] = useState('')
  const [editingDefectId, setEditingDefectId] = useState<number | null>(null)

  const [aiLoadingId, setAiLoadingId] = useState<number | null>(null)
  const [aiResult, setAiResult] = useState<{
    defectId: number
    likely_factors: string[]
    suggested_next_step: string
    confidence_note: string
  } | null>(null)

  const handleExport = () => {
    const dataStr = JSON.stringify(flags, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `flagged-items-${new Date().toISOString().slice(0, 10)}.json`
    link.click()

    URL.revokeObjectURL(url)
  }

  // Looks up the full defect record so we can send real context (name,
  // station, category) to the AI endpoint — the flag itself only stores
  // a label and note. For non-defect flags (like a flagged DAY, which
  // has a negative synthetic ID), there's no matching defect record, so
  // we fall back to generic placeholders built from the flag's own label.
  const handleGetAiSuggestion = (flag: FlaggedItem) => {
    const defect = defects.find((d) => d.defect_id === flag.defectId)

    setAiLoadingId(flag.defectId)
    setAiResult(null)

    fetch('http://localhost:8000/ai-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defect_name: defect?.defect_name ?? flag.label,
        station: defect?.station ?? 'N/A',
        category: defect?.defect_category ?? 'N/A',
        note: flag.note,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setAiResult({ defectId: flag.defectId, ...data })
        setAiLoadingId(null)
      })
      .catch((error) => {
        console.error('Failed to get AI suggestion:', error)
        setAiLoadingId(null)
      })
  }

  const filtered = flags
    .filter((f) => statusFilter === 'all' || f.status === statusFilter)
    .filter(
      (f) =>
        searchText === '' ||
        f.note.toLowerCase().includes(searchText.toLowerCase()) ||
        f.label.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => b.flaggedAt.localeCompare(a.flaggedAt))

  return (
    <div className="card">
      <h2>Flagged Items Tracker</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
          {flags.length} item{flags.length === 1 ? '' : 's'} flagged this session
          (in-memory only — resets on page reload).
        </p>
        {flags.length > 0 && (
          <button onClick={handleExport} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Export as JSON
          </button>
        )}
      </div>

      {flags.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>
          No items flagged yet. Click "Flag" on any table row to get started.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0' }}>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '220px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="all">All statuses</option>
              <option value="under review">Under review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Note</th>
                <th>Status</th>
                <th>Flagged At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((flag) => (
                <tr key={flag.defectId}>
                  <td>{flag.label}</td>
                  <td>{flag.note || <em style={{ color: '#aaa' }}>No note</em>}</td>
                  <td>
                    <span
                      style={{
                        color: STATUS_COLORS[flag.status],
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                      }}
                    >
                      ● {flag.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {new Date(flag.flaggedAt).toLocaleString()}
                  </td>
                  <td style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setEditingDefectId(flag.defectId)}
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleGetAiSuggestion(flag)}
                      disabled={aiLoadingId === flag.defectId}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.3rem 0.6rem',
                        backgroundColor: '#7a5ea8',
                        borderColor: '#7a5ea8',
                      }}
                    >
                      {aiLoadingId === flag.defectId ? 'Thinking...' : 'AI Suggestion'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {aiResult && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f3effa',
                border: '1px solid #7a5ea8',
                borderRadius: '8px',
              }}
            >
              <h3 style={{ marginTop: 0, color: '#7a5ea8' }}>🤖 AI Root Cause Suggestion</h3>
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                Likely contributing factors:
              </p>
              <ul style={{ marginTop: 0 }}>
                {aiResult.likely_factors.map((factor, i) => (
                  <li key={i} style={{ fontSize: '0.88rem', marginBottom: '0.3rem' }}>
                    {factor}
                  </li>
                ))}
              </ul>
              <p style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                Suggested next step:
              </p>
              <p style={{ fontSize: '0.88rem' }}>{aiResult.suggested_next_step}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                {aiResult.confidence_note}
              </p>
            </div>
          )}

          {filtered.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>
              No flagged items match the current filter/search.
            </p>
          )}
        </>
      )}

      {editingDefectId !== null && (
        <FlagModal
          defectId={editingDefectId}
          label={flags.find((f) => f.defectId === editingDefectId)?.label ?? ''}
          onClose={() => setEditingDefectId(null)}
        />
      )}
    </div>
  )
}

export default FlaggedItemsPanel