import "@testing-library/jest-dom/vitest"

Object.defineProperty(globalThis, "speechSynthesis", {
  value: {
    cancel: () => {},
    speak: () => {},
    getVoices: () => [],
    paused: false,
    pending: false,
    speaking: false,
    onvoiceschanged: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  },
  writable: true,
})

Object.defineProperty(globalThis, "AudioContext", {
  value: class MockAudioContext {
    state = "running"
    createAnalyser() {
      return {
        fftSize: 256,
        frequencyBinCount: 128,
        connect: () => {},
        disconnect: () => {},
        getByteTimeDomainData: () => {},
      }
    }
    createMediaStreamSource() {
      return { connect: () => {} }
    }
    close() { return Promise.resolve() }
    resume() { return Promise.resolve() }
  },
  writable: true,
})

Object.defineProperty(globalThis, "navigator", {
  value: {
    userAgent: "vitest",
    language: "en-US",
    platform: "linux",
    mediaDevices: undefined,
  },
  writable: true,
})
