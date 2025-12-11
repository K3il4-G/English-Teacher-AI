import os
import io
import json
import requests
import base64

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
VOICE_ID = "pqHfZKP75CvOlQylNhV4"
ELEVEN_API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }

    try:
        body = json.loads(request.body)
        text = body.get("text", "").strip()

        if not text:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Texto vacío"})
            }

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
            return {
                "statusCode": 500,
                "body": json.dumps({"error": response.text})
            }

        audio_bytes = response.content
        audio_base64 = base64.b64encode(audio_bytes).decode()

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"audio": audio_base64})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
