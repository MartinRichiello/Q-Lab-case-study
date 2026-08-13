import { useState } from 'react'
import { useFlags, type FlaggedItem } from '../context/FlagContext'

interface FlagModalProps {
  defectId: number
  label: string
  onClose: () => void
}

function FlagModal({ defectId, label, onClose }: FlagModalProps) {
  const { flags, addFlag, updateFlag, removeFlag } = useFlags()
  const existing = flags.find((f) => f.defectId === defectId)

  const [note, setNote] = useState(existing?.note ?? '')
  const [status, setStatus] = useState<FlaggedItem['status']>(existing?.status ?? 'under review')

  const handleSave = () => {
    if (existing) {
      updateFlag(defectId, { note, status })
    } else {
      addFlag({ defectId, label, note, status })
    }
    onClose()
  }

  const handleRemove = () => {
    removeFlag(defectId)
    onClose()
  }

  return (
    // The semi-transparent backdrop: clicking it closes the modal without
    // saving, same as clicking outside any typical dialog.
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      {/* Stop propagation so clicking INSIDE the modal doesn't also
          trigger the backdrop's onClose. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: '380px', maxWidth: '90vw' }}
      >
        <h3 style={{ marginTop: 0 }}>
          {existing ? 'Edit Flag' : 'Flag as Quality Anomaly'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {label}
        </p>

        <label style={{ display: 'block', marginBottom: '0.75rem' }}>
          Note:
          <br />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Battery anomaly — investigate calibration"
            rows={3}
            style={{
              width: '100%',
              marginTop: '0.3rem',
              padding: '0.5rem',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Status:
          <br />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FlaggedItem['status'])}
            style={{ marginTop: '0.3rem' }}
          >
            <option value="under review">Under review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          {existing && (
            <button
              onClick={handleRemove}
              style={{ backgroundColor: 'var(--color-outlier)', borderColor: 'var(--color-outlier)' }}
            >
              Remove Flag
            </button>
          )}
          <button onClick={onClose} style={{ backgroundColor: '#888', borderColor: '#888' }}>
            Cancel
          </button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default FlagModal