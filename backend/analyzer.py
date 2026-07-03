from __future__ import annotations

from pathlib import Path

import librosa
import numpy as np


def analyze(y: np.ndarray, sr: int) -> dict:
    duration = float(librosa.get_duration(y=y, sr=sr))

    # --- BPM & beat tracking ---
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr).tolist()

    # --- Phrasing (32-beat phrases = 4 eight-counts) ---
    # In WCS, core phrasing is 8-count blocks, musical phrasing is 32 beats
    eight_count_times = beat_times[::4]  # every 4th beat = 8-count start
    phrase_times = beat_times[::16]      # every 16th beat = 32-beat phrase

    phrases = [
        {"start": float(phrase_times[i]), "end": float(phrase_times[i + 1]) if i + 1 < len(phrase_times) else duration, "index": i}
        for i in range(len(phrase_times))
    ]

    # --- Onset / accent detection ---
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr).tolist()
    onset_strengths = onset_env[onset_frames].tolist() if len(onset_frames) else []

    # Normalize strength 0-1
    if onset_strengths:
        s = np.array(onset_strengths)
        s = (s - s.min()) / (s.max() - s.min() + 1e-10)
        onset_strengths = s.tolist()

    accents = [
        {"time": t, "strength": float(s)}
        for t, s in zip(onset_times, onset_strengths)
    ]

    # --- Energy envelope ---
    rms = librosa.feature.rms(y=y)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr).tolist()
    rms_values = rms.tolist()
    energy = [{"time": t, "value": float(v)} for t, v in zip(rms_times, rms_values)]

    # --- Section boundaries ---
    # Use spectral novelty + recurrence to propose rough sections
    # For MVP, just mark sections every 4 phrases
    sections = []
    for i in range(0, len(phrase_times), 4):
        start = phrase_times[i]
        end = phrase_times[i + 4] if i + 4 < len(phrase_times) else duration
        sections.append({
            "start": float(start),
            "end": float(end),
            "label": f"Section {len(sections) + 1}",
        })

    return {
        "bpm": round(float(tempo), 1),
        "duration": duration,
        "beats": beat_times,
        "eight_counts": eight_count_times,
        "phrases": phrases,
        "accents": accents,
        "energy": energy,
        "sections": sections,
    }
