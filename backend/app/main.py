"""FastAPI entrypoint for SafePath AI backend."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.services.decision import DecisionService
from app.services.detection import DetectionService
from app.services.voice import VoiceService
from app.services.zoning import ZoningService

app = FastAPI(
    title="SafePath AI",
    description="Real-time assistive navigation API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detection_service = DetectionService()
zoning_service = ZoningService()
decision_service = DecisionService()
voice_service = VoiceService(cooldown_seconds=2.0)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...), speak: bool = False) -> dict[str, Any]:
    image_bytes = await file.read()
    if not image_bytes:
        return {
            "action": "stop",
            "reason": "Empty frame received",
            "confidence": 0.0,
            "danger": False,
            "detections": [],
        }

    np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        return {
            "action": "stop",
            "reason": "Invalid image frame",
            "confidence": 0.0,
            "danger": False,
            "detections": [],
        }

    detections = detection_service.detect(frame)
    zoned = zoning_service.assign(detections, frame.shape[1])
    decision = decision_service.decide(zoned)

    if speak:
        voice_service.speak(decision.action.replace("_", " "))

    return {
        "action": decision.action,
        "reason": decision.reason,
        "confidence": decision.confidence,
        "danger": decision.danger,
        "detections": [
            {
                "label": det.label,
                "confidence": det.confidence,
                "zone": det.zone,
                "bbox": det.bbox,
            }
            for det in zoned
        ],
    }
