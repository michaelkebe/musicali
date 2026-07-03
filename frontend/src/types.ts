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
