# FinControl IA

Plataforma de controle financeiro pessoal com dashboard web, autenticação JWT, registro de transações e integração com IA para interpretar mensagens financeiras.

O projeto foi desenvolvido como trabalho acadêmico e também como evolução prática de backend, frontend e integração com serviços externos.

## Sobre o Projeto

A proposta do FinControl IA é permitir que o usuário acompanhe receitas, despesas e saldo em uma interface web, além de registrar movimentações financeiras a partir de mensagens em linguagem natural.

Exemplo:

```text
gastei 35 reais no mercado
```

A IA interpreta a mensagem, identifica valor, tipo, categoria e descrição, e registra a transação no sistema.

## Funcionalidades

- Cadastro e login de usuários
- Autenticação com JWT
- Listagem de transações por usuário autenticado
- Registro manual de receitas e despesas
- Registro de transações com apoio de IA
- Dashboard com saldo e gráfico por categoria
- Bot do Telegram integrado à API
- Banco de dados SQLite em desenvolvimento

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | HTML, CSS, JavaScript |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Autenticação | JWT, Passlib, Bcrypt |
| IA | Groq |
| Bot | python-telegram-bot |
| Banco | SQLite |

## Estrutura

```text
fincontrol-ia/
├── app/
│   ├── routers/
│   ├── ai_parser.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── schemas.py
├── legacy/
│   └── fincontrol_backend/
├── docs/
├── prototipo/
├── index.html
├── script.js
├── styles.css
├── bot.py
└── requirements.txt
```

## Como Rodar

Crie e ative o ambiente virtual:

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Instale as dependências:

```powershell
pip install -r requirements.txt
```

Configure o `.env`:

```env
DATABASE_URL=sqlite:///./fincontrol.db
SECRET_KEY=sua-chave-secreta
GROQ_API_KEY=sua-chave-groq
GROQ_MODEL=llama-3.3-70b-versatile
MAX_TOKENS=1500
```

Inicie a API:

```powershell
uvicorn app.main:app --reload
```

Acesse a documentação:

```text
http://127.0.0.1:8000/docs
```

Para testar o frontend, abra o arquivo `index.html` no navegador.

## Status

Projeto em desenvolvimento.

Próximas melhorias previstas:

- Melhorar o formulário de cadastro de transações
- Evoluir a confirmação de transações feitas por IA
- Preparar deploy do backend e frontend
- Documentar o fluxo do bot Telegram

## Observação

Este projeto não oferece consultoria financeira profissional. As respostas da IA são usadas apenas para auxiliar na organização financeira pessoal.
