import type { PatternDef } from "../types"

export const patterns8: PatternDef[] = [
  { id: "basic-whip", name: "Basic Whip", beats: 8 },
]

export const patterns6: PatternDef[] = [
  { id: "sugar-push", name: "Sugar Push", beats: 6 },
  { id: "left-side-pass", name: "Left Side Pass", beats: 6 },
  { id: "sugar-tuck", name: "Sugar Tuck", beats: 6 },
  { id: "underarm", name: "Underarm Turn", beats: 6 },
  { id: "sweetheart", name: "Sweetheart", beats: 6 },
]

export const allPatterns: PatternDef[] = [...patterns8, ...patterns6]
