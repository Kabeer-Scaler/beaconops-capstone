FROM python:3.12.15-alpine3.24 AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /build
COPY requirements.txt .
RUN python -m venv /opt/venv && /opt/venv/bin/pip install --upgrade pip && /opt/venv/bin/pip install -r requirements.txt

FROM python:3.12.15-alpine3.24 AS runtime

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000
WORKDIR /app
RUN addgroup -g 10001 -S beaconops && adduser -u 10001 -S -G beaconops -h /home/beaconops beaconops
COPY --from=builder /opt/venv /opt/venv
COPY --chown=beaconops:beaconops alembic.ini ./
COPY --chown=beaconops:beaconops alembic ./alembic
COPY --chown=beaconops:beaconops app ./app
COPY --chown=beaconops:beaconops docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 0555 ./docker-entrypoint.sh
USER 10001:10001
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]
ENTRYPOINT ["./docker-entrypoint.sh"]
