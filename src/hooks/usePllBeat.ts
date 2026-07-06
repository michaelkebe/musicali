import { useState, useCallback, useRef } from "react"
import type { PllState } from "../types"

export type PllPhase = "idle" | "regression" | "tracking"

export const PLL_CONFIG = {
  MIN_TAPS_FOR_REGRESSION: 8,
  REGRESSION_TAP_LIMIT: 16,
  MAX_TAPS: 32,
  CONFIDENCE_THRESHOLD: 0.5,
  REGRESSION_CONFIDENCE: 0.6,
  MIN_BPM: 20,
  MAX_BPM: 400,
  TRACKING_OFFSET_LERP: 0.6,
  TRACKING_INTERVAL_LERP: 0.001,
  TRACKING_CONFIDENCE_INCREMENT: 0.05,
  MIN_INTERVAL_MS: 50,
  FORCE_INTERVAL_CONFIDENCE: 0.5,
} as const

export function fitLine(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i]
    sumX += x
    sumY += y
    sumXY += x * y
    sumXX += x * x
  }
  const meanX = sumX / n
  const meanY = sumY / n
  const slope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX)
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

export function pllReducer(prev: PllState, tapTime: number, multiplier: number): PllState {
  const taps = [...prev.taps, { time: tapTime, multiplier }]
  if (taps.length > PLL_CONFIG.MAX_TAPS) taps.shift()
  const n = taps.length

  if (n >= PLL_CONFIG.MIN_TAPS_FOR_REGRESSION && prev.confidence < PLL_CONFIG.CONFIDENCE_THRESHOLD) {
    let cumulative = 0
    const beats = [0]
    const times = [taps[0].time]
    for (let i = 1; i < n; i++) {
      cumulative += taps[i - 1].multiplier
      beats.push(cumulative)
      times.push(taps[i].time)
    }
    const { slope, intercept } = fitLine(beats, times)
    const bpm = slope > 0 ? 60000 / slope : 0
    if (slope > 0 && bpm > PLL_CONFIG.MIN_BPM && bpm < PLL_CONFIG.MAX_BPM) {
      return { offsetMs: intercept, intervalMs: slope, confidence: PLL_CONFIG.REGRESSION_CONFIDENCE, taps }
    }
    return { ...prev, taps }
  }

  if (prev.intervalMs > 0) {
    const rawBeat = (tapTime - prev.offsetMs) / prev.intervalMs
    const predictedBeat = Math.round(rawBeat / multiplier) * multiplier
    const predictedTime = prev.offsetMs + predictedBeat * prev.intervalMs
    const error = tapTime - predictedTime
    return {
      ...prev,
      offsetMs: prev.offsetMs + error * PLL_CONFIG.TRACKING_OFFSET_LERP,
      intervalMs: Math.max(PLL_CONFIG.MIN_INTERVAL_MS, prev.intervalMs + error * PLL_CONFIG.TRACKING_INTERVAL_LERP),
      confidence: Math.min(1, prev.confidence + PLL_CONFIG.TRACKING_CONFIDENCE_INCREMENT),
      taps,
    }
  }

  return { ...prev, taps }
}

export function usePllBeat() {
  const [state, setState] = useState<PllState>({ offsetMs: 0, intervalMs: 0, confidence: 0, taps: [] })
  const stateRef = useRef(state)
  stateRef.current = state

  const onTap = useCallback((tapTime: number, multiplier: number) => {
    setState((prev) => pllReducer(prev, tapTime, multiplier))
  }, [])

  const getBeatAtTime = useCallback((t: number): number => {
    const s = stateRef.current
    if (s.intervalMs <= 0) return 0
    return (t - s.offsetMs) / s.intervalMs
  }, [])

  const getTimeForBeat = useCallback((b: number): number => {
    const s = stateRef.current
    return s.offsetMs + b * s.intervalMs
  }, [])

  const reset = useCallback(() => {
    setState({ offsetMs: 0, intervalMs: 0, confidence: 0, taps: [] })
  }, [])

  const forceInterval = useCallback((ms: number) => {
    setState((prev) => ({ ...prev, intervalMs: ms, confidence: PLL_CONFIG.FORCE_INTERVAL_CONFIDENCE }))
  }, [])

  const nudgeOffset = useCallback((delta: number) => {
    setState((prev) => ({ ...prev, offsetMs: prev.offsetMs + delta }))
  }, [])

  const n = state.taps.length
  const phase: PllPhase = n < PLL_CONFIG.MIN_TAPS_FOR_REGRESSION ? "idle"
    : n <= PLL_CONFIG.REGRESSION_TAP_LIMIT ? "regression"
    : state.intervalMs > 0 ? "tracking"
    : "idle"

  const bpm = state.intervalMs > 0 ? 60000 / state.intervalMs : 0

  return { state, phase, onTap, getBeatAtTime, getTimeForBeat, reset, forceInterval, nudgeOffset, bpm }
}
