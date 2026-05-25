export default function TopBar({ mode, onModeChange, completedCount, totalCount }) {
  const pct = Math.round((completedCount / totalCount) * 100)
  return (
    <header style={{
      gridColumn: '1 / -1',
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '0 16px', height: 'var(--topbar-height)', flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
        <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', letterSpacing: '1px' }}>
          SOC<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>range</span>
        </span>
        <span style={{ color: 'var(--border-bright)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>// SCDA Training v1.0</span>
      </div>

      <div style={{ display: 'flex', gap: '2px', marginLeft: '16px' }}>
        {['mission', 'free'].map(m => (
          <button key={m} onClick={() => onModeChange(m)} style={{
            padding: '5px 14px', borderRadius: 'var(--radius-sm)', fontSize: '11px',
            fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer',
            background: mode === m ? 'var(--bg-3)' : 'transparent',
            border: `1px solid ${mode === m ? 'var(--border-bright)' : 'transparent'}`,
            color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
            transition: 'all 0.15s', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {m === 'mission' ? 'Mission Mode' : 'Free Search'}
          </button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {completedCount}/{totalCount} completed
        </span>
        <div style={{ width: '120px', height: '4px', background: 'var(--bg-3)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', minWidth: '32px' }}>{pct}%</span>
      </div>
    </header>
  )
}
