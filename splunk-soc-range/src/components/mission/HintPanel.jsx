import { useState } from 'react'

export default function HintPanel({ hints, hintsUsed, onUnlockHint }) {
  const [expanded, setExpanded] = useState(false)
  if (!hints || !hints.length) return null

  const unlockedHints = hints.slice(0, hintsUsed)
  const hasMore = hintsUsed < hints.length
  const nextHint = hints[hintsUsed]

  return (
    <div style={{ background: 'var(--amber-bg)', borderBottom: '1px solid #3d2e0c', flexShrink: 0 }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 16px', cursor: 'pointer', userSelect: 'none' }}
      >
        <span style={{ color: 'var(--amber)', fontSize: '12px' }}>💡</span>
        <span style={{ color: 'var(--amber)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Hints ({hintsUsed}/{hints.length} unlocked)
        </span>
        {hasMore && !expanded && (
          <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--amber)', opacity: 0.7 }}>
            Click to expand
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: '11px', opacity: 0.7 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Content */}
      {expanded && (
        <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Unlocked hints */}
          {unlockedHints.map((hint, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)',
              borderLeft: `2px solid ${i === 2 ? 'var(--green)' : 'var(--amber)'}`,
            }}>
              <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px', color: i === 2 ? 'var(--green)' : 'var(--amber-bright)' }}>
                {i === 2 ? '✓ Answer' : `Hint ${i + 1} — ${hint.label}`}
              </div>
              <pre style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontFamily: hint.level >= 2 ? 'var(--font-mono)' : 'var(--font-sans)', margin: 0, lineHeight: '1.6' }}>
                {hint.text}
              </pre>
            </div>
          ))}

          {/* Unlock next button */}
          {hasMore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={onUnlockHint}
                style={{
                  padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
                  background: 'rgba(210,153,34,0.15)', border: '1px solid var(--amber)',
                  color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                  transition: 'background 0.15s',
                }}
              >
                Unlock {nextHint?.label || `Hint ${hintsUsed + 1}`}
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {hintsUsed === 0 ? 'Using hints reduces your score (3★ → 2★ → 1★)' : `${hints.length - hintsUsed} hint(s) remaining`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
