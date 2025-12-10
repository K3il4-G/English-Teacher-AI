# backend/app.py
import os
import io
import requests
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 👇 Importamos tu motor de conversación con Gemini
from server import jack_generate_response


# ===========================================
# Cargar variables del .env
# ===========================================
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "pqHfZKP75CvOlQylNhV4" #"pNInz6obpgDQGcFmaJgB"  # ejemplo
ELEVEN_API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})



# ===========================================================
# 🔊 RUTA 1 — TEXT → SPEECH (igual que antes)
# ===========================================================
@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json(force=True)
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Se requiere texto"}), 400

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }

    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.85
        }
    }

    response = requests.post(ELEVEN_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        print("Error de ElevenLabs:", response.text)
        return jsonify({"error": "No se pudo generar el audio"}), 500

    audio_bytes = io.BytesIO(response.content)
    audio_bytes.seek(0)
    return send_file(audio_bytes, mimetype="audio/mpeg", as_attachment=False, download_name="tts.mp3")


# ===========================================================
# ✍ RUTA 2 — GUARDAR INTERACCIONES (micrófono o texto)
# ===========================================================
@app.route("/save_interaction", methods=["POST"])
def save_interaction():
    data = request.get_json(force=True)
    user_text = data.get("user_text", "").strip()

    if not user_text:
        return jsonify({"error": "Texto vacío"}), 400

    print(f"📝 Interacción recibida: {user_text}")

    try:
        with open("interacciones.txt", "a", encoding="utf-8") as f:
            f.write(user_text + "\n")
    except Exception as e:
        print("⚠ Error guardando interacción:", e)

    return jsonify({"status": "ok", "received": user_text})


# ===========================================================
# 🤖 RUTA 3 — PROCESAR TEXTO → RESPUESTA DE JACK
# ===========================================================
@app.route("/ask_jack", methods=["POST"])
def ask_jack():
    data = request.get_json(force=True)
    user_text = data.get("user_text", "").strip()

    if not user_text:
        return jsonify({"error": "Texto vacío"}), 400

    print(f"👤 Usuario dijo: {user_text}")

    # --- Generar respuesta del tutor Jack ---
    try:
        jack_reply = jack_generate_response(user_text)
        print(f"🤖 Jack responde: {jack_reply}")

    except Exception as e:
        print("❌ Error generando respuesta de Jack:", e)
        return jsonify({"error": "Error en el modelo"}), 500

    return jsonify({"response": jack_reply})


# ===========================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

