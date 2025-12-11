// backend/api/ask_jack.js
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { user_text } = req.body || JSON.parse(req.rawBody || "{}");
    if (!user_text || !user_text.trim()) return res.status(400).json({ error: "Texto vacío" });

    // Preferimos GEMINI via REST if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada. Puedes configurar OPENAI_API_KEY y usar la alternativa." });
    }

    // Example with Google Generative API (REST). Depending on your Google credentials you may need OAuth/service account instead of API key.
    // Endpoint and body below use the v1beta2 generateMessage style; if your GCP project uses different endpoint, adapt accordingly.
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateMessage?key=${encodeURIComponent(geminiKey)}`;

    const systemPrompt = `You are Jack, a short bilingual English teacher... (keep it concise and friendly)`;

    const bodyPayload = {
      "messages": [
        { "author": "system", "content": [{ "type": "text", "text": systemPrompt }] },
        { "author": "user", "content": [{ "type": "text", "text": user_text }] }
      ],
      "temperature": 0.9,
      "maxOutputTokens": 256
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload)
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("Gemini REST error:", r.status, txt);
      return res.status(500).json({ error: "Error calling Gemini", detail: txt });
    }

    const json = await r.json();
    // The Google response contains structured message. We try to extract text content.
    let reply = null;
    try {
      // v1beta2 returns .candidates or .output or similar; attempt multiple safe reads:
      if (json && json.candidates && json.candidates.length) {
        reply = json.candidates[0].content?.map(c => c.text || "").join("") || null;
      } else if (json && json.output && json.output[0] && json.output[0].content) {
        reply = json.output[0].content.map(c => c.text || "").join("");
      } else {
        // fallback stringify
        reply = JSON.stringify(json).slice(0, 500);
      }
    } catch (e) {
      reply = JSON.stringify(json).slice(0, 500);
    }

    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
    return res.status(200).json({ response: reply });

  } catch (e) {
    console.error("ask_jack error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
