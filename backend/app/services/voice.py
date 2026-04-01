"""Voice output service with cooldown protection."""

from __future__ import annotations

import threading
import time

import pyttsx3


class VoiceService:
    """Speaks short commands with a fixed cooldown window."""

    def __init__(self, cooldown_seconds: float = 2.0) -> None:
        self.cooldown_seconds = cooldown_seconds
        self._engine = pyttsx3.init()
        self._lock = threading.Lock()
        self._last_spoken_at = 0.0

    def speak(self, text: str) -> bool:
        now = time.time()
        with self._lock:
            if now - self._last_spoken_at < self.cooldown_seconds:
                return False
            self._engine.say(text)
            self._engine.runAndWait()
            self._last_spoken_at = now
            return True
