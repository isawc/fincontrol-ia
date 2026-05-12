from fastapi import FastAPI
from app.database import engine, Base
from app.routers import transactions, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinControl IA",
    description="Plataforma de controle financeiro pessoal com IA.",
    version="1.0.0",
)

app.include_router(transactions.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"mensagem": "FinControl IA no ar! Acesse /docs para a documentação."}