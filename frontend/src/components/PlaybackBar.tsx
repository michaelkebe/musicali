import { useState, useRef, useCallback, useEffect, type ReactNode } from "react"
import { createRealtimeBpmAnalyzer } from "realtime-bpm-analyzer"
import type { BpmAnalyzer } from "realtime-bpm-analyzer"

interface Props {
  bpm: number
  isPlaying: boolean
  currentBeat: number
  announce: boolean
  onBpmChange: (bpm: number) => void
  onPlay: () => void
  onStop: () => void
  onNudge: (direction: -1 | 1, stepMs: number) => void
  onAnnounceToggle: () => void
}

export default function PlaybackBar({ bpm, isPlaying, currentBeat, announce, onBpmChange, onPlay, onStop, onNudge, onAnnounceToggle }: Props) {
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
        <button className={`ctrl-btn announce-btn${announce ? "" : " muted"}`} onMouseDown={onAnnounceToggle}>
          {announce ? "🔊" : "🔇"}
        </button>
      </span>

      <span className="btn-group">
        <span className="beat-display" key={currentBeat}>
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
      <TapButton label={<>Every<br />1</>} multiplier={1} onBpmChange={onBpmChange} spaceKey resetKey={resetKey} />
      <TapButton label={<>Every<br />2</>} multiplier={2} onBpmChange={onBpmChange} resetKey={resetKey} />
      <TapButton label={<>Every<br />4</>} multiplier={4} onBpmChange={onBpmChange} resetKey={resetKey} />
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
  const [error, setError] = useState("")
  const [level, setLevel] = useState(0)
  const [liveBpm, setLiveBpm] = useState(0)
  const listeningRef = useRef(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyzerRef = useRef<BpmAnalyzer | null>(null)
  const levelRafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
      analyzerRef.current?.disconnect()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  const startLevelMeter = useCallback((ctx: AudioContext, source: MediaStreamAudioSourceNode) => {
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)

    const poll = () => {
      if (!listeningRef.current) return
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128 - 1
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      setLevel(Math.min(1, rms * 3))
      levelRafRef.current = requestAnimationFrame(poll)
    }

    levelRafRef.current = requestAnimationFrame(poll)
  }, [])

  const stopListening = useCallback(() => {
    listeningRef.current = false
    setListening(false)
    setLevel(0)
    setLiveBpm(0)
    setError("")
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current)
    analyzerRef.current?.disconnect()
    analyzerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
  }, [])

  const toggle = useCallback(async () => {
    if (listeningRef.current) {
      stopListening()
      return
    }

    setError("")
    const ctx = new AudioContext()

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Mic access requires HTTPS or localhost")
      setTimeout(() => setError(""), 5000)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (ctx.state === "suspended") await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const analyzer = await createRealtimeBpmAnalyzer(ctx, { continuousAnalysis: true })
      source.connect(analyzer.node)

      analyzer.on("bpm", (data) => {
        const tempo = data.bpm[0].tempo
        if (tempo > 20 && tempo < 400) setLiveBpm(Math.round(tempo))
      })

      analyzer.on("bpmStable", (data) => {
        const tempo = data.bpm[0].tempo
        if (tempo > 20 && tempo < 400) {
          onBpmChange(Math.round(tempo * 1000) / 1000)
        }
      })

      startLevelMeter(ctx, source)

      analyzerRef.current = analyzer
      audioCtxRef.current = ctx
      streamRef.current = stream
      listeningRef.current = true
      setListening(true)
    } catch (e) {
      ctx.close()
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setTimeout(() => setError(""), 5000)
    }
  }, [onBpmChange, startLevelMeter, stopListening])

  return (
    <span className="listen-wrap">
      <button className={`ctrl-btn listen${listening ? " listening" : ""}${error ? " listen-error" : ""}`} onClick={toggle}>
        {listening ? "🔊" : error ? "✕" : "🎤"}
      </button>
      {listening && (
        <div className="listen-popup">
          <div className="listen-meter">
            <div className="listen-bar" style={{ width: `${level * 100}%` }} />
          </div>
          <span className="listen-live">{liveBpm > 0 ? `${liveBpm} BPM` : "..."}</span>
        </div>
      )}
      {error && (
        <div className="listen-popup listen-popup-error">
          <span className="listen-errmsg">{error}</span>
        </div>
      )}
    </span>
  )
}
