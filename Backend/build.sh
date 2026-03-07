#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install requirements (lightweight — no PyTorch/FAISS needed)
echo "Installing requirements..."
pip install -r ../requirements.txt

echo "Build complete."
