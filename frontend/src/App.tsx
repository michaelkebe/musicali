import { useState, useCallback, useRef, useEffect } from "react"
import type { PatternDef, PlacedPattern } from "./types"
import { allPatterns } from "./data/patterns"
import PatternPalette from "./components/PatternPalette"
import PhraseTimeline from "./components/PhraseTimeline"
import PlaybackBar from "./components/PlaybackBar"
import "./App.css"

const STORAGE_KEY = "musicali-placed"
const BPM_STORAGE_KEY = "musicali-bpm"

function loadPlaced(): PlacedPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function savePlaced(placed: PlacedPattern[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(placed))
  } catch {
    // quota exceeded — silently degrade
  }
}

function loadBpm(): number {
  try {
    const raw = localStorage.getItem(BPM_STORAGE_KEY)
    if (raw === null) return 0
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  } catch {
    return 0
  }
}

function saveBpm(bpm: number) {
  try {
    localStorage.setItem(BPM_STORAGE_KEY, JSON.stringify(bpm))
  } catch {
    // silently degrade
  }
}

function nextIdFromPlaced(placed: PlacedPattern[]): number {
  let max = 0
  for (const p of placed) {
    const m = p.id.match(/^p(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > max) max = n
    }
  }
  return max + 1
}

export default function App() {
  const [selected, setSelected] = useState<PatternDef | null>(null)
  const nextIdRef = useRef(0)
  const [placed, setPlaced] = useState<PlacedPattern[]>(() => {
    const loaded = loadPlaced()
    nextIdRef.current = nextIdFromPlaced(loaded)
    return loaded
  })
  const [bpm, setBpm] = useState(() => loadBpm())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(0)
  const rafRef = useRef<number | null>(null)
  const nextBeatTimeRef = useRef(0)
  const bpmRef = useRef(bpm)
  const isPlayingRef = useRef(isPlaying)
  const placedRef = useRef(placed)
  const currentBeatRef = useRef(currentBeat)
  const triggeredRef = useRef<Set<string>>(new Set())
  bpmRef.current = bpm
  isPlayingRef.current = isPlaying
  placedRef.current = placed
  currentBeatRef.current = currentBeat

  const handleSelect = useCallback((p: PatternDef) => {
    setSelected((prev) => (prev?.id === p.id ? null : p))
  }, [])

  const handlePlace = useCallback(
    (startBeat: number) => {
      if (!selected) return
      setPlaced((prev) => {
        const end = startBeat + selected.beats - 1
        const overlaps = prev.some((p) => {
          const def = allPatterns.find((d) => d.id === p.patternId)!
          return startBeat <= p.startBeat + def.beats - 1 && end >= p.startBeat
        })
        if (overlaps) return prev
        return [...prev, { id: `p${nextIdRef.current++}`, patternId: selected.id, startBeat }]
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
          return [...prev, { id: `p${nextIdRef.current++}`, patternId: pattern.id, startBeat: start }]
        }
      }
      return prev
    })
  }, [])

  const advanceBeat = useCallback(() => {
    if (!isPlayingRef.current) return

    setCurrentBeat((prev) => {
      const next = prev >= 128 ? 1 : prev + 1
      currentBeatRef.current = next
      if (prev >= 128) triggeredRef.current = new Set()
      return next
    })

    nextBeatTimeRef.current = performance.now() + 60000 / bpmRef.current

    const upcomingBeat = currentBeatRef.current + 3
    if (upcomingBeat <= 128) {
      for (const p of placedRef.current) {
        if (p.startBeat === upcomingBeat && !triggeredRef.current.has(p.id)) {
          triggeredRef.current.add(p.id)
          const def = allPatterns.find((d) => d.id === p.patternId)
          if (def) {
            speechSynthesis.cancel()
            const utter = new SpeechSynthesisUtterance(def.name)
            utter.lang = "en-US";
            speechSynthesis.speak(utter)
          }
        }
      }
    }
  }, [])

  const handlePlay = useCallback(() => {
    if (bpm <= 0) return
    triggeredRef.current = new Set()
    setIsPlaying(true)
    setCurrentBeat(1)
    nextBeatTimeRef.current = performance.now() + 60000 / bpm
  }, [bpm])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentBeat(0)
  }, [])

  // rAF polling loop — checks performance.now() against nextBeatTime each frame
  useEffect(() => {
    if (!isPlaying) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const loop = () => {
      if (!isPlayingRef.current) return
      if (performance.now() >= nextBeatTimeRef.current) {
        advanceBeat()
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [isPlaying, advanceBeat])

  // debounced save to localStorage
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => savePlaced(placed), 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [placed])

  // debounced save BPM to localStorage
  const bpmSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (bpmSaveTimerRef.current) clearTimeout(bpmSaveTimerRef.current)
    bpmSaveTimerRef.current = setTimeout(() => saveBpm(bpm), 500)
    return () => {
      if (bpmSaveTimerRef.current) clearTimeout(bpmSaveTimerRef.current)
    }
  }, [bpm])

  // stop playback when BPM is reset to 0
  useEffect(() => {
    if (bpm <= 0 && isPlaying) handleStop()
  }, [bpm, isPlaying, handleStop])

  const handleNudge = useCallback((direction: -1 | 1, stepMs: number) => {
    if (!isPlayingRef.current || bpmRef.current <= 0) return
    nextBeatTimeRef.current += direction * stepMs
    if (performance.now() >= nextBeatTimeRef.current) {
      advanceBeat()
    }
  }, [advanceBeat])

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
          <PlaybackBar
            bpm={bpm}
            isPlaying={isPlaying}
            currentBeat={currentBeat}
            onBpmChange={setBpm}
            onPlay={handlePlay}
            onStop={handleStop}
            onNudge={handleNudge}
          />

          <PhraseTimeline placed={placed} currentBeat={currentBeat} onPlace={handlePlace} onRemove={handleRemove} />

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
            <button className="clear-btn" onMouseDown={() => { setPlaced([]); setBpm(0); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(BPM_STORAGE_KEY) }}>
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
