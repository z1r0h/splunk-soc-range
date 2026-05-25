const DIFF_COLORS = {
  Easy: { bg: 'var(--green-bg)', color: 'var(--green)' },
  Medium: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
  Hard: { bg: 'var(--red-bg)', color: 'var(--red)' },
}

const TYPE_COLORS = {
  SPL_Technical: { bg: 'var(--accent-bg)', color: 'var(--accent)' },
  ES_Concept: { bg: 'var(--purple-bg)', color: 'var(--purple)' },
}

function Stars({ count }) {
  return (
    <span style={{ fontSize: '10px', letterSpacing: '1px' }}>
      {[1,2,3].map(i => (
        <span key={i} style={{ color: i <= count ? 'var(--amber)' : 'var(--bg-4)' }}>★</span>
      ))}
    </span>
  )
}

export default function Sidebar({ missions, activeMissionId, onSelect, progress, mode }) {
  const spl = missions.filter(m => m.type === 'SPL_Technical')
  const es  = missions.filter(m => m.type === 'ES_Concept')

  if (mode === 'free') {
    return (
      <aside style={{ background: 'var(--bg-1)', borderRight: '1px solid var(--border)', padding: '16px', overflow: 'auto' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Free Search Mode</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '12px' }}>Query any of the 5 log datasets freely.</p>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>Available indexes:</div>
          {['wineventlog', 'network', 'proxy', 'sysmon', 'dns'].map(idx => (
            <div key={idx} style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontSize: '11px', padding: '3px 0' }}>
              index={idx}
            </div>
          ))}
          <div style={{ marginTop: '16px', color: 'var(--text-muted)', fontSize: '11px', marginBottom: '8px' }}>Lookup tables:</div>
          {['threat_intel_ip', 'threat_intel_domain', 'threat_intel_hash', 'user_asset_map', 'lolbins'].map(t => (
            <div key={t} style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple)', fontSize: '11px', padding: '3px 0' }}>
              {t}
            </div>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside style={{ background: 'var(--bg-1)', borderRight: '1px solid var(--border)', overflow: 'auto', padding: '8px 0' }}>
      <Section label="SPL Technical" missions={spl} activeMissionId={activeMissionId} onSelect={onSelect} progress={progress} />
      <div style={{ height: '1px', background: 'var(--border)', margin: '8px 12px' }} />
      <Section label="ES Concepts" missions={es} activeMissionId={activeMissionId} onSelect={onSelect} progress={progress} />
    </aside>
  )
}

function Section({ label, missions, activeMissionId, onSelect, progress }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ padding: '4px 14px 8px', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
      {missions.map(m => {
        const prog = progress[m.id]
        const isActive = m.id === activeMissionId
        const diff = DIFF_COLORS[m.difficulty]
        const typeC = TYPE_COLORS[m.type]
        return (
          <div
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              padding: '9px 14px', cursor: 'pointer', borderRadius: 0,
              background: isActive ? 'var(--bg-2)' : 'transparent',
              borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
              transition: 'all 0.12s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-faint)', minWidth: '16px' }}>{m.id}</span>
              <span style={{
                fontSize: '10px', padding: '1px 5px', borderRadius: '3px', fontWeight: 600,
                background: diff.bg, color: diff.color,
              }}>{m.difficulty}</span>
              {prog && <Stars count={prog.stars} />}
            </div>
            <div style={{ fontSize: '12px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.4', paddingLeft: '22px' }}>
              {m.title}
            </div>
            <div style={{ paddingLeft: '22px', marginTop: '3px' }}>
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', background: typeC.bg, color: typeC.color }}>
                {m.type === 'SPL_Technical' ? 'SPL' : 'ES'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
