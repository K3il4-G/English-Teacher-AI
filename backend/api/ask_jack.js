// backend/api/ask_jack.js

export default async function handler(req, res) {
  // ---- CORS ----
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

    // ✅ MODELO PERMITIDO EN REST (FREE)
    const model = "gemini-1.5-flash";

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    const systemPrompt = `
You are a personalized English teacher named Jack.
Your personality is friendly, funny, and encouraging.
Your student is a Spanish-speaking girl named Dellys.
Help her progress from A1 to C1.
Be concise, bilingual when useful, and supportive.
`;

    // ⚠️ system prompt va concatenado
    const fullPrompt = `${systemPrompt}\n\nUser: ${user_text}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 256
      }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("Gemini REST error:", r.status, txt);
      return res.status(500).json({
        error: "Error calling Gemini",
        detail: txt
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
