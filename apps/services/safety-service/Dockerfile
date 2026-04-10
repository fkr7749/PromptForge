FROM python:3.12-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  && rm -rf /var/lib/apt/lists/*

COPY apps/services/safety-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/services/safety-service/src/ .

ENV PORT=4009
EXPOSE 4009

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4009"]
