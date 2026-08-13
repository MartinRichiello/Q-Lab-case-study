import { useState } from 'react'

interface InfoButtonProps {
  lines: string[]
}

function InfoButton({ lines }: InfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '0.5rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Show explanation"
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: '1px solid var(--color-primary)',
          backgroundColor: isOpen ? 'var(--color-primary)' : '#f0f0f0',
          color: isOpen ? '#fff' : 'var(--color-primary)',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ?
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '28px',
            left: 0,
            zIndex: 10,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            padding: '0.9rem 1.1rem',
            width: '320px',
            fontSize: '0.88rem',
            lineHeight: '1.7',
            color: '#333',
          }}
        >
          {lines.map((line, index) => (
            <div key={index} style={{ marginBottom: index < lines.length - 1 ? '0.5rem' : 0 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </span>
  )
}

export default InfoButton