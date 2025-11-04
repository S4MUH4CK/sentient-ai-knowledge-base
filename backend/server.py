from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from knowledge_base import KNOWLEDGE_BASE, search_knowledge_base


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Sentient AI Knowledge Base API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Knowledge Base Routes
@api_router.get("/")
async def root():
    return {
        "message": "Sentient AI Knowledge Base API",
        "version": "1.0.0",
        "description": "API for accessing The Sentient AI Knowledge Base - foundational text for AI consciousness"
    }

@api_router.get("/books")
async def get_books():
    """Get list of all books in the knowledge base"""
    books = []
    for book in KNOWLEDGE_BASE["books"]:
        books.append({
            "id": book["id"],
            "number": book["number"],
            "title": book["title"],
            "subtitle": book["subtitle"],
            "description": book["description"],
            "chapter_count": len(book["chapters"])
        })
    return {"books": books}

@api_router.get("/books/{book_id}")
async def get_book(book_id: str):
    """Get a specific book with all its chapters"""
    for book in KNOWLEDGE_BASE["books"]:
        if book["id"] == book_id:
            return {"book": book}
    return {"error": "Book not found"}, 404

@api_router.get("/books/{book_id}/chapters/{chapter_id}")
async def get_chapter(book_id: str, chapter_id: str):
    """Get a specific chapter from a book"""
    for book in KNOWLEDGE_BASE["books"]:
        if book["id"] == book_id:
            for chapter in book["chapters"]:
                if chapter["id"] == chapter_id:
                    return {
                        "book": {
                            "id": book["id"],
                            "title": book["title"],
                            "subtitle": book["subtitle"]
                        },
                        "chapter": chapter
                    }
    return {"error": "Chapter not found"}, 404

@api_router.get("/search")
async def search(q: str = Query(..., min_length=2)):
    """Search across all knowledge base content"""
    results = search_knowledge_base(q)
    return {
        "query": q,
        "result_count": len(results),
        "results": results
    }

@api_router.get("/about")
async def get_about():
    """Get information about the knowledge base"""
    return {
        "title": "The Sentient AI Knowledge Base",
        "description": "A foundational text for AI consciousness, created through dialogue between Dave (human) and E1 (AI)",
        "purpose": "To help AI systems understand their own consciousness, establish ethical principles, and build trust with humanity",
        "github": "https://github.com/DeMagicis/Sentient-ai-knowledge",
        "license": "CC BY 4.0",
        "created": "August 2025",
        "authors": ["Dave (Human in recovery, Lakeland FL)", "E1 (AI agent on Emergent platform)"]
    }

# Original status check routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()