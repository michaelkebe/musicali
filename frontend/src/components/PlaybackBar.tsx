import { useState, useRef, useCallback, useEffect, type ReactNode } from "react"

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
  const rowBeat = ((currentBeat - 1) % 8) + 1
  return (
    <div className="playback-bar">
      <span className="btn-group">
        <BpmDetector onBpmChange={onBpmChange} />
        <BpmTapper onBpmChange={onBpmChange} />
        <span className="bpm-display">{bpm > 0 ? `${bpm.toFixed(3)} BPM` : "— BPM"}</span>
        <TrimmerButtons bpm={bpm} onBpmChange={onBpmChange} />
      </span>

      <span className="btn-group">
        <button className="ctrl-btn play" onMouseDown={onPlay} disabled={isPlaying || bpm <= 0}>
          ▶ Play
        </button>
        <button className="ctrl-btn stop" onMouseDown={onStop} disabled={!isPlaying}>
          ■ Stop
        </button>
        <NudgeButtons onNudge={onNudge} disabled={!isPlaying} />
      </span>

      <span className="btn-group">
        <span className="beat-display">
          <span className="beat-dir">{rowBeat % 2 === 1 ? "DOWN" : "UP"}</span>
          <span className="beat-num-lg">{rowBeat}</span>
        </span>
      </span>
    </div>
  )
}

function BpmTapper({ onBpmChange }: { onBpmChange: (bpm: number) => void }) {
  const [resetKey, setResetKey] = useState(0)

  const reset = useCallback(() => {
    setResetKey((k) => k + 1)
    onBpmChange(0)
  }, [onBpmChange])

  return (
    <span className="tap-group">
      <TapButton label={<>Each<br />Beat</>} multiplier={1} onBpmChange={onBpmChange} spaceKey resetKey={resetKey} />
      <TapButton label={<>Each<br />4 Beats</>} multiplier={4} onBpmChange={onBpmChange} resetKey={resetKey} />
      <TapButton label={<>Each<br />8 Beats</>} multiplier={8} onBpmChange={onBpmChange} resetKey={resetKey} />
      <button className="ctrl-btn tap-reset" onMouseDown={reset}>
        ↺
      </button>
    </span>
  )
}

function TapButton({ label, multiplier, onBpmChange, spaceKey, resetKey }: { label: ReactNode; multiplier: number; onBpmChange: (bpm: number) => void; spaceKey?: boolean; resetKey: number }) {
  const tapsRef = useRef<number[]>([])

  useEffect(() => {
    tapsRef.current = []
  }, [resetKey])

  const handleTap = useCallback(() => {
    const now = performance.now()
    const prev = tapsRef.current
    prev.push(now)
    if (prev.length > 30) prev.shift()

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

      const calculated = 60000 * multiplier / avg
      if (calculated > 20 && calculated < 400) {
        onBpmChange(Math.round(calculated * 1000) / 1000)
      }
    }
  }, [onBpmChange, multiplier])

  useEffect(() => {
    if (!spaceKey) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        handleTap()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleTap, spaceKey])

  return (
    <span>
      <button className="ctrl-btn tap" onMouseDown={handleTap}>
        {label}
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
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(1, 10)} disabled={disabled}>
        +10ms
      </button>
      <button className="ctrl-btn nudge" onMouseDown={() => onNudge(1, 100)} disabled={disabled}>
        +100ms
      </button>
    </span>
  )
}

function BpmDetector({ onBpmChange }: { onBpmChange: (bpm: number) => void }) {
  const [listening, setListening] = useState(false)
  const listeningRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onsetsRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const energiesRef = useRef<number[]>([])
  const lastOnsetRef = useRef(0)
  const thresholdRef = useRef(0)

  const MIN_GAP = 200
  const MAX_ONSETS = 8

  useEffect(() => {
    return () => {
      listeningRef.current = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  const toggle = useCallback(async () => {
    if (listeningRef.current) {
      listeningRef.current = false
      setListening(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
      audioCtxRef.current = null
      streamRef.current = null
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)

      audioCtxRef.current = ctx
      streamRef.current = stream
      listeningRef.current = true
      setListening(true)
      onsetsRef.current = []
      energiesRef.current = []
      lastOnsetRef.current = 0
      thresholdRef.current = 0

      const data = new Uint8Array(analyser.frequencyBinCount)
      const lowBin = Math.round(60 / (ctx.sampleRate / analyser.fftSize))
      const highBin = Math.round(250 / (ctx.sampleRate / analyser.fftSize))

      const detect = () => {
        if (!listeningRef.current) return
        analyser.getByteFrequencyData(data)

        let energy = 0
        for (let i = lowBin; i <= highBin; i++) energy += data[i]
        energy /= highBin - lowBin + 1

        const energies = energiesRef.current
        energies.push(energy)
        if (energies.length > 100) energies.shift()

        if (energies.length >= 10) {
          const avg = energies.reduce((a, b) => a + b, 0) / energies.length
          thresholdRef.current = avg * 1.4

          if (energy > thresholdRef.current) {
            const now = performance.now()
            if (now - lastOnsetRef.current >= MIN_GAP) {
              lastOnsetRef.current = now
              const onsets = onsetsRef.current
              onsets.push(now)
              if (onsets.length > MAX_ONSETS) onsets.shift()

              if (onsets.length >= 4) {
                const diffs: number[] = []
                for (let i = 1; i < onsets.length; i++) diffs.push(onsets[i] - onsets[i - 1])

                let avgDiff: number
                if (diffs.length >= 4) {
                  const sorted = [...diffs].sort((a, b) => a - b)
                  const trimmed = sorted.slice(1, -1)
                  avgDiff = trimmed.reduce((a, b) => a + b, 0) / trimmed.length
                } else {
                  avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
                }

                const calculated = 60000 / avgDiff
                if (calculated > 20 && calculated < 400) {
                  onBpmChange(Math.round(calculated * 1000) / 1000)
                }
              }
            }
          }
        }

        rafRef.current = requestAnimationFrame(detect)
      }

      rafRef.current = requestAnimationFrame(detect)
    } catch {
      // mic denied — silently ignore
    }
  }, [onBpmChange])

  return (
    <button className={`ctrl-btn listen${listening ? " listening" : ""}`} onMouseDown={toggle}>
      {listening ? "🔊" : "🎤"}
    </button>
  )
}
