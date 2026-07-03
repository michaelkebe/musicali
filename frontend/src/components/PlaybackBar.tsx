import { useState, useRef, useCallback, useEffect } from "react"

interface Props {
  bpm: number
  isPlaying: boolean
  currentBeat: number
  onBpmChange: (bpm: number) => void
  onPlay: () => void
  onStop: () => void
  onNudge: (direction: -1 | 1, stepMs: number) => void
}

export default function PlaybackBar({ bpm, isPlaying, currentBeat, onBpmChange, onPlay, onStop, onNudge }: Props) {
  return (
    <div className="playback-bar">
      <BpmTapper onBpmChange={onBpmChange} />
      <span className="bpm-display">{bpm > 0 ? `${bpm.toFixed(3)} BPM` : "— BPM"}</span>

      <TrimmerButtons bpm={bpm} onBpmChange={onBpmChange} />

      <button className="ctrl-btn play" onMouseDown={onPlay} disabled={isPlaying || bpm <= 0}>
        ▶ Play
      </button>
      <button className="ctrl-btn stop" onMouseDown={onStop} disabled={!isPlaying}>
        ■ Stop
      </button>

      <NudgeButtons onNudge={onNudge} disabled={!isPlaying} />

      <span className="beat-display">
        Beat {currentBeat} / 128
      </span>
    </div>
  )
}

function BpmTapper({ onBpmChange }: { onBpmChange: (bpm: number) => void }) {
  const tapsRef = useRef<number[]>([])
  const [taps, setTaps] = useState(0)

  const handleTap = useCallback(() => {
    const now = performance.now()
    const prev = tapsRef.current
    prev.push(now)
    if (prev.length > 30) prev.shift()
    setTaps(prev.length)

    if (prev.length >= 4) {
      const diffs: number[] = []
      for (let i = 1; i < prev.length; i++) {
        diffs.push(prev[i] - prev[i - 1])
      }

      let avg: number
      if (diffs.length >= 4) {
        const sorted = [...diffs].sort((a, b) => a - b)
        const trimmed = sorted.slice(1, -1)
        avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
      } else {
        avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
      }

      const calculated = 60000 / avg
      if (calculated > 20 && calculated < 400) {
        onBpmChange(Math.round(calculated * 1000) / 1000)
      }
    }
  }, [onBpmChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleTap])

  const reset = useCallback(() => {
    tapsRef.current = []
    setTaps(0)
    onBpmChange(0)
  }, [onBpmChange])

  return (
    <span className="tap-group">
      <button className="ctrl-btn tap" onMouseDown={handleTap}>
        Tap
      </button>
      <button className="ctrl-btn tap-reset" onMouseDown={reset} disabled={taps === 0}>
        ↺
      </button>
    </span>
  )
}

function TrimmerButtons({ bpm, onBpmChange }: { bpm: number; onBpmChange: (bpm: number) => void }) {
  const disabled = bpm <= 0
  return (
    <span className="trimmer-group">
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.max(1, bpm - 0.1))} disabled={disabled}>
        −0.1
      </button>
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.max(1, bpm - 0.01))} disabled={disabled}>
        −0.01
      </button>
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.max(1, bpm - 0.001))} disabled={disabled}>
        −0.001
      </button>
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.min(400, bpm + 0.001))} disabled={disabled}>
        +0.001
      </button>
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.min(400, bpm + 0.01))} disabled={disabled}>
        +0.01
      </button>
      <button className="ctrl-btn trimmer" onMouseDown={() => onBpmChange(Math.min(400, bpm + 0.1))} disabled={disabled}>
        +0.1
      </button>
    </span>
  )
}

function NudgeButtons({ onNudge, disabled }: { onNudge: (d: -1 | 1, s: number) => void; disabled: boolean }) {
  return (
    <span className="nudge-group">
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(-1, 100)} disabled={disabled}>
        −100ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(-1, 10)} disabled={disabled}>
        −10ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(-1, 1)} disabled={disabled}>
        −1ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(1, 1)} disabled={disabled}>
        +1ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(1, 10)} disabled={disabled}>
        +10ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(1, 100)} disabled={disabled}>
        +100ms
      </button>
    </span>
  )
}
