import { useState, useMemo } from 'react'
import { executeSPL, getColumns } from '../../engine/executor.js'

function formatCell(val) {
  if (val === null || val === undefined) return <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>null</span>
  if (Array.isArray(val)) return <span style={{ color: 'var(--purple)' }}>[{val.join(', ')}]</span>
  const s = String(val)
  if (s.length > 120) return <span title={s}>{s.slice(0, 120)}…</span>
  return s
}

function cellColor(key, val) {
  const s = String(val || '')
  if (key === '_time') return 'var(--text-muted)'
  if (key === 'EventCode') return 'var(--amber)'
  if (key === 'action') {
    if (s === 'allow') return 'var(--green)'
    if (s === 'deny' || s === 'blocked') return 'var(--red)'
  }
  if (key === 'outcome' || key === 'risk_tier') {
    if (s === 'Success' || s === 'Low') return 'var(--green)'
    if (s === 'Failure' || s === 'Medium' || s === 'High') return 'var(--red)'
    if (s === 'Critical') return 'var(--purple)'
  }
  if (key === 'threat_type' || key === 'is_suspicious') return 'var(--red)'
  if (key === 'confidence') {
    if (s === 'High') return 'var(--red)'
    if (s === 'Medium') return 'var(--amber)'
  }
  if (key.includes('ip') || key === 'src' || key === 'dest') return 'var(--cyan)'
  if (key === 'user') return 'var(--accent)'
  if (key === 'count' || key === 'total_failures' || key === 'eventcount') return 'var(--amber)'
  return 'var(--text-secondary)'
}

export default function ResultsPanel({ results, error, mission, mode, onCorrect }) {
  const [splInput, setSplInput] = useState(null)
  const [liveResults, setLiveResults] = useState(null)
  const [liveError, setLiveError] = useState(null)
  const [marked, setMarked] = useState(false)

  const displayResults = liveResults ?? results
  const displayError = liveError ?? error

  function handleRun(spl) {
    try {
      const r = executeSPL(spl)
      setLiveResults(r)
      setLiveError(null)
    } catch (e) {
      setLiveError(e.message)
      setLiveResults(null)
    }
  }

  function handleMarkComplete() {
    setMarked(true)
    onCorrect?.()
  }

  const cols = useMemo(() => {
    if (!displayResults?.rows?.length) return []
    return getColumns(displayResults.rows)
  }, [displayResults])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Results header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-1)' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>Results</span>
        {displayResults && (
          <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
            {displayResults.total} event{displayResults.total !== 1 ? 's' : ''}
            {displayResults.truncated && <span style={{ color: 'var(--amber)' }}> (showing 500)</span>}
          </span>
        )}
        {mode === 'mission' && mission?.type === 'SPL_Technical' && displayResults?.rows?.length > 0 && !marked && (
          <button
            onClick={handleMarkComplete}
            style={{
              marginLeft: 'auto', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
              background: 'var(--green-bg)', border: '1px solid var(--green)', color: 'var(--green)',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            ✓ Mark Complete
          </button>
        )}
        {marked && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--green)' }}>✓ Completed!</span>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {/* Error */}
        {displayError && (
          <div style={{ margin: '16px', padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-dim)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--red)' }}>
            <div style={{ fontSize: '11px', color: 'var(--red)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SPL Error</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{displayError}</div>
          </div>
        )}

        {/* No results */}
        {!displayError && displayResults && displayResults.rows.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>∅</div>
            <div style={{ fontSize: '13px' }}>No results — check your search filters</div>
          </div>
        )}

        {/* Results table */}
        {!displayError && displayResults?.rows?.length > 0 && (
          <div style={{ overflow: 'auto', height: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', tableLayout: 'auto' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-2)', zIndex: 1 }}>
                <tr>
                  {cols.map(col => (
                    <th key={col} style={{
                      padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)',
                      fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600,
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                      letterSpacing: '0.3px',
                    }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayResults.rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    {cols.map(col => (
                      <td key={col} style={{
                        padding: '6px 12px', borderBottom: '1px solid rgba(48,54,61,0.5)',
                        fontFamily: 'var(--font-mono)', color: cellColor(col, row[col]),
                        whiteSpace: col === '_time' ? 'nowrap' : 'normal',
                        maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {formatCell(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!displayError && !displayResults && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px', opacity: 0.4 }}>▶</div>
            <div style={{ fontSize: '12px' }}>Run a query to see results</div>
          </div>
        )}

        {/* SOC mindset shown after results */}
        {mode === 'mission' && marked && mission?.soc_mindset && (
          <div style={{ margin: '12px 16px', padding: '12px 16px', background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent)' }}>
            <div style={{ fontSize: '10px', color: 'var(--accent)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOC Mindset</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{mission.soc_mindset}</div>
            {mission.mitre_explanation && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--purple)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MITRE ATT&CK</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{mission.mitre_explanation}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
