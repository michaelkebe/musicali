import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import PlaybackBar from "./PlaybackBar"

const defaultProps = {
  bpm: 0,
  isPlaying: false,
  currentBeat: 0,
  announce: false,
  usePll: false,
  onBpmChange: vi.fn(),
  onPlay: vi.fn(),
  onStop: vi.fn(),
  onNudge: vi.fn(),
  onAnnounceToggle: vi.fn(),
  onPllToggle: vi.fn(),
  onTap: undefined,
  onPllReset: undefined,
  pllPhase: undefined as "idle" | "regression" | "tracking" | undefined,
  pllConfidence: undefined,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  cleanup()
})

describe("PlaybackBar", () => {
  it("renders BPM display with value", () => {
    render(<PlaybackBar {...defaultProps} bpm={120} />)
    expect(screen.getByText(/120\.000 BPM/)).toBeInTheDocument()
  })

  it("renders placeholder when BPM is 0", () => {
    render(<PlaybackBar {...defaultProps} bpm={0} />)
    expect(screen.getByText("— BPM")).toBeInTheDocument()
  })

  it("renders play button, disabled when BPM is 0", () => {
    render(<PlaybackBar {...defaultProps} bpm={0} />)
    const playBtn = screen.getByTitle("Start playback")
    expect(playBtn).toBeDisabled()
  })

  it("renders play button, enabled when BPM > 0", () => {
    render(<PlaybackBar {...defaultProps} bpm={60} />)
    const playBtn = screen.getByTitle("Start playback")
    expect(playBtn).not.toBeDisabled()
  })

  it("calls onPlay when play clicked", () => {
    const onPlay = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={60} onPlay={onPlay} />)
    fireEvent.pointerDown(screen.getByTitle("Start playback"))
    expect(onPlay).toHaveBeenCalledOnce()
  })

  it("calls onStop when stop clicked", () => {
    const onStop = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={60} isPlaying={true} onStop={onStop} />)
    fireEvent.pointerDown(screen.getByTitle("Stop playback"))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it("shows AVG mode toggle by default", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.getByTitle("Switch to PLL mode")).toHaveTextContent("AVG")
  })

  it("shows PLL mode toggle when usePll is true", () => {
    render(<PlaybackBar {...defaultProps} usePll={true} />)
    expect(screen.getByTitle("Switch to averaged mode")).toHaveTextContent("PLL")
  })

  it("calls onPllToggle when mode toggle clicked", () => {
    const onPllToggle = vi.fn()
    render(<PlaybackBar {...defaultProps} onPllToggle={onPllToggle} />)
    fireEvent.pointerDown(screen.getByTitle("Switch to PLL mode"))
    expect(onPllToggle).toHaveBeenCalledOnce()
  })

  it("renders trimmer buttons in AVG mode", () => {
    render(<PlaybackBar {...defaultProps} bpm={120} />)
    expect(screen.getByTitle("Trim BPM −0.1")).toBeInTheDocument()
    expect(screen.getByTitle("Trim BPM +0.1")).toBeInTheDocument()
  })

  it("does not render trimmer buttons in PLL mode", () => {
    render(<PlaybackBar {...defaultProps} usePll={true} />)
    expect(screen.queryByTitle("Trim BPM −0.1")).not.toBeInTheDocument()
  })

  it("trimmer buttons are disabled when BPM is 0", () => {
    render(<PlaybackBar {...defaultProps} bpm={0} />)
    expect(screen.getByTitle("Trim BPM −0.1")).toBeDisabled()
  })

  it("trimmer adjusts BPM via onBpmChange", () => {
    const onBpmChange = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={120} onBpmChange={onBpmChange} />)
    fireEvent.pointerDown(screen.getByTitle("Trim BPM +0.1"))
    expect(onBpmChange).toHaveBeenCalledWith(120.1)
  })

  it("renders nudge buttons, disabled when not playing", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.getByTitle("Nudge playback earlier by 100ms")).toBeDisabled()
    expect(screen.getByTitle("Nudge playback later by 100ms")).toBeDisabled()
  })

  it("nudge buttons enabled during playback", () => {
    render(<PlaybackBar {...defaultProps} isPlaying={true} bpm={60} />)
    expect(screen.getByTitle("Nudge playback earlier by 100ms")).not.toBeDisabled()
  })

  it("calls onNudge with correct direction and step", () => {
    const onNudge = vi.fn()
    render(<PlaybackBar {...defaultProps} isPlaying={true} bpm={60} onNudge={onNudge} />)
    fireEvent.pointerDown(screen.getByTitle("Nudge playback later by 10ms"))
    expect(onNudge).toHaveBeenCalledWith(1, 10)
  })

  it("renders PLL indicator in regression phase", () => {
    render(<PlaybackBar {...defaultProps} usePll={true} pllPhase="regression" pllConfidence={0.6} />)
    expect(screen.getByText("FIT")).toBeInTheDocument()
  })

  it("renders PLL indicator in tracking phase", () => {
    render(<PlaybackBar {...defaultProps} usePll={true} pllPhase="tracking" pllConfidence={0.8} />)
    expect(screen.getByText("LCK")).toBeInTheDocument()
  })

  it("renders PLL indicator idle phase", () => {
    render(<PlaybackBar {...defaultProps} usePll={true} pllPhase="idle" />)
    expect(screen.getByText("···")).toBeInTheDocument()
  })

  it("does not render PLL indicator in AVG mode", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.queryByText("FIT")).not.toBeInTheDocument()
    expect(screen.queryByText("LCK")).not.toBeInTheDocument()
    expect(screen.queryByText("···")).not.toBeInTheDocument()
  })

  it("shows beat direction and number", () => {
    render(<PlaybackBar {...defaultProps} currentBeat={5} />)
    expect(screen.getByText("DOWN")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("shows UP for even beats", () => {
    render(<PlaybackBar {...defaultProps} currentBeat={2} />)
    expect(screen.getByText("UP")).toBeInTheDocument()
  })

  it("calls onAnnounceToggle", () => {
    const onAnnounceToggle = vi.fn()
    render(<PlaybackBar {...defaultProps} onAnnounceToggle={onAnnounceToggle} />)
    fireEvent.pointerDown(screen.getByTitle("Toggle pattern announcements"))
    expect(onAnnounceToggle).toHaveBeenCalledOnce()
  })

  it("renders tap buttons", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.getByTitle("Tap every 1 beat")).toBeInTheDocument()
    expect(screen.getByTitle("Tap every 2 beats")).toBeInTheDocument()
    expect(screen.getByTitle("Tap every 4 beats")).toBeInTheDocument()
  })

  it("renders reset button", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.getByTitle("Reset tap counter")).toBeInTheDocument()
  })
})

describe("TapButton legacy mode", () => {
  it("calls onBpmChange after 4 taps with correct BPM", () => {
    let time = 1000
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onBpmChange = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={0} onBpmChange={onBpmChange} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onBpmChange).toHaveBeenCalledTimes(1)
    expect(onBpmChange).toHaveBeenCalledWith(60)
  })

  it("does not call onBpmChange until 4 taps", () => {
    let time = 1000
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onBpmChange = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={0} onBpmChange={onBpmChange} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onBpmChange).not.toHaveBeenCalled()
  })

  it("calls onBpmChange with correct multiplier", () => {
    let time = 1000
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 500
      return time
    })

    const onBpmChange = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={0} onBpmChange={onBpmChange} />)
    const btn = screen.getByTitle("Tap every 2 beats")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onBpmChange).toHaveBeenCalledWith(240)
  })

  it("reset clears tap history", () => {
    let time = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onBpmChange = vi.fn()
    render(<PlaybackBar {...defaultProps} bpm={0} onBpmChange={onBpmChange} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(screen.getByTitle("Reset tap counter"))

    time = 4000
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onBpmChange).toHaveBeenCalledWith(60)
  })
})

describe("TapButton PLL mode", () => {
  it("calls onTap with multiplier and timestamp", () => {
    let time = 1000
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onTap = vi.fn()
    render(<PlaybackBar {...defaultProps} usePll={true} onTap={onTap} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    expect(onTap).toHaveBeenCalledWith(expect.any(Number), 1)
  })

  it("calls onTap every click", () => {
    let time = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onTap = vi.fn()
    render(<PlaybackBar {...defaultProps} usePll={true} onTap={onTap} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onTap).toHaveBeenCalledTimes(4)
  })

  it("does not call onBpmChange in PLL mode", () => {
    let time = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      time += 1000
      return time
    })

    const onBpmChange = vi.fn()
    const onTap = vi.fn()
    render(<PlaybackBar {...defaultProps} usePll={true} onBpmChange={onBpmChange} onTap={onTap} />)
    const btn = screen.getByTitle("Tap every 1 beat")

    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)
    fireEvent.pointerDown(btn)

    expect(onBpmChange).not.toHaveBeenCalled()
    expect(onTap).toHaveBeenCalledTimes(4)
  })

  it("PLL reset button calls onPllReset", () => {
    const onPllReset = vi.fn()
    render(<PlaybackBar {...defaultProps} usePll={true} onPllReset={onPllReset} />)
    fireEvent.pointerDown(screen.getByTitle("Reset tap counter"))
    expect(onPllReset).toHaveBeenCalledOnce()
  })
})

describe("BpmDetector", () => {
  it("renders mic button", () => {
    render(<PlaybackBar {...defaultProps} />)
    expect(screen.getByTitle("Detect BPM from microphone")).toBeInTheDocument()
  })
})
