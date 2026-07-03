import { useRef } from "react"
import type { PatternDef } from "../types"

interface Props {
  onSelect: (pattern: PatternDef) => void
  onDoubleClick: (pattern: PatternDef) => void
  selectedId: string | null
}

const soundMap: Record<string, string> = {
  "whip": "/sounds/whip.mp3",
  "sugar-push": "/sounds/sugar-push.mp3",
  "sugar-tuck": "/sounds/sugar-tuck.mp3",
  "sweetheart": "/sounds/sweetheart.mp3",
  "lsp": "/sounds/left-side-pass.mp3",
  "underarm": "/sounds/underarm-turn.mp3",
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

const patterns8: PatternDef[] = [
  { id: "whip", name: "Whip", beats: 8, description: "Basic 8-count whip" },
]

const patterns6: PatternDef[] = [
  { id: "sugar-push", name: "Sugar Push", beats: 6, description: "Push with anchor" },
  { id: "lsp", name: "Left Side Pass", beats: 6, description: "Pass on left" },
  { id: "underarm", name: "Underarm Turn", beats: 6, description: "Turn under arm" },
  { id: "sugar-tuck", name: "Sugar Tuck", beats: 6, description: "Tuck and turn" },
  { id: "sweetheart", name: "Sweetheart", beats: 6, description: "Walk together" },
]

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
