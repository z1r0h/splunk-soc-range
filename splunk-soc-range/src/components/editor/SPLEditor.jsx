import { useRef, useEffect } from 'react'

const KEYWORDS = ['search','where','eval','stats','eventstats','streamstats','timechart','bin','table','fields','rename','sort','head','tail','dedup','rex','lookup','inputlookup','join','append','appendcols','transaction','makemv','mvexpand','tstats','fillnull','replace','by','as','AS','from','FROM','where','WHERE','output','OUTPUT','type','span','window','current','maxspan','maxevents']
const FUNCTIONS = ['if','case','coalesce','isnotnull','isnull','cidrmatch','len','upper','lower','tostring','tonumber','substr','mvjoin','mvcount','mvindex','count','sum','avg','min','max','dc','values','list','first','last']

export default function SPLEditor({ value, onChange, onRun, isRunning, mission, mode }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (value.trim() && !isRunning) onRun(value)
      }
    }
    const el = textareaRef.current
    el?.addEventListener('keydown', handler)
    return () => el?.removeEventListener('keydown', handler)
  }, [value, isRunning, onRun])

  function handleTab(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart: s, selectionEnd: end } = e.target
      const newVal = value.slice(0, s) + '  ' + value.slice(end)
      onChange(newVal)
      setTimeout(() => { if (textareaRef.current) { textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 2 } }, 0)
    }
  }

  const placeholder = mode === 'free'
    ? `index=wineventlog EventCode=4625\n| stats count by src_ip\n| sort -count`
    : (mission?.required_commands?.length
      ? `Type your SPL query here...\nRequired: ${mission.required_commands.join(', ')}\n\nCtrl+Enter to run`
      : 'Type your SPL query here...\n\nCtrl+Enter to run')

  return (
    <div style={{
      flexShrink: 0,
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Editor header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderBottom: '1px solid var(--border)', gap: '8px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>SPL Query</span>
        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>Ctrl+Enter to run</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onChange('')}
            style={{ padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '11px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            Clear
          </button>
          <button
            onClick={() => value.trim() && !isRunning && onRun(value)}
            disabled={!value.trim() || isRunning}
            style={{
              padding: '4px 16px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 600,
              background: value.trim() && !isRunning ? 'var(--green-dim)' : 'var(--bg-3)',
              border: `1px solid ${value.trim() && !isRunning ? 'var(--green)' : 'var(--border)'}`,
              color: value.trim() && !isRunning ? 'white' : 'var(--text-faint)',
              cursor: value.trim() && !isRunning ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
          >
            {isRunning ? '⟳ Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleTab}
          placeholder={placeholder}
          spellCheck={false}
          style={{
            width: '100%', minHeight: '110px', maxHeight: '200px',
            padding: '12px 16px', background: 'var(--bg-0)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
            fontSize: '13px', lineHeight: '1.7', border: 'none',
            outline: 'none', resize: 'vertical',
          }}
        />
      </div>
    </div>
  )
}
