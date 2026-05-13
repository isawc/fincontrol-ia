from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app import auth as auth_utils
from app import models
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Autenticação"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str


@router.post("/register", response_model=TokenResponse)
def register(dados: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == dados.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = models.User(
        name=dados.name,
        email=dados.email,
        hashed_password=auth_utils.gerar_hash_senha(dados.password),
        balance=0.0,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    token = auth_utils.criar_token({"sub": str(usuario.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": usuario.id,
        "name": usuario.name,
    }


@router.post("/login", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    usuario = db.query(models.User).filter(models.User.email == form.username).first()
    if not usuario or not auth_utils.verificar_senha(
        form.password,
        usuario.hashed_password,
    ):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")

    token = auth_utils.criar_token({"sub": str(usuario.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": usuario.id,
        "name": usuario.name,
    }


def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = auth_utils.decodificar_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    return usuario
