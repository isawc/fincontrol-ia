from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_usuario_atual

router = APIRouter(prefix="/transactions", tags=["Transações"])

TIPOS_VALIDOS = {"income", "expense"}


@router.post("/", response_model=schemas.TransactionResponse, status_code=201)
def criar_transacao(
    transacao: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    usuario: models.User = Depends(get_usuario_atual),
):
    if transacao.type not in TIPOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Tipo de transação inválido.",
        )

    if transacao.amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valor da transação inválido.",
        )

    if transacao.type == "income":
        usuario.balance += transacao.amount
    else:
        usuario.balance -= transacao.amount

    nova = models.Transaction(
        amount=transacao.amount,
        type=transacao.type,
        category=transacao.category,
        description=transacao.description,
        date=transacao.date or datetime.utcnow(),
        owner_id=usuario.id,
    )

    db.add(nova)
    db.commit()
    db.refresh(nova)

    return nova


@router.get("/", response_model=list[schemas.TransactionResponse])
def listar_transacoes(
    db: Session = Depends(get_db),
    usuario: models.User = Depends(get_usuario_atual),
):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.owner_id == usuario.id)
        .order_by(models.Transaction.date.desc())
        .all()
    )


@router.get("/{transacao_id}", response_model=schemas.TransactionResponse)
def buscar_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario: models.User = Depends(get_usuario_atual),
):
    transacao = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transacao_id,
            models.Transaction.owner_id == usuario.id,
        )
        .first()
    )

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    return transacao


@router.delete("/{transacao_id}", status_code=204)
def deletar_transacao(
    transacao_id: int,
    db: Session = Depends(get_db),
    usuario: models.User = Depends(get_usuario_atual),
):
    transacao = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transacao_id,
            models.Transaction.owner_id == usuario.id,
        )
        .first()
    )

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    if transacao.type == "income":
        usuario.balance -= transacao.amount
    else:
        usuario.balance += transacao.amount

    db.delete(transacao)
    db.commit()
