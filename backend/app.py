# backend/app.py
import os
import io
import requests
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # ejemplo: voz masculina joven
ELEVEN_API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

app = Flask(__name__)
CORS(app)

@app.route("/tts", methods=["POST"])
def tts():
    """Convierte texto en audio usando ElevenLabs."""
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
        "model_id": "eleven_turbo_v2",  # modelo más rápido y natural
        "voice_settings": {
            "stability": 0.6,
            "similarity_boost": 0.85
        }
    }

    response = requests.post(ELEVEN_API_URL, headers=headers, json=payload)

    if response.status_code != 200:
        print("Error de ElevenLabs:", response.text)
        return jsonify({"error": "No se pudo generar el audio"}), 500

    # Devolver el audio como MP3 en memoria
    audio_bytes = io.BytesIO(response.content)
    audio_bytes.seek(0)
    return send_file(audio_bytes, mimetype="audio/mpeg", as_attachment=False, download_name="tts.mp3")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
