# Audio worker (ADR-021). Holds no database or storage credentials: only NNOO_JOBS_URL and
# AUDIO_WORKER_KEY. Everything else arrives as short-lived presigned URLs per job.
FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 10001 worker
WORKDIR /app
COPY pyproject.toml ./
COPY nnoo_audio ./nnoo_audio
COPY tests ./tests
RUN pip install --no-cache-dir pytest==8.4.2
USER worker
ENV PYTHONUNBUFFERED=1
CMD ["python", "-m", "nnoo_audio.worker"]
