import type { PatternDef } from "../types"

export const patterns8: PatternDef[] = [
  { id: "whip", name: "Whip", beats: 8, description: "Basic 8-count whip pattern" },
  { id: "sugar-whip", name: "Sugar Whip", beats: 8, description: "Whip with an inside turn for the follow" },
  { id: "push-whip", name: "Push Whip", beats: 8, description: "Push break into a whip" },
  { id: "outside-whip", name: "Outside Whip", beats: 8, description: "Whip from outside partner position" },
]

export const patterns6: PatternDef[] = [
  { id: "lsp", name: "Left Side Pass", beats: 6, description: "Lead moves left, pass on the left side" },
  { id: "rsp", name: "Right Side Pass", beats: 6, description: "Lead moves right, pass on the right side" },
  { id: "tuck-turn", name: "Tuck Turn", beats: 6, description: "Tuck and turn the follow" },
  { id: "underarm", name: "Underarm Turn", beats: 6, description: "Follow turns under the lead's arm" },
  { id: "sweetheart", name: "Sweetheart", beats: 6, description: "Both face same direction, walk forward" },
  { id: "sugar-push", name: "Sugar Push", beats: 6, description: "Push break with anchor step" },
]

export const allPatterns: PatternDef[] = [...patterns8, ...patterns6]
