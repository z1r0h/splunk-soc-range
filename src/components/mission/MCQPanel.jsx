export default function MCQPanel({ mission, selectedAnswer, submitted, onSubmit }) {
  if (!mission?.mcq) return null

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        {mission.task}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {mission.mcq.map(option => {
          const isSelected = selectedAnswer === option.key
          const isCorrect = option.key === mission.correct_answer
          let bg = 'var(--bg-2)'
          let border = 'var(--border)'
          let color = 'var(--text-secondary)'

          if (submitted) {
            if (isCorrect) { bg = 'var(--green-bg)'; border = 'var(--green)'; color = 'var(--green)' }
            else if (isSelected && !isCorrect) { bg = 'var(--red-bg)'; border = 'var(--red)'; color = 'var(--red)' }
          } else if (isSelected) {
            bg = 'var(--accent-bg)'; border = 'var(--accent)'; color = 'var(--accent)'
          }

          return (
            <div
              key={option.key}
              onClick={() => !submitted && onSubmit(option.key)}
              style={{
                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                background: bg, border: `1px solid ${border}`, color,
                cursor: submitted ? 'default' : 'pointer',
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '13px', minWidth: '20px' }}>
                {option.key}.
              </span>
              <span style={{ fontSize: '13px', lineHeight: '1.5' }}>{option.text}</span>
              {submitted && isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {submitted && isSelected && !isCorrect && <span style={{ marginLeft: 'auto' }}>✗</span>}
            </div>
          )
        })}
      </div>

      {submitted && (
        <div style={{
          padding: '14px 16px', borderRadius: 'var(--radius-md)',
          background: selectedAnswer === mission.correct_answer ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${selectedAnswer === mission.correct_answer ? 'var(--green)' : 'var(--red)'}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: selectedAnswer === mission.correct_answer ? 'var(--green)' : 'var(--red)' }}>
            {selectedAnswer === mission.correct_answer ? '✓ Correct!' : `✗ Incorrect — Correct answer: ${mission.correct_answer}`}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
            {mission.explanation}
          </div>
          {mission.soc_mindset && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent)' }}>
              <div style={{ fontSize: '10px', color: 'var(--accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SOC Mindset</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{mission.soc_mindset}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
