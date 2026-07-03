import type { PatternDef } from "../types"

interface Props {
  onSelect: (pattern: PatternDef) => void
  onDoubleClick: (pattern: PatternDef) => void
  selectedId: string | null
}

export default function PatternPalette({ onSelect, onDoubleClick, selectedId }: Props) {
  return (
    <div className="palette">
      <h2>Patterns</h2>
      <p className="palette-hint">Click to select, then tap a beat, or double-click to place on next free beat</p>

      <Group label="8-Count Patterns" patterns={patterns8} onSelect={onSelect} onDoubleClick={onDoubleClick} selectedId={selectedId} />
      <Group label="6-Count Patterns" patterns={patterns6} onSelect={onSelect} onDoubleClick={onDoubleClick} selectedId={selectedId} />
    </div>
  )
}

const patterns8: PatternDef[] = [
  { id: "whip", name: "Whip", beats: 8, description: "Basic 8-count whip" },
  { id: "sugar-whip", name: "Sugar Whip", beats: 8, description: "Whip with inside turn" },
  { id: "push-whip", name: "Push Whip", beats: 8, description: "Push break into whip" },
  { id: "outside-whip", name: "Outside Whip", beats: 8, description: "Whip from outside" },
]

const patterns6: PatternDef[] = [
  { id: "lsp", name: "Left Side Pass", beats: 6, description: "Pass on left" },
  { id: "rsp", name: "Right Side Pass", beats: 6, description: "Pass on right" },
  { id: "tuck-turn", name: "Tuck Turn", beats: 6, description: "Tuck and turn" },
  { id: "underarm", name: "Underarm Turn", beats: 6, description: "Turn under arm" },
  { id: "sweetheart", name: "Sweetheart", beats: 6, description: "Walk together" },
  { id: "sugar-push", name: "Sugar Push", beats: 6, description: "Push with anchor" },
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
