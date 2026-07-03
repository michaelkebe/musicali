import { useRef } from "react"
import type { PatternDef } from "../types"
import { soundMap, patterns8, patterns6 } from "../data/patterns"

interface Props {
  onSelect: (pattern: PatternDef) => void
  onDoubleClick: (pattern: PatternDef) => void
  selectedId: string | null
}

export default function PatternPalette({ onSelect, onDoubleClick, selectedId }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleSelect = (p: PatternDef) => {
    onSelect(p)
    const src = soundMap[p.id]
    if (!src) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    audioRef.current = new Audio(src)
    audioRef.current.play()
  }

  return (
    <div className="palette">
      <h2>Patterns</h2>
      <p className="palette-hint">Click to select, then tap a beat, or double-click to place on next free beat</p>

      <Group label="6-Count Patterns" patterns={patterns6} onSelect={handleSelect} onDoubleClick={onDoubleClick} selectedId={selectedId} />
      <Group label="8-Count Patterns" patterns={patterns8} onSelect={handleSelect} onDoubleClick={onDoubleClick} selectedId={selectedId} />
    </div>
  )
}

function Group({
  label,
  patterns,
  onSelect,
  onDoubleClick,
  selectedId,
}: {
  label: string
  patterns: PatternDef[]
  onSelect: (p: PatternDef) => void
  onDoubleClick: (p: PatternDef) => void
  selectedId: string | null
}) {
  return (
    <div className="palette-group">
      <h3>{label}</h3>
      <div className="palette-items">
        {patterns.map((p) => (
          <button
            key={p.id}
            className={`palette-item ${p.beats === 8 ? "count-8" : "count-6"} ${selectedId === p.id ? "selected" : ""}`}
            onClick={() => onSelect(p)}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onDoubleClick(p)
            }}
          >
            <span className="pat-name">{p.name}</span>
            <span className="pat-count">{p.beats}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
