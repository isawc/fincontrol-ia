import os
import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import db, User, Transaction, Goal
import json

# Adiciona o diretório raiz ao path do Python para encontrar o pacote 'fincontrol_ia_bot'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fincontrol_ia_bot.services.ai_service import gerar_resposta_json  # Nova função que criaremos

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fincontrol.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app) # Enable CORS for frontend
db.init_app(app)

def create_initial_data():
    with app.app_context():
        db.create_all()
        if not User.query.first():
            user = User(name='Alex Morgan', balance=42850.20)
            db.session.add(user)
            
            # Initial Dummy Transactions
            t1 = Transaction(user_id=1, amount=-1299.00, type='expense', category='Electronics', description='Apple Store')
            t2 = Transaction(user_id=1, amount=-6.50, type='expense', category='Food & Drink', description='Starbucks')
            t3 = Transaction(user_id=1, amount=4250.00, type='income', category='Salary', description='Tech Corp Inc.')
            
            db.session.add_all([t1, t2, t3])
            db.session.commit()
            print("Database initialized with dummy data.")

create_initial_data()

@app.route('/api/overview', methods=['GET'])
def get_overview():
    user = User.query.first()
    transactions = Transaction.query.order_by(Transaction.date.desc()).limit(10).all()
    
    # Calculate spending breakdown (Expenses only)
    expenses = Transaction.query.filter_by(type='expense').all()
    categories = {}
    total_spent = 0
    for exp in expenses:
        categories[exp.category] = categories.get(exp.category, 0) + abs(exp.amount)
        total_spent += abs(exp.amount)
        
    return jsonify({
        'user': {'name': user.name, 'balance': user.balance},
        'spending': {'total': total_spent, 'categories': categories},
        'recent_transactions': [{
            'id': t.id,
            'amount': t.amount,
            'type': t.type,
            'category': t.category,
            'description': t.description,
            'date': t.date.isoformat()
        } for t in transactions]
    })

@app.route('/api/chat', methods=['POST'])
async def handle_chat():
    data = request.json
    message = data.get('message', '')
    
    if not message:
        return jsonify({'error': 'Message is empty'}), 400
        
    try:
        # Chama a IA passando pedindo formato JSON estruturado
        ai_result_str = await gerar_resposta_json(message, 'text')
        
        # O Gemini retorna uma string JSON (provavelmente com blocos ```json ... ```)
        # Limpar crases caso existam
        if '```json' in ai_result_str:
             ai_result_str = ai_result_str.split('```json')[1].split('```')[0].strip()
        elif '```' in ai_result_str:
             ai_result_str = ai_result_str.split('```')[1].strip()
             
        parsed = json.loads(ai_result_str)
        
        # parsed should have {"reply": "...", "action": {"type", "amount", "category", "description"} ou null}
        action = parsed.get("action")
        
        if action and action.get('type'):
            user = User.query.first()
            amount = float(action.get('amount', 0))
            if action['type'] == 'expense':
                amount = -abs(amount)
                user.balance += amount
            elif action['type'] == 'income':
                amount = abs(amount)
                user.balance += amount
                
            new_tx = Transaction(
                user_id=user.id,
                amount=amount,
                type=action['type'],
                category=action.get('category', 'Outros'),
                description=action.get('description', 'Registrado pela IA')
            )
            db.session.add(new_tx)
            db.session.commit()
            
        return jsonify({
            'reply': parsed.get('reply', 'Certo!'),
            'action_taken': action is not None
        })
        
    except Exception as e:
        print(f"Error handling chat: {e}")
        return jsonify({'error': 'Internal AI Error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
