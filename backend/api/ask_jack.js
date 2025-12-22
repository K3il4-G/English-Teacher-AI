// backend/api/ask_jack.js

export default async function handler(req, res) {
  // ===============================
  // 🔐 CORS — SIEMPRE PRIMERO
  // ===============================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ===============================
    // 📥 INPUT
    // ===============================
    const { user_text } = req.body || {};
    if (!user_text || !user_text.trim()) {
      return res.status(400).json({ error: "Texto vacío" });
    }

    // ===============================
    // 🔑 API KEY
    // ===============================
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY no configurada"
      });
    }

    // ===============================
    // 🤖 GEMINI CONFIG
    // ===============================
    const model = "gemini-1.5-flash"; // estable y recomendado
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const systemPrompt =
      "You are Jack, a short, friendly bilingual English teacher. Answer concisely, correct mistakes gently, and encourage the student.";

    const bodyPayload = {
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

    // ===============================
    // 🌐 CALL GEMINI
    // ===============================
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("❌ Gemini error:", r.status, errText);
      return res.status(500).json({
        error: "Error calling Gemini",
        detail: errText
      });
    }

    const json = await r.json();

    // ===============================
    // 🧠 EXTRACT TEXT
    // ===============================
    let reply = "";

    try {
      reply =
        json?.candidates?.[0]?.content?.parts
          ?.map(p => p.text || "")
          .join("")
          .trim() || "";
    } catch (e) {
      reply = "";
    }

    if (!reply) {
      reply = "Sorry, I couldn't generate a response right now.";
    }

    // ===============================
    // ✅ SUCCESS
    // ===============================
    return res.status(200).json({ response: reply });

  } catch (e) {
    console.error("🔥 ask_jack fatal error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
