#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install PyTorch CPU version explicitly to save RAM and disk space on Render
echo "Installing PyTorch CPU..."
pip install torch --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the requirements
echo "Installing remaining requirements..."
pip install -r ../requirements.txt

echo "Build complete."
