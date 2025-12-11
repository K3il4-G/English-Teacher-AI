// backend/api/tts.js
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    // CORS preflight
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { text } = req.body || JSON.parse(req.rawBody || "{}");
    if (!text || !text.trim()) return res.status(400).json({ error: "Texto vacío" });

    const voiceId = process.env.VOICE_ID || "pqHfZKP75CvOlQylNhV4";
    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) return res.status(500).json({ error: "ELEVENLABS_API_KEY no configurada" });

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const payload = {
      text,
      model_id: "eleven_turbo_v2",
      voice_settings: { stability: 0.6, similarity_boost: 0.85 }
    };

    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenKey
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("ElevenLabs error:", r.status, errText);
      return res.status(500).json({ error: "Error de ElevenLabs", detail: errText });
    }

    const arrayBuffer = await r.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // CORS
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length.toString());

    // Send binary audio
    return res.status(200).send(buffer);
  } catch (e) {
    console.error("tts handler error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
