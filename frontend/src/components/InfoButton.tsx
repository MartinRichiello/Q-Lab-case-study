import { useState } from 'react'

interface InfoButtonProps {
  // Accepts an array of strings — each one rendered as its own line/bullet.
  // Using an array (rather than one long string) is what makes "each
  // bullet point takes a line of space" trivial to guarantee, regardless
  // of how long an individual line's text is.
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
          border: '1px solid #888',
          backgroundColor: isOpen ? '#3b6ea5' : '#f0f0f0',
          color: isOpen ? '#fff' : '#333',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          lineHeight: 1,
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
            // Each line is its own block-level element, guaranteeing it
            // occupies its own row regardless of length — rather than
            // relying on manual line breaks inside one string, which
            // would be fragile if the text ever gets edited.
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