"""YOLOv8 object detection service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

import numpy as np
from ultralytics import YOLO

INTEREST_LABELS = {"person", "chair", "car", "bicycle"}


@dataclass
class Detection:
    label: str
    confidence: float
    bbox: list[int]


class DetectionService:
    """Runs YOLOv8n detection and filters to supported labels."""

    def __init__(self, model_name: str = "yolov8n.pt") -> None:
        self.model_name = model_name
        self._model: YOLO | None = None

    def _get_model(self) -> YOLO:
        if self._model is None:
            self._model = YOLO(self.model_name)
        return self._model

    def detect(self, frame: np.ndarray) -> List[Detection]:
        model = self._get_model()
        results = model.predict(frame, verbose=False)
        if not results:
            return []

        names = results[0].names
        boxes = results[0].boxes
        if boxes is None:
            return []

        detections: list[Detection] = []
        for box in boxes:
            cls_id = int(box.cls.item())
            label = names.get(cls_id, "")
            if label not in INTEREST_LABELS:
                continue

            mapped_label = "bike" if label == "bicycle" else label
            xyxy = box.xyxy[0].tolist()
            bbox = [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
            confidence = float(box.conf.item())
            detections.append(
                Detection(
                    label=mapped_label,
                    confidence=round(confidence, 3),
                    bbox=bbox,
                )
            )

        return detections
