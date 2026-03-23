import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CLIENT_ORIGIN

# Configure logging — INFO by default, DEBUG if LOG_LEVEL=DEBUG in env
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="AI Service")

origins = [o for o in [CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:3000"] if o]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


from ws_handler import router as ws_router  # noqa: E402

app.include_router(ws_router)
