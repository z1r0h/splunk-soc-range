import { useState, useEffect } from 'react'
import TopBar from './components/layout/TopBar.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import MissionHeader from './components/mission/MissionHeader.jsx'
import HintPanel from './components/mission/HintPanel.jsx'
import MCQPanel from './components/mission/MCQPanel.jsx'
import SPLEditor from './components/editor/SPLEditor.jsx'
import ResultsPanel from './components/results/ResultsPanel.jsx'
import { executeSPL } from './engine/executor.js'
import { missions } from './data/missions.js'

const STORAGE_KEY = 'soc-range:progress'
function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} } }
function saveProgress(p) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch {} }

export default function App() {
  const [activeMissionId, setActiveMissionId] = useState('01')
  const [progress, setProgress] = useState(loadProgress)
  const [splValue, setSplValue] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [mcqAnswer, setMcqAnswer] = useState(null)
  const [mcqSubmitted, setMcqSubmitted] = useState(false)
  const [mode, setMode] = useState('mission')

  const mission = missions.find(m => m.id === activeMissionId) || missions[0]

  useEffect(() => {
    setSplValue(''); setResults(null); setError(null)
    setHintsUsed(0); setMcqAnswer(null); setMcqSubmitted(false)
  }, [activeMissionId])

  useEffect(() => { saveProgress(progress) }, [progress])

  function handleRunSPL(spl) {
    setIsRunning(true); setError(null)
    setTimeout(() => {
      try { setResults(executeSPL(spl)) }
      catch (err) { setError(err.message); setResults(null) }
      setIsRunning(false)
    }, 10)
  }

  function markComplete(id, stars) {
    setProgress(prev => {
      if (prev[id]?.stars >= stars) return prev
      return { ...prev, [id]: { stars, completedAt: new Date().toISOString() } }
    })
  }

  function handleMCQSubmit(key) {
    setMcqAnswer(key); setMcqSubmitted(true)
    if (key === mission.correct_answer) markComplete(mission.id, hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1)
  }

  function handleSPLCorrect() {
    markComplete(mission.id, hintsUsed === 0 ? 3 : hintsUsed === 1 ? 2 : 1)
  }

  const completedCount = Object.keys(progress).length
  const isES = mission.type === 'ES_Concept'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'var(--sidebar-width) 1fr', gridTemplateRows:'var(--topbar-height) 1fr', height:'100vh', overflow:'hidden', background:'var(--bg-0)' }}>
      <TopBar mode={mode} onModeChange={m => { setMode(m); setResults(null); setError(null) }} completedCount={completedCount} totalCount={missions.length} />
      <Sidebar missions={missions} activeMissionId={activeMissionId} onSelect={setActiveMissionId} progress={progress} mode={mode} />
      <main style={{ display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
        <MissionHeader mission={mission} mode={mode} />
        {mode === 'mission' && isES ? (
          <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
            <HintPanel hints={mission.hints} hintsUsed={hintsUsed} onUnlockHint={() => setHintsUsed(h => Math.min(h+1, mission.hints.length))} />
            <MCQPanel mission={mission} selectedAnswer={mcqAnswer} submitted={mcqSubmitted} onSubmit={handleMCQSubmit} />
          </div>
        ) : (
          <>
            {mode === 'mission' && (
              <HintPanel hints={mission.hints||[]} hintsUsed={hintsUsed} onUnlockHint={() => setHintsUsed(h => Math.min(h+1, (mission.hints||[]).length))} />
            )}
            <SPLEditor value={splValue} onChange={setSplValue} onRun={handleRunSPL} isRunning={isRunning} mission={mission} mode={mode} />
            <ResultsPanel results={results} error={error} mission={mission} mode={mode} onCorrect={handleSPLCorrect} />
          </>
        )}
      </main>
    </div>
  )
}
