FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Keep concurrency deliberately bounded for the two 1 GB App Platform instances. Workers
# are recycled occasionally, but not so frequently that normal counter activity triggers
# repeated cold starts and temporary 503 responses.
CMD ["gunicorn", "--workers", "1", "--threads", "4", "--timeout", "90", "--graceful-timeout", "30", "--keep-alive", "5", "--max-requests", "5000", "--max-requests-jitter", "500", "--bind", "0.0.0.0:8080", "wsgi:app"]
