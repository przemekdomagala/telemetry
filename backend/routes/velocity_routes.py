from fastapi import APIRouter, Depends, HTTPException
from database.postgres import get_postgres
from models.velocity_model import VelocityPayload
from asyncpg import Pool


velocity_router = APIRouter()

@velocity_router.get("/velocity")
async def get_velocity(db: Pool = Depends(get_postgres)):
    query = "SELECT timestamp, velocity FROM velocity ORDER BY timestamp DESC LIMIT 10"

    async with db.acquire() as conn:
        rows = await conn.fetch(query)
        
    if not rows:
        rows = [] 
    
    return [VelocityPayload(timestamp=row['timestamp'], velocity=row['velocity']) for row in rows]