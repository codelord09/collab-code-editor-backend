FROM python:3.9-slim

WORKDIR /app

# Install system dependencies (netcat for wait-for-it scripts, if needed)
RUN apt-get update && apt-get install -y netcat-openbsd gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
