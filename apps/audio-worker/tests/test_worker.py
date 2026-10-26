from __future__ import annotations

"""The worker loop against a fake jobs API: claim → process → report; rejections are reported."""
from pathlib import Path

from nnoo_audio import media, worker


class FakeApi:
    def __init__(self, job):
        self.job, self.reports = job, []

    def claim(self):
        j, self.job = self.job, None
        return j

    def report(self, job, body):
        self.reports.append(body)
        return {"accepted": True}


def test_empty_queue():
    assert worker.run_once(FakeApi(None)) is False


def test_rejection_is_reported(monkeypatch):
    def boom(job, workdir: Path):
        raise media.Rejected("hash_mismatch")

    monkeypatch.setattr(worker, "process", boom)
    api = FakeApi({"jobId": 1, "token": "t"})
    assert worker.run_once(api) is True
    assert api.reports == [{"status": "rejected", "reason": "hash_mismatch"}]


def test_transient_failure_is_not_reported(monkeypatch):
    def flaky(job, workdir: Path):
        raise OSError("network")

    monkeypatch.setattr(worker, "process", flaky)
    api = FakeApi({"jobId": 2, "token": "t"})
    assert worker.run_once(api) is True
    assert api.reports == []  # the claim expires and the job is retried (max 5 attempts)
