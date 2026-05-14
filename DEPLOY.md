# Deploy

Este projeto pode ser publicado separando backend e frontend:

- Backend FastAPI: Render
- Frontend estático: Vercel

## Backend no Render

Crie um novo Web Service no Render usando este repositório.

Configurações:

```text
Language: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Variáveis de ambiente:

```env
DATABASE_URL=sqlite:///./fincontrol.db
SECRET_KEY=sua-chave-secreta
GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=llama-3.3-70b-versatile
MAX_TOKENS=1500
```

Após o deploy, teste:

```text
https://sua-api.onrender.com/docs
```

## Frontend na Vercel

Crie um novo projeto na Vercel usando este repositório.

Configurações:

```text
Framework Preset: Other
Build Command: deixar vazio
Output Directory: deixar vazio
```

Antes do deploy final do frontend, atualize a constante `API_URL` no `script.js` com a URL pública da API no Render:

```js
const API_URL = "https://sua-api.onrender.com";
```

O arquivo `.vercelignore` evita que arquivos do backend sejam enviados como arquivos estáticos no deploy do frontend.

## Bot Telegram

O bot usa polling (`python bot.py`) e depende da API publicada.

Variáveis necessárias:

```env
TELEGRAM_BOT_TOKEN=seu-token-do-telegram
API_URL=https://sua-api.onrender.com
```

Como serviços gratuitos podem hibernar ou limitar processos contínuos, o bot pode ficar documentado como execução local até a escolha de uma plataforma própria para processos sempre ativos.
