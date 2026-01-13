<<<<<<< HEAD
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# import routes
from app.routes.chat_routes import router as chat_router
from app.routes.resume_routes import router as resume_router

# create app FIRST
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routes AFTER app is created
app.include_router(chat_router)
app.include_router(resume_router)

@app.get("/")
def root():
    return {"status": "Backend running"}
=======
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes.resume_routes import router as resume_router

app = FastAPI()   # ✅ ONLY PLACE THIS EXISTS

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume_router)

@app.get("/")
def root():
    return {"status": "API running"}
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
