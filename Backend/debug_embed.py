import os
import sys

# Append the base directory to the python path so the backend modules can be imported
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from Backend.app.services.model_manager import model_manager

# Attempt to encode a simple string
try:
    vec = model_manager.encode(["give me the names of candidates who have python on their skills"])
    print(f"Shape: {vec.shape}")
    if len(vec) > 0:
        print(f"Dim size: {len(vec[0])}")
except Exception as e:
    print(f"Error: {e}")
