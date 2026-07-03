import { useState, useRef, useCallback } from "react"

interface Props {
  bpm: number
  isPlaying: boolean
  currentBeat: number
  onBpmChange: (bpm: number) => void
  onPlay: () => void
  onStop: () => void
}

export default function PlaybackBar({ bpm, isPlaying, currentBeat, onBpmChange, onPlay, onStop }: Props) {
  return (
    <div className="playback-bar">
      <BpmTapper onBpmChange={onBpmChange} />
      <span className="bpm-display">{bpm > 0 ? `${Math.round(bpm)} BPM` : "— BPM"}</span>

      <button className="ctrl-btn play" onClick={onPlay} disabled={isPlaying || bpm <= 0}>
        ▶ Play
      </button>
      <button className="ctrl-btn stop" onClick={onStop} disabled={!isPlaying}>
        ■ Stop
      </button>

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
    if (prev.length > 10) prev.shift()
    setTaps(prev.length)

    if (prev.length >= 4) {
      const diffs: number[] = []
      for (let i = 1; i < prev.length; i++) {
        diffs.push(prev[i] - prev[i - 1])
      }
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length
      const calculated = 60000 / avg
      if (calculated > 20 && calculated < 400) {
        onBpmChange(Math.round(calculated))
      }
    }
  }, [onBpmChange])

  const reset = useCallback(() => {
    tapsRef.current = []
    setTaps(0)
    onBpmChange(0)
  }, [onBpmChange])

  return (
    <span className="tap-group">
      <button className="ctrl-btn tap" onClick={handleTap}>
        Tap
      </button>
      <button className="ctrl-btn tap-reset" onClick={reset} disabled={taps === 0}>
        ↺
      </button>
    </span>
  )
}
