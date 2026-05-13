from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import transactions, ai
from app.routers import transactions, ai, users

app.include_router(users.router)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinControl IA",
    description="Plataforma de controle financeiro pessoal com IA.",
    version="1.0.0",
)

# Permite que o frontend se comunique com o backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"mensagem": "FinControl IA no ar! Acesse /docs para a documentação."}