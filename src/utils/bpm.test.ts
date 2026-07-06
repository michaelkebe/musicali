import { describe, it, expect } from "vitest"
import { computeBpmFromTaps } from "./bpm"

describe("computeBpmFromTaps", () => {
  it("returns null for fewer than 4 taps", () => {
    expect(computeBpmFromTaps([], 1)).toBeNull()
    expect(computeBpmFromTaps([100], 1)).toBeNull()
    expect(computeBpmFromTaps([100, 200], 1)).toBeNull()
    expect(computeBpmFromTaps([100, 200, 300], 1)).toBeNull()
  })

  it("computes 120 BPM from 500ms intervals, multiplier=1", () => {
    expect(computeBpmFromTaps([0, 500, 1000, 1500], 1)).toBe(120)
  })

  it("computes 60 BPM from 1000ms intervals, multiplier=1", () => {
    expect(computeBpmFromTaps([0, 1000, 2000, 3000], 1)).toBe(60)
  })

  it("computes 120 BPM from 1000ms intervals, multiplier=2", () => {
    expect(computeBpmFromTaps([0, 1000, 2000, 3000], 2)).toBe(120)
  })

  it("computes 60 BPM from 500ms intervals, multiplier=0.5", () => {
    expect(computeBpmFromTaps([0, 500, 1000, 1500], 0.5)).toBe(60)
  })

  it("trims outlier with 5+ taps (trimmed mean)", () => {
    const taps = [0, 500, 1000, 1500, 100000]
    expect(computeBpmFromTaps(taps, 1)).toBe(120)
  })

  it("returns null when BPM is too high (>400)", () => {
    expect(computeBpmFromTaps([0, 10, 20, 30], 1)).toBeNull()
  })

  it("returns null when BPM is too low (<20)", () => {
    expect(computeBpmFromTaps([0, 10000, 20000, 30000], 1)).toBeNull()
  })

  it("handles floating-point intervals correctly", () => {
    const result = computeBpmFromTaps([0, 1000.5, 2001, 3001.5], 1)
    expect(result).toBeCloseTo(59.97, 1)
  })

  it("handles 4 tap timestamps with exact 4 diffs (no trimming)", () => {
    const result = computeBpmFromTaps([0, 500, 1000, 1500], 1)
    expect(result).toBe(120)
  })
})
