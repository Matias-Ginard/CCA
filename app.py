from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agroquimicos.db'
db = SQLAlchemy(app)

# Modelo de la tabla
class Compatibilidad(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    categoria = db.Column(db.String(50))
    producto_a = db.Column(db.String(100))
    producto_b = db.Column(db.String(100))
    riesgo = db.Column(db.String(20))
    limpieza = db.Column(db.String(10))
    notas = db.Column(db.Text)

with app.app_context():
    db.create_all()

@app.route('/guardar', methods=['POST'])
def guardar():
    data = request.json
    nueva_compat = Compatibilidad(
        categoria=data['categoria'],
        producto_a=data['producto_a'],
        producto_b=data['producto_b'],
        riesgo=data['riesgo'],
        limpieza=data['limpieza'],
        notas=data['notas']
    )
    db.session.add(nueva_compat)
    db.session.commit()
    return jsonify({"status": "success", "message": "Guardado en SQL"})

@app.route('/datos', methods=['GET'])
def obtener_datos():
    # Aquí transformarías los datos de la SQL al formato JSON que usa tu tabla
    registros = Compatibilidad.query.all()
    # ... lógica para devolver el formato esperado ...
    return jsonify({"db": "datos"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
