export interface PatternDef {
  id: string
  name: string
  beats: 6 | 8
}

export interface PlacedPattern {
  id: string
  patternId: string
  startBeat: number
}

export interface TapEntry {
  time: number
  multiplier: number
}

export interface PllState {
  offsetMs: number
  intervalMs: number
  confidence: number
  taps: TapEntry[]
}
