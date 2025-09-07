from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import chat

# Load environment variables
load_dotenv()

# Create database tables
# Ensure models.Base is correctly accessed after relative import
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChatBI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/")
def read_root():
    return {"message": "Welcome to ChatBI API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
