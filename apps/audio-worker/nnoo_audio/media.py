"""Pure audio steps around ffmpeg/ffprobe (05 §5). No network here."""
from __future__ import annotations

import array
import hashlib
import json
import math
import subprocess
from dataclasses import dataclass
from pathlib import Path

#: Container formats a field recording may arrive in (05 §5). Anything else is rejected.
ALLOWED_FORMATS = {"wav", "flac", "mov,mp4,m4a,3gp,3g2,mj2", "aac", "ogg"}
ALLOWED_CODECS = {"pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "flac", "aac", "opus", "vorbis"}
MAX_DURATION_MS = 4 * 3600 * 1000
SILENCE_PEAK = 0.002  # below this the "recording" captured nothing
PEAK_POINTS = 800


class Rejected(Exception):
    """A permanent problem with the file; reported as status=rejected with a reason."""

    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


@dataclass(frozen=True)
class Probe:
    format_name: str
    codec: str
    duration_ms: int
    channels: int


def probe(path: Path) -> Probe:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-print_format", "json", "-show_format", "-show_streams", str(path)],
        capture_output=True, check=False, timeout=120,
    )
    if out.returncode != 0:
        raise Rejected("unreadable")
    info = json.loads(out.stdout or b"{}")
    audio = [s for s in info.get("streams", []) if s.get("codec_type") == "audio"]
    video = [s for s in info.get("streams", []) if s.get("codec_type") == "video" and s.get("disposition", {}).get("attached_pic") != 1]
    if len(audio) != 1 or video:
        raise Rejected("format_not_allowed")  # no polyglots, no video, exactly one audio stream
    fmt = info.get("format", {}).get("format_name", "")
    codec = audio[0].get("codec_name", "")
    if fmt not in ALLOWED_FORMATS or codec not in ALLOWED_CODECS:
        raise Rejected("format_not_allowed")
    try:
        duration_ms = int(float(info["format"]["duration"]) * 1000)
    except (KeyError, ValueError):
        raise Rejected("unreadable")
    if duration_ms <= 0:
        raise Rejected("unreadable")
    if duration_ms > MAX_DURATION_MS:
        raise Rejected("too_long")
    return Probe(fmt, codec, duration_ms, int(audio[0].get("channels", 1)))


def _ffmpeg(*args: str) -> None:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-y", *args], capture_output=True, check=False, timeout=3600)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {r.stderr.decode(errors='replace')[-300:]}")


def make_master(src: Path, dst: Path) -> None:
    """Lossless FLAC of the original. Never loudness-changed: the master is kept untouched (Brief §31)."""
    _ffmpeg("-i", str(src), "-map", "0:a:0", "-c:a", "flac", "-compression_level", "8", str(dst))


def measure_lufs(src: Path) -> float:
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-i", str(src), "-af", "loudnorm=print_format=json", "-f", "null", "-"],
        capture_output=True, check=False, timeout=3600,
    )
    text = r.stderr.decode(errors="replace")
    start = text.rfind("{")
    try:
        return float(json.loads(text[start:])["input_i"])
    except (ValueError, KeyError):
        return float("nan")


def make_derivatives(master: Path, opus: Path, aac: Path, lufs: float, opus_kbps: int, aac_kbps: int) -> None:
    """Listening copies, mono, normalised to the target loudness (05 §4)."""
    norm = f"loudnorm=I={lufs}:TP=-1.5:LRA=11"
    _ffmpeg("-i", str(master), "-af", norm, "-ac", "1", "-ar", "48000", "-c:a", "libopus", "-b:a", f"{opus_kbps}k", "-f", "ogg", str(opus))
    _ffmpeg("-i", str(master), "-af", norm, "-ac", "1", "-ar", "48000", "-c:a", "aac", "-b:a", f"{aac_kbps}k", "-movflags", "+faststart", "-f", "mp4", str(aac))


def peaks_from_samples(samples: "array.array[int]", points: int = PEAK_POINTS) -> list[float]:
    """Max absolute amplitude per bucket, 0..1, exactly `points` values (renders a waveform without audio)."""
    n = len(samples)
    if n == 0:
        return [0.0] * points
    out: list[float] = []
    for i in range(points):
        lo = (i * n) // points
        hi = max(lo + 1, ((i + 1) * n) // points)
        chunk = samples[lo:hi]
        out.append(round(max((abs(v) for v in chunk), default=0) / 32768.0, 4))
    return out


def peaks(src: Path, points: int = PEAK_POINTS) -> list[float]:
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-i", str(src), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
        capture_output=True, check=False, timeout=3600,
    )
    if r.returncode != 0:
        raise Rejected("unreadable")
    samples = array.array("h")
    samples.frombytes(r.stdout[: len(r.stdout) - len(r.stdout) % 2])
    return peaks_from_samples(samples, points)


def is_silent(p: list[float]) -> bool:
    return not p or max(p) < SILENCE_PEAK or all(math.isclose(v, 0.0) for v in p)
