"""Claim → download → verify → process → upload → report (ADR-021, 05 §5)."""
from __future__ import annotations

import json
import logging
import os
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

from . import media

ALGO_VERSION = "audio@1"
log = logging.getLogger("nnoo.audio")


def _request(method: str, url: str, *, data: bytes | None = None, headers: dict[str, str] | None = None, timeout: int = 120):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    return urllib.request.urlopen(req, timeout=timeout)  # noqa: S310 (URLs come from our own API)


class Api:
    def __init__(self, base_url: str, worker_key: str):
        self.base = base_url.rstrip("/")
        self.key = worker_key

    def claim(self) -> dict | None:
        with _request("POST", f"{self.base}/internal/audio/claim", headers={"authorization": f"Bearer {self.key}"}) as r:
            return json.load(r).get("job")

    def report(self, job: dict, body: dict) -> dict:
        data = json.dumps(body).encode()
        headers = {"authorization": f"Bearer {job['token']}", "content-type": "application/json"}
        with _request("POST", f"{self.base}/internal/audio/{job['jobId']}/result", data=data, headers=headers) as r:
            return json.load(r)


def download(url: str, dst: Path) -> None:
    with _request("GET", url, timeout=3600) as r, dst.open("wb") as f:
        while chunk := r.read(1024 * 1024):
            f.write(chunk)


def upload(url: str, path: Path, content_type: str) -> None:
    with path.open("rb") as f:
        _request("PUT", url, data=f.read(), headers={"content-type": content_type}, timeout=3600).close()


def process(job: dict, workdir: Path) -> dict:
    """Runs every step; returns the result body. Raises media.Rejected for a bad file."""
    params = job["params"]
    raw = workdir / "raw"
    download(job["input"]["getUrl"], raw)
    sha = media.sha256_file(raw)
    if sha != job["input"]["sha256"]:
        raise media.Rejected("hash_mismatch")  # "The recording didn't arrive whole." (05 §3)
    info = media.probe(raw)

    master, opus, aac, peaks_json = workdir / "master.flac", workdir / "out.opus", workdir / "out.m4a", workdir / "peaks.json"
    media.make_master(raw, master)
    pk = media.peaks(master, params.get("peaks", media.PEAK_POINTS))
    if media.is_silent(pk):
        raise media.Rejected("silent")
    lufs = media.measure_lufs(master)
    media.make_derivatives(master, opus, aac, params["loudnessLufs"], params["opusKbps"], params["aacKbps"])
    peaks_json.write_text(json.dumps(pk, separators=(",", ":")))

    files = {"master": (master, "audio/flac"), "opus": (opus, "audio/ogg"), "aac": (aac, "audio/mp4"), "peaks": (peaks_json, "application/json")}
    outputs = {}
    for name, (path, ctype) in files.items():
        upload(job["output"][name], path, ctype)
        outputs[name] = {"sha256": media.sha256_file(path), "bytes": path.stat().st_size}
    return {
        "status": "ok",
        "sha256": sha,
        "durationMs": info.duration_ms,
        "format": info.format_name.split(",")[0],
        "lufs": round(lufs, 1) if lufs == lufs else -70.0,  # NaN → floor
        "algoVersion": ALGO_VERSION,
        "outputs": outputs,
    }


def run_once(api: Api) -> bool:
    """Processes at most one job. Returns False when the queue is empty."""
    job = api.claim()
    if not job:
        return False
    with tempfile.TemporaryDirectory(prefix="nnoo-") as d:
        try:
            body = process(job, Path(d))
        except media.Rejected as e:
            body = {"status": "rejected", "reason": e.reason}
        except Exception:  # transient: do not report; the claim expires and the job is retried
            log.exception("job %s failed transiently", job["jobId"])
            return True
    api.report(job, body)
    log.info("job %s → %s", job["jobId"], body["status"])  # ids only: never URLs or tokens
    return True


def main() -> None:
    logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","msg":"%(message)s"}')
    api = Api(os.environ["NNOO_JOBS_URL"], os.environ["AUDIO_WORKER_KEY"])
    idle = float(os.environ.get("IDLE_SECONDS", "30"))
    while True:
        try:
            if not run_once(api):
                time.sleep(idle)
        except urllib.error.URLError as e:
            log.warning("api unreachable: %s", getattr(e, "reason", e))
            time.sleep(idle)


if __name__ == "__main__":
    main()
