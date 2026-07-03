import type { PlacedPattern } from "../types"
import { allPatterns } from "../data/patterns"

interface Props {
  placed: PlacedPattern[]
  onPlace: (startBeat: number) => void
  onRemove: (id: string) => void
}

const TOTAL_BEATS = 128
const COLS = 8
const ROWS = TOTAL_BEATS / COLS

interface Segment {
  pid: string
  patternId: string
  name: string
  totalBeats: number
  startCol: number
  endCol: number
  isStart: boolean
  isEnd: boolean
}

export default function PhraseTimeline({ placed, onPlace, onRemove }: Props) {
  const getPattern = (patternId: string) => allPatterns.find((p) => p.id === patternId)!

  const occupied = new Set<number>()
  for (const p of placed) {
    const def = getPattern(p.patternId)
    for (let b = p.startBeat; b < p.startBeat + def.beats; b++) {
      occupied.add(b)
    }
  }

  const rows = Array.from({ length: ROWS }, (_, row) => {
    const first = row * COLS + 1
    return Array.from({ length: COLS }, (_, col) => first + col)
  })

  function rowSegments(row: number): Segment[] {
    const firstBeat = row * COLS + 1
    const lastBeat = firstBeat + COLS - 1
    const segs: Segment[] = []

    for (const p of placed) {
      const def = getPattern(p.patternId)
      const pEnd = p.startBeat + def.beats - 1

      const overlapStart = Math.max(p.startBeat, firstBeat)
      const overlapEnd = Math.min(pEnd, lastBeat)
      if (overlapStart > overlapEnd) continue

      const startCol = overlapStart - firstBeat + 1
      const endCol = overlapEnd - firstBeat + 1

      segs.push({
        pid: p.id,
        patternId: p.patternId,
        name: def.name,
        totalBeats: def.beats,
        startCol,
        endCol,
        isStart: overlapStart === p.startBeat,
        isEnd: overlapEnd === pEnd,
      })
    }
    return segs
  }

  function gridCol(col: number): number {
    return col + 1
  }

  return (
    <div className="timeline">
      <h2>Phrase Timeline <span className="beats-label">128 beats · 4 phrases</span></h2>

      <div className="timeline-grid">
        {[0, 1, 2, 3].map((phraseIdx) => (
          <div key={phraseIdx} className="phrase-group">
            <span className="phrase-label">Phrase {phraseIdx + 1}</span>
            <div className="phrase-rows">
              {rows.slice(phraseIdx * 4, phraseIdx * 4 + 4).map((beats, row) => (
                  <div key={phraseIdx * 4 + row} className={`timeline-row ${phraseIdx % 2 === 0 ? "phrase-even" : "phrase-odd"}`}>
                    <div className="row-cells">
                      {beats.map((beat, col) => (
                        <button
                          key={beat}
                          className={`beat-cell ${col === 4 ? "bar-start" : ""}`}
                          disabled={occupied.has(beat)}
                          style={{
                            gridColumn: gridCol(col),
                            gridRow: "1",
                            pointerEvents: occupied.has(beat) ? "none" : "auto",
                          }}
                          onClick={() => onPlace(beat)}
                        >
                          <span className="beat-num">{beat}</span>
                        </button>
                      ))}

                      {rowSegments(phraseIdx * 4 + row).map((seg) => {
                        let cls = `pattern-overlay b${seg.totalBeats}`
                        if (!seg.isEnd) cls += " continues-r"
                        if (!seg.isStart) cls += " continues-l"
                        return (
                          <div
                            key={seg.pid}
                            className={cls}
                            style={{
                              gridColumn: `${gridCol(seg.startCol - 1)} / ${gridCol(seg.endCol - 1) + 1}`,
                              gridRow: "1",
                            }}
                            onClick={() => onRemove(seg.pid)}
                          >
                            <span className="overlay-name">{seg.name}</span>
                            {!seg.isEnd && <span className="cont-r">▸</span>}
                            {!seg.isStart && <span className="cont-l">◂</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {placed.length > 0 && (
        <div className="placed-list">
          <h3>Sequence</h3>
          <div className="placed-scroll">
            {placed.map((p, i) => {
              const def = getPattern(p.patternId)
              const endBeat = p.startBeat + def.beats - 1
              return (
                <div key={p.id} className="placed-row">
                  <span className="placed-idx">{i + 1}</span>
                  <span className={`placed-badge b${def.beats}`}>{def.beats}</span>
                  <span className="placed-name">{def.name}</span>
                  <span className="placed-beats">beats {p.startBeat}–{endBeat}</span>
                  <span className="placed-phrase">phrase {Math.ceil(p.startBeat / 32)}</span>
                  <button className="placed-remove" onClick={() => onRemove(p.id)}>×</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
