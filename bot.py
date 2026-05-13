import os
import httpx
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_URL = os.getenv("API_URL", "http://localhost:8000")

if not TELEGRAM_BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN não configurado.")


# ── Comando /start ─────────────────────────────────────
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "👋 Olá! Sou o FinControl IA.\n\n"
        "Me mande uma mensagem descrevendo sua transação, tipo:\n"
        "• *gastei 50 reais no mercado*\n"
        "• *recebi 1500 de salário hoje*\n"
        "• *paguei 80 de uber*\n\n"
        "Vou registrar automaticamente pra você! 💰",
        parse_mode="Markdown"
    )


# ── Comando /saldo ─────────────────────────────────────
async def saldo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{API_URL}/transactions/?user_id=1")
            transactions = res.json()

        balance = sum(
            tx["amount"] if tx["type"] == "income" else -tx["amount"]
            for tx in transactions
        )

        await update.message.reply_text(
            f"💰 *Saldo atual:* R${balance:.2f}\n"
            f"📊 *Total de transações:* {len(transactions)}",
            parse_mode="Markdown"
        )
    except Exception:
        await update.message.reply_text("❌ Erro ao buscar saldo. Tente novamente.")


# ── Mensagem de texto ──────────────────────────────────
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text

    # Mostra "digitando..." enquanto processa
    await context.bot.send_chat_action(
        chat_id=update.effective_chat.id,
        action="typing"
    )

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(
                f"{API_URL}/ai/parse",
                json={"message": text, "user_id": 1}
            )
            data = res.json()

        reply = data.get("reply", "Não entendi. Tente novamente.")
        action_taken = data.get("action_taken", False)

        if action_taken:
            tx = data.get("transaction", {})
            tipo = "💚 Receita" if tx.get("type") == "income" else "🔴 Despesa"
            await update.message.reply_text(
                f"{reply}\n\n"
                f"✅ *Transação registrada!*\n"
                f"{tipo}: R${tx.get('amount', 0):.2f}\n"
                f"📂 Categoria: {tx.get('category', '-')}\n"
                f"📝 Descrição: {tx.get('description', '-')}",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(reply)

    except Exception as e:
        await update.message.reply_text(
            "❌ Erro ao processar. Verifique se o backend está rodando."
        )


# ── Main ───────────────────────────────────────────────
def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("saldo", saldo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🤖 Bot rodando...")
    app.run_polling()


if __name__ == "__main__":
    main()