from __future__ import annotations

import os
import tempfile
from pathlib import Path

import librosa
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analyzer import analyze
from downloader import download_audio, extract_info

app = FastAPI(title="Musicali")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    youtube_url: str


class AnalyzeResponse(BaseModel):
    title: str
    bpm: float
    duration: float
    beats: list[float]
    eight_counts: list[float]
    phrases: list[dict]
    accents: list[dict]
    energy: list[dict]
    sections: list[dict]


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_endpoint(req: AnalyzeRequest):
    try:
        info = extract_info(req.youtube_url)
        title = info.get("title", "Unknown")

        wav_path = download_audio(req.youtube_url)

        y, sr = librosa.load(str(wav_path), sr=None, mono=True)

        os.unlink(str(wav_path))

        result = analyze(y, sr)
        result["title"] = title

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok"}
