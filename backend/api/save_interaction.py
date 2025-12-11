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

        with open("/tmp/interacciones.txt", "a", encoding="utf-8") as f:
            f.write(user_text + "\n")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"status": "ok", "received": user_text})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
