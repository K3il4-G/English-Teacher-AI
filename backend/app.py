# backend/app.py
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from gtts import gTTS
import io
import azure.cognitiveservices.speech as speechsdk

app = Flask(__name__)
CORS(app)  # para pruebas: permite todas las orígenes. Ajusta para producción.

@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json(force=True)
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text required"}), 400

    # Generar audio en memoria (mp3)
    tts = gTTS(text=text, lang='es')  # cambia lang si quieres otra lengua
    buf = io.BytesIO()
    tts.write_to_fp(buf)
    buf.seek(0)
    return send_file(buf, mimetype="audio/mpeg", as_attachment=False, download_name="tts.mp3")

if __name__ == "__main__":
    # uso dev local: flask run o python app.py
    app.run(host="0.0.0.0", port=5000, debug=True)
