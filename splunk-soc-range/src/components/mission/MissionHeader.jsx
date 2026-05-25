const DIFF_STYLE = {
  Easy:   { bg: 'var(--green-bg)',  color: 'var(--green)'  },
  Medium: { bg: 'var(--amber-bg)', color: 'var(--amber)'  },
  Hard:   { bg: 'var(--red-bg)',   color: 'var(--red)'    },
}

export default function MissionHeader({ mission, mode }) {
  if (mode === 'free') {
    return (
      <div style={{ padding: '14px 20px', background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: '4px', letterSpacing: '1px' }}>FREE SEARCH MODE</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Query any field across all 5 log datasets. No missions, no scoring — just explore.
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Total events: ~500 records across wineventlog, network, proxy, sysmon, dns
        </div>
      </div>
    )
  }

  const diff = DIFF_STYLE[mission.difficulty]
  const envEntries = mission.context?.env ? Object.entries(mission.context.env) : []

  return (
    <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Title row */}
      <div style={{ padding: '12px 20px 10px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-faint)' }}>
              Mission {mission.id}
            </span>
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', fontWeight: 600, background: diff.bg, color: diff.color }}>
              {mission.difficulty}
            </span>
            {mission.mitre && (
              <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: 'var(--bg-3)', color: 'var(--text-muted)' }}>
                {mission.mitre.technique}
              </span>
            )}
            <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '3px', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              {mission.threat_type}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '6px' }}>
            {mission.title}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {mission.context?.description}
          </div>
        </div>
      </div>

      {/* Task */}
      {mission.task && (
        <div style={{ margin: '0 20px 10px', padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-dim)' }}>
          <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Task</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{mission.task}</div>
        </div>
      )}

      {/* Env vars */}
      {envEntries.length > 0 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {envEntries.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: '0', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', fontSize: '11px' }}>
              <span style={{ background: 'var(--bg-3)', color: 'var(--text-muted)', padding: '3px 8px', fontFamily: 'var(--font-mono)' }}>{k}</span>
              <span style={{ background: 'var(--bg-2)', color: 'var(--cyan)', padding: '3px 8px', fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Required commands */}
      {mission.required_commands && (
        <div style={{ padding: '0 20px 12px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '4px' }}>Required:</span>
          {mission.required_commands.map(cmd => (
            <code key={cmd} style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '3px', background: 'var(--bg-3)', color: 'var(--amber-bright)', fontFamily: 'var(--font-mono)', border: '1px solid var(--border)' }}>
              {cmd}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
