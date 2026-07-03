from __future__ import annotations

import os
import tempfile
from pathlib import Path

import yt_dlp


def download_audio(youtube_url: str) -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    tmp_path = Path(tmp.name).resolve()
    tmp.close()

    ydl_opts = {
        "format": "bestaudio/best",
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
        }],
        "outtmpl": str(tmp_path.with_suffix("")),
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(youtube_url, download=True)

    wav_path = tmp_path.with_suffix(".wav")
    if not wav_path.exists():
        raise RuntimeError(f"Expected WAV at {wav_path} but it was not created")

    info_path = tmp_path.with_suffix(".wav.info.json")
    if info_path.exists():
        info_path.unlink()

    return wav_path


def extract_info(youtube_url: str) -> dict:
    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True}) as ydl:
        return ydl.extract_info(youtube_url, download=False)
