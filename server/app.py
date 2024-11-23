from flask import Flask, request, jsonify
import openai
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)

CORS(app, resources={r"/generate-sql": {"origins": "http://34.72.148.228"}})

def generar_sql_con_gpt(texto):
    prompt = f"Genera solo un script SQL compatible con MySQL para: {texto}."
    
    try:
        respuesta = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "Eres un experto en bases de datos MySQL."},
                      {"role": "user", "content": prompt}]
        )
        
        sql_generado = respuesta.choices[0].message['content'].strip()

        if "```sql" in sql_generado:
            sql_generado = sql_generado.split("```sql")[1].split("```")[0].strip()
        
        return sql_generado

    except openai.error.OpenAIError as e:
        print(f"Error en la API de OpenAI: {e}")
        return None

@app.route('/generate-sql', methods=['POST'])
def generate_sql():
    data = request.get_json()

    if not data or 'description' not in data:
        return jsonify({"error": "Proporcione una descripción válida."}), 400

    descripcion = data['description']
    sql_code = generar_sql_con_gpt(descripcion)

    if sql_code:
        return jsonify({"sqlCode": sql_code})
    else:
        return jsonify({"error": "No se pudo generar el código SQL."}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
