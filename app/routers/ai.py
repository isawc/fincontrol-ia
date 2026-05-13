from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.ai_parser import parsear_mensagem
from app.database import get_db
from app.routers.auth import get_usuario_atual

router = APIRouter(prefix="/ai", tags=["IA"])

TIPOS_VALIDOS = {"income", "expense"}


@router.post(
    "/parse",
    response_model=schemas.AIParseResponse,
    summary="Analisar mensagem financeira",
)
def parsear_e_registrar(
    requisicao: schemas.AIParseRequest,
    db: Session = Depends(get_db),
    usuario: models.User = Depends(get_usuario_atual),
):
    try:
        resultado = parsear_mensagem(requisicao.message)
    except ValueError as erro:
        raise HTTPException(status_code=500, detail=str(erro)) from erro

    action = resultado.get("action")
    reply = resultado.get("reply", "Certo!")
    transacao_criada = None

    if action and action.get("type") in TIPOS_VALIDOS:
        amount = float(action.get("amount", 0))

        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail="Valor da transação inválido.",
            )

        if action["type"] == "income":
            usuario.balance += amount
        else:
            usuario.balance -= amount

        nova = models.Transaction(
            amount=amount,
            type=action["type"],
            category=action.get("category", "Outros"),
            description=action.get("description", "Registrado pela IA"),
            date=datetime.utcnow(),
            owner_id=usuario.id,
        )

        db.add(nova)
        db.commit()
        db.refresh(nova)
        transacao_criada = nova

    return schemas.AIParseResponse(
        reply=reply,
        action_taken=transacao_criada is not None,
        transaction=transacao_criada,
    )
