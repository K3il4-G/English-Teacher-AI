// backend/api/save_interaction.js
import fs from "fs";
import path from "path";

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

    const filePath = path.join("/tmp", "interacciones.txt");
    fs.appendFileSync(filePath, user_text + "\n", { encoding: "utf8" });

    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
    return res.status(200).json({ status: "ok", received: user_text });
  } catch (e) {
    console.error("save_interaction error:", e);
    return res.status(500).json({ error: String(e) });
  }
}
