from __future__ import annotations

import array
import shutil
import subprocess
from pathlib import Path

import pytest

from nnoo_audio import media

needs_ffmpeg = pytest.mark.skipif(shutil.which("ffmpeg") is None, reason="ffmpeg not installed")


def test_peaks_have_fixed_length_and_range():
    samples = array.array("h", [0, 16384, -32768, 100] * 1000)
    p = media.peaks_from_samples(samples, 800)
    assert len(p) == 800
    assert all(0.0 <= v <= 1.0 for v in p)
    assert max(p) == 1.0


def test_peaks_of_empty_audio_are_zero():
    assert media.peaks_from_samples(array.array("h"), 10) == [0.0] * 10


def test_silence_is_detected():
    assert media.is_silent([0.0] * 800)
    assert media.is_silent([0.001] * 800)
    assert not media.is_silent([0.0] * 799 + [0.5])


def tone(path: Path, seconds: float = 2.0, fmt: list[str] | None = None):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=frequency=220:duration={seconds}", "-ar", "48000", "-ac", "1", *(fmt or []), str(path)], check=True)


@needs_ffmpeg
def test_wav_is_accepted_and_transcoded(tmp_path: Path):
    src = tmp_path / "in.wav"
    tone(src)
    info = media.probe(src)
    assert info.format_name == "wav" and 1900 <= info.duration_ms <= 2100
    master = tmp_path / "m.flac"
    media.make_master(src, master)
    assert media.probe(master).codec == "flac"
    opus, aac = tmp_path / "o.opus", tmp_path / "a.m4a"
    media.make_derivatives(master, opus, aac, -18, 32, 64)
    assert media.probe(opus).codec == "opus"
    assert media.probe(aac).codec == "aac"
    p = media.peaks(master)
    assert len(p) == 800 and not media.is_silent(p)


@needs_ffmpeg
def test_master_is_not_loudness_changed(tmp_path: Path):
    src = tmp_path / "in.wav"
    tone(src)
    master = tmp_path / "m.flac"
    media.make_master(src, master)
    assert abs(media.measure_lufs(src) - media.measure_lufs(master)) < 0.1


@needs_ffmpeg
def test_video_and_unknown_formats_are_rejected(tmp_path: Path):
    vid = tmp_path / "v.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=duration=1:size=64x64", "-f", "lavfi", "-i", "sine=duration=1", "-shortest", str(vid)], check=True)
    with pytest.raises(media.Rejected) as e:
        media.probe(vid)
    assert e.value.reason == "format_not_allowed"
    junk = tmp_path / "x.wav"
    junk.write_bytes(b"not audio at all" * 100)
    with pytest.raises(media.Rejected) as e:
        media.probe(junk)
    assert e.value.reason == "unreadable"


def test_sha256_file(tmp_path: Path):
    f = tmp_path / "f"
    f.write_bytes(b"abc")
    assert media.sha256_file(f) == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
