import requests
import json

headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": "Bearer rnd_kxm9bKeR691JxuL1YBV4k23cZica"
}

# 1. Get Owner ID
owners_resp = requests.get("https://api.render.com/v1/owners", headers=headers)
if owners_resp.status_code != 200:
    print("FAILED TO GET OWNERS")
    print(owners_resp.text)
    exit(1)

owners = owners_resp.json()
owner_id = owners[0]['cursor'] # Usually the id is inside the object but let's just dump it if we don't know the exact structure
try:
    owner_id = owners[0]['owner']['id']
except:
    print("OWNERS:", owners)

# 2. Deploy
url = "https://api.render.com/v1/services"

payload = {
    "type": "web_service",
    "name": "smart-hire-api",
    "autoDeploy": "yes",
    "ownerId": owner_id,
    "repo": "https://github.com/Pia-07/AI-Based-Resume-Database-Management-and-Search-System",
    "branch": "main",
    "serviceDetails": {
        "env": "docker",
        "envSpecificDetails": {
            "dockerfilePath": "./Backend/Dockerfile",
            "dockerContext": "./Backend"
        },
        "region": "singapore",
        "plan": "free",
        "healthCheckPath": "/",
        "envVars": [
            {"key": "MONGODB_URI", "value": "mongodb+srv://23cs081:hetvi123@smarthire-cluster.nuhvf9y.mongodb.net/?appName=smarthire-cluster"},
            {"key": "MONGODB_DB_NAME", "value": "smarthire_db"},
            {"key": "GEMINI_API_KEY", "value": "AIzaSyBwLYME870l80hoYPa1ToJybHE0qTBkXlg"},
            {"key": "ENV", "value": "production"},
            {"key": "PORT", "value": "8000"}
        ]
    }
}

response = requests.post(url, json=payload, headers=headers)

if response.status_code in (200, 201):
    data = response.json()
    print("SUCCESS")
    print("URL:", data.get('service', {}).get('url', data))
else:
    print("FAILED")
    print(response.status_code)
    print(response.text)
