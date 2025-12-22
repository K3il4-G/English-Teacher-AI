// backend/api/ask_jack.js

export default async function handler(req, res) {
  // ----- CORS -----
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.FRONTEND_ORIGIN || "*"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { user_text } = body || {};

    if (!user_text || !user_text.trim()) {
      return res.status(400).json({ error: "Texto vacío" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no configurada"
      });
    }

    // ✅ MODELO Y ENDPOINT CORRECTOS
    const url =
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${geminiKey}`;

    const systemPrompt =
      "You are Jack, a friendly bilingual English teacher. Keep answers short, clear, and helpful.";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUser: ${user_text}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 256
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error("Gemini error:", r.status, errorText);
      return res.status(500).json({
        error: "Error calling Gemini",
        detail: errorText
      });
    }

    const json = await r.json();

    const reply =
      json?.candidates?.[0]?.content?.parts
        ?.map(p => p.text)
        .join("") || "No response";

    return res.status(200).json({ response: reply });

  } catch (e) {
    console.error("ask_jack fatal error:", e);
    return res.status(500).json({
      error: "Internal server error",
      detail: String(e)
    });
  }
}
