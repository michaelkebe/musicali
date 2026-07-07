import type { PatternDef } from "../types"

export const patterns8: PatternDef[] = [
  { id: "basic-whip", name: "Basic Whip", beats: 8 },
  { id: "basic-whip-outside-turn", name: "Basic Whip w/ outside turn", beats: 8 },
  { id: "basic-whip-inside-turn", name: "Basic Whip w/ inside turn", beats: 8 },
  { id: "reverse-whip", name: "Reverse Whip", beats: 8 },
]

export const patterns6: PatternDef[] = [
  { id: "sugar-push", name: "Sugar Push", beats: 6 },
  { id: "left-side-pass", name: "Left Side Pass", beats: 6 },
  { id: "underarm-turn", name: "Underarm Turn", beats: 6 },
  { id: "sugar-tuck", name: "Sugar Tuck", beats: 6 },
  { id: "sugar-turn", name: "Sweetheart", beats: 6 },
  { id: "sweetheart", name: "Sweetheart", beats: 6 },
  { id: "roll-in-roll-out", name: "Roll In Roll Out", beats: 6 },
]

export const allPatterns: PatternDef[] = [...patterns8, ...patterns6]
