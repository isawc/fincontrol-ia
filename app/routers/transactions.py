from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/transactions", tags=["Transações"])

TIPOS_VALIDOS = {"income", "expense"}


@router.post("/", response_model=schemas.TransactionResponse, status_code=201)
def criar_transacao(
    transacao: schemas.TransactionCreate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    if transacao.type not in TIPOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Tipo de transação inválido.",
        )

    usuario = db.query(models.User).filter(models.User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

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
        owner_id=user_id,
    )

    db.add(nova)
    db.commit()
    db.refresh(nova)

    return nova


@router.get("/", response_model=list[schemas.TransactionResponse])
def listar_transacoes(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Transaction)
        .filter(models.Transaction.owner_id == user_id)
        .order_by(models.Transaction.date.desc())
        .all()
    )


@router.get("/{transacao_id}", response_model=schemas.TransactionResponse)
def buscar_transacao(
    transacao_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    transacao = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transacao_id,
            models.Transaction.owner_id == user_id,
        )
        .first()
    )

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    return transacao


@router.delete("/{transacao_id}", status_code=204)
def deletar_transacao(
    transacao_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    transacao = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.id == transacao_id,
            models.Transaction.owner_id == user_id,
        )
        .first()
    )

    if not transacao:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

    usuario = db.query(models.User).filter(models.User.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    if transacao.type == "income":
        usuario.balance -= transacao.amount
    else:
        usuario.balance += transacao.amount

    db.delete(transacao)
    db.commit()
