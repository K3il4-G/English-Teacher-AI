import os
from server import jack_generate_response
import json

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "body": "Method Not Allowed"
        }

    try:
        body = json.loads(request.body)
        user_text = body.get("user_text", "").strip()

        if not user_text:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Texto vacío"})
            }

        reply = jack_generate_response(user_text)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"response": reply})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
