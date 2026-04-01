"""Decision engine service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from app.services.zoning import ZonedDetection

VEHICLE_LABELS = {"car", "bike"}


@dataclass
class DecisionResult:
    action: str
    reason: str
    confidence: float
    danger: bool


class DecisionService:
    """Computes safest movement command from zoned detections."""

    def decide(self, detections: Iterable[ZonedDetection]) -> DecisionResult:
        by_zone = {"left": [], "center": [], "right": []}
        for det in detections:
            by_zone[det.zone].append(det)

        center_objects = by_zone["center"]
        center_vehicle = any(det.label in VEHICLE_LABELS for det in center_objects)
        if center_vehicle:
            return DecisionResult(
                action="stop",
                reason="Danger: vehicle detected in center",
                confidence=0.95,
                danger=True,
            )

        if not center_objects:
            return DecisionResult(
                action="move_forward",
                reason="Center path is clear",
                confidence=0.9,
                danger=False,
            )

        left_count = len(by_zone["left"])
        right_count = len(by_zone["right"])
        if left_count < right_count:
            return DecisionResult(
                action="move_left",
                reason="Center blocked, left side has fewer obstacles",
                confidence=0.82,
                danger=False,
            )
        if right_count < left_count:
            return DecisionResult(
                action="move_right",
                reason="Center blocked, right side has fewer obstacles",
                confidence=0.82,
                danger=False,
            )

        return DecisionResult(
            action="move_left",
            reason="Center blocked, both sides similar; defaulting left",
            confidence=0.75,
            danger=False,
        )
