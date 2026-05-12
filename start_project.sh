#!/bin/bash

# Resume-Aware Chatbot - Setup & Run Script
# This script starts both the Backend (FastAPI) and Frontend (Vite)

# --- CONFIGURATION ---
BASE_DIR=$(pwd)
BACKEND_DIR="$BASE_DIR/Backend"
FRONTEND_DIR="$BASE_DIR"

# --- CLEANUP OLD PROCESSES ---
# Kill anything already using our ports to avoid "address already in use" errors
# and to ensure Vite always gets port 5173 (required for Google OAuth redirect URI)
echo "🧹 Cleaning up old processes on ports 8000, 5173, 5174..."
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null
sleep 1
echo "✅ Ports cleared"

# --- BACKEND STARTUP ---
echo "🚀 Starting Backend (FastAPI)..."
cd "$BACKEND_DIR"

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

# Ensure backend is killed when this script exits (Ctrl+C, etc.)
trap "echo '🔴 Stopping backend...'; kill $BACKEND_PID 2>/dev/null; exit" INT TERM EXIT

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
