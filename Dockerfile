FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

COPY requirements.txt ./

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

# Keep concurrency deliberately bounded for the 0.5 GB App Platform container.  Request
# recycling prevents a long-running worker from becoming the single point of failure.
CMD ["gunicorn", "--workers", "1", "--threads", "4", "--timeout", "90", "--graceful-timeout", "30", "--keep-alive", "5", "--max-requests", "500", "--max-requests-jitter", "50", "--bind", "0.0.0.0:8080", "wsgi:app"]
