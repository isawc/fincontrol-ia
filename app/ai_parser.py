import json
import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODELO = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1500"))

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY não configurada.")

cliente = Groq(api_key=GROQ_API_KEY)


def parsear_mensagem(mensagem: str) -> dict:
    prompt = f"""
Você é um assistente financeiro. Analise a mensagem abaixo e extraia os dados financeiros.
Retorne APENAS um JSON válido, sem texto antes ou depois.

Mensagem:
"{mensagem}"

Retorne exatamente neste formato:
{{
    "reply": "resposta amigável para o usuário",
    "action": {{
        "type": "expense",
        "amount": 0.00,
        "category": "categoria aqui",
        "description": "descrição aqui"
    }}
}}

Categorias disponíveis:
Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Salário, Freelance, Outros.

Regras:
- Se não for uma transação financeira, retorne "action": null
- action.type deve ser escolhido entre: expense ou income
- amount deve ser sempre positivo
- category deve ser uma das categorias disponíveis
- Seja objetivo e amigável na reply
- Retorne APENAS o JSON, sem markdown
"""

    resposta = cliente.chat.completions.create(
        model=MODELO,
        max_tokens=MAX_TOKENS,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )

    texto = resposta.choices[0].message.content

    if not texto:
        raise ValueError("IA retornou resposta vazia.")

    try:
        return json.loads(texto)
    except json.JSONDecodeError as erro:
        raise ValueError("IA retornou resposta inválida.") from erro
