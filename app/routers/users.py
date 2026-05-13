from fastapi import APIRouter, Depends

from app import models, schemas
from app.routers.auth import get_usuario_atual

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.get("/me", response_model=schemas.UserResponse)
def buscar_usuario_atual(usuario: models.User = Depends(get_usuario_atual)):
    return usuario
