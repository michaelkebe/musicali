import type { PatternDef } from "../types"

export const patterns8: PatternDef[] = [
  { id: "whip", name: "Whip", beats: 8, description: "Basic 8-count whip pattern" },
]

export const patterns6: PatternDef[] = [
  { id: "sugar-push", name: "Sugar Push", beats: 6, description: "Push break with anchor step" },
  { id: "lsp", name: "Left Side Pass", beats: 6, description: "Lead moves left, pass on the left side" },
  { id: "sugar-tuck", name: "Sugar Tuck", beats: 6, description: "Tuck and turn the follow" },
  { id: "underarm", name: "Underarm Turn", beats: 6, description: "Follow turns under the lead's arm" },
  { id: "sweetheart", name: "Sweetheart", beats: 6, description: "Both face same direction, walk forward" },
]

export const allPatterns: PatternDef[] = [...patterns8, ...patterns6]

export const soundMap: Record<string, string> = {
  "whip": "/sounds/whip.mp3",
  "sugar-push": "/sounds/sugar-push.mp3",
  "sugar-tuck": "/sounds/sugar-tuck.mp3",
  "sweetheart": "/sounds/sweetheart.mp3",
  "lsp": "/sounds/left-side-pass.mp3",
  "underarm": "/sounds/underarm-turn.mp3",
}
