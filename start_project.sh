#!/bin/bash

# Resume-Aware Chatbot - Setup & Run Script
# This script starts both the Backend (FastAPI) and Frontend (Vite)

# --- CONFIGURATION ---
BASE_DIR=$(pwd)
BACKEND_DIR="$BASE_DIR/Backend"
FRONTEND_DIR="$BASE_DIR"

# --- BACKEND STARTUP ---
echo "🚀 Starting Backend (FastAPI)..."
cd "$BACKEND_DIR"

# Activate the correct virtual environment
# Activate the correct virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
elif [ -d "../.venv" ]; then
    source ../.venv/bin/activate
else
    echo "❌ Virtual environment not found in $BACKEND_DIR or parent directory"
    exit 1
fi

# Run backend in background
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
echo "✅ Backend started with PID: $BACKEND_PID"

# --- FRONTEND STARTUP ---
echo "🎨 Starting Frontend (Vite)..."
cd "$FRONTEND_DIR"

# Install node modules if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend (runs in foreground)
npm run dev

# --- CLEANUP ---
# Kill background backend process when script is stopped
trap "kill $BACKEND_PID" EXIT
