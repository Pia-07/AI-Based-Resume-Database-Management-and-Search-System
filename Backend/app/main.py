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
