"""Spatial zoning service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

from app.services.detection import Detection


@dataclass
class ZonedDetection:
    label: str
    confidence: float
    bbox: list[int]
    zone: str


class ZoningService:
    """Assigns detections into left / center / right zones."""

    def assign(self, detections: Iterable[Detection], frame_width: int) -> List[ZonedDetection]:
        if frame_width <= 0:
            return []

        left_edge = frame_width / 3
        right_edge = (2 * frame_width) / 3

        zoned: list[ZonedDetection] = []
        for det in detections:
            center_x = (det.bbox[0] + det.bbox[2]) / 2
            if center_x < left_edge:
                zone = "left"
            elif center_x < right_edge:
                zone = "center"
            else:
                zone = "right"

            zoned.append(
                ZonedDetection(
                    label=det.label,
                    confidence=det.confidence,
                    bbox=det.bbox,
                    zone=zone,
                )
            )

        return zoned
