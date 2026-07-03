import { useState, useCallback } from "react"
import type { PatternDef, PlacedPattern } from "./types"
import { allPatterns } from "./data/patterns"
import PatternPalette from "./components/PatternPalette"
import PhraseTimeline from "./components/PhraseTimeline"
import "./App.css"

let nextId = 1

export default function App() {
  const [selected, setSelected] = useState<PatternDef | null>(null)
  const [placed, setPlaced] = useState<PlacedPattern[]>([])

  const handleSelect = useCallback((p: PatternDef) => {
    setSelected((prev) => (prev?.id === p.id ? null : p))
  }, [])

  const handlePlace = useCallback(
    (startBeat: number) => {
      if (!selected) return
      const end = startBeat + selected.beats - 1

      setPlaced((prev) => {
        const overlaps = prev.some((p) => {
          const def = allPatterns.find((d) => d.id === p.patternId)!
          return startBeat <= p.startBeat + def.beats - 1 && end >= p.startBeat
        })
        if (overlaps) return prev
        return [...prev, { id: `p${nextId++}`, patternId: selected.id, startBeat }]
      })
    },
    [selected],
  )

  const handleRemove = useCallback((id: string) => {
    setPlaced((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handleDoubleClick = useCallback((pattern: PatternDef) => {
    setPlaced((prev) => {
      const occupied = new Set<number>()
      for (const p of prev) {
        const def = allPatterns.find((d) => d.id === p.patternId)!
        for (let b = p.startBeat; b < p.startBeat + def.beats; b++) {
          occupied.add(b)
        }
      }
      for (let start = 1; start <= 128 - pattern.beats + 1; start++) {
        let free = true
        for (let b = start; b < start + pattern.beats; b++) {
          if (occupied.has(b)) { free = false; break }
        }
        if (free) {
          return [...prev, { id: `p${nextId++}`, patternId: pattern.id, startBeat: start }]
        }
      }
      return prev
    })
  }, [])

  const totalBeats = placed.reduce(
    (sum, p) => sum + (allPatterns.find((d) => d.id === p.patternId)?.beats ?? 0),
    0,
  )
  const lastBeat =
    placed.length > 0
      ? Math.max(
          ...placed.map(
            (p) => p.startBeat + (allPatterns.find((d) => d.id === p.patternId)?.beats ?? 0) - 1,
          ),
        )
      : 0
  const phraseCount = totalBeats === 0 ? 0 : Math.ceil(lastBeat / 32)

  return (
    <div className="app">
      <header>
        <h1>Musicali</h1>
        <p className="subtitle">WCS Phrase &amp; Pattern Visualizer</p>
      </header>

      <div className="app-layout">
        <PatternPalette onSelect={handleSelect} onDoubleClick={handleDoubleClick} selectedId={selected?.id ?? null} />
        <div className="main-col">
          <PhraseTimeline placed={placed} onPlace={handlePlace} onRemove={handleRemove} />

          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">Patterns</span>
              <span className="stat-value">{placed.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Beats Used</span>
              <span className="stat-value">{totalBeats}</span>
              <span className="stat-sub">/ 128</span>
            </div>
            <div className="stat">
              <span className="stat-label">Phrases</span>
              <span className="stat-value">{phraseCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">8-counts</span>
              <span className="stat-value">{Math.ceil(totalBeats / 8)}</span>
            </div>
          </div>

          {placed.length > 0 && (
            <button className="clear-btn" onClick={() => setPlaced([])}>
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
