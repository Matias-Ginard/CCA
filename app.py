from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Permite que el HTML se comunique con el Python

# Configuración de base de datos
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///agroquimicos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo para los cruces de productos
class Compatibilidad(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    categoria = db.Column(db.String(50))
    producto_a = db.Column(db.String(100))
    producto_b = db.Column(db.String(100))
    riesgo = db.Column(db.String(20))
    limpieza = db.Column(db.String(10))
    notas = db.Column(db.Text)

# Crear la base de datos al iniciar
with app.app_context():
    db.create_all()

@app.route('/api/guardar', methods=['POST'])
def guardar():
    data = request.json
    nueva = Compatibilidad(
        categoria=data['categoria'],
        producto_a=data['producto_a'],
        producto_b=data['producto_b'],
        riesgo=data['riesgo'],
        limpieza=data['limpieza'],
        notas=data['notas']
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify({"status": "ok", "message": "Guardado en SQL"})

@app.route('/api/datos', methods=['GET'])
def obtener_datos():
    registros = Compatibilidad.query.all()
    resultado = {}
    
    for r in registros:
        if r.categoria not in resultado:
            resultado[r.categoria] = {"productos": [], "compat": {}}
        
        if r.producto_a not in resultado[r.categoria]["productos"]:
            resultado[r.categoria]["productos"].append(r.producto_a)
        if r.producto_b not in resultado[r.categoria]["productos"]:
            resultado[r.categoria]["productos"].append(r.producto_b)
            
        # Generar llave única para el cruce
        key = "|".join(sorted([r.producto_a.lower().strip(), r.producto_b.lower().strip()]))
        resultado[r.categoria]["compat"][key] = {
            "riesgo": r.riesgo,
            "limpieza": r.limpieza,
            "notas": r.notas
        }
    return jsonify(resultado)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
