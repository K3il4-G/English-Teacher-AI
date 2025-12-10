// speech.js (versión corregida SIN duplicaciones)

const micBtn = document.getElementById("btnMic");
const sendBtn = document.getElementById("btnSend");
const textInput = document.getElementById("textInput");
const output = document.getElementById("output");

// Comprobar compatibilidad
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  if (output) output.textContent = "❌ Tu navegador no soporta reconocimiento de voz.";
  console.warn("Reconocimiento de voz no soportado");
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "es-ES";

  let listening = false;

  // 🔥 NUEVO: evitar que el mismo final se envíe dos veces
  let lastSent = "";

  if (micBtn) {
    micBtn.addEventListener("click", () => {
      if (!listening) {
        recognition.start();
        micBtn.style.background = "#03a9f4";
        if (output) output.textContent = "🎙️ Escuchando...";
      } else {
        recognition.stop();
        micBtn.style.background = "#d32f2f";
        if (output) output.textContent = "🛑 Detenido.";
      }
      listening = !listening;
    });
  }

  let finalTranscript = "";

  recognition.onresult = (event) => {
    finalTranscript = event.results[0][0].transcript.trim();

    if (output) output.textContent = finalTranscript;
    if (textInput) textInput.value = finalTranscript;
  };

  // Ejecutado cuando usuario deja de hablar o se suelta el botón
  recognition.onend = () => {
    micBtn.style.background = "#d32f2f";
    listening = false;

    // 🔥 EVITAR DUPLICADOS: si es igual al último, ignorar
    if (!finalTranscript || finalTranscript === lastSent) {
      finalTranscript = "";
      return;
    }

    // Guardar nuevo texto como "último enviado"
    lastSent = finalTranscript;

    // Guardar interacción
    sendInteractionToBackend(finalTranscript);

    // Enviar a Jack una sola vez
    if (window.enviarTextoAlServidorYHablar) {
      window.enviarTextoAlServidorYHablar(finalTranscript);
    }

    output.textContent = "";
    finalTranscript = "";
  };

  recognition.onerror = (e) => {
    console.error("STT error:", e);
    if (output) output.textContent = "❌ Error en reconocimiento de voz";
    listening = false;
    if (micBtn) micBtn.style.background = "#d32f2f";
  };
}

// --- NUEVA FUNCIÓN: enviar texto al backend (guardar interacción) ---
function sendInteractionToBackend(text) {
  if (!text || !text.trim()) return;
  fetch("https://english-teacher-ai.onrender.com/save_interaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_text: text })
  })
    .then(res => res.json())
    .then(data => {
      console.log("Interacción guardada:", data);
    })
    .catch(err => {
      console.error("Error guardando interacción", err);
    });
}

// --- Manejo del botón Enviar (texto escrito) ---
if (sendBtn) {
  sendBtn.addEventListener("click", () => {
    const text = (textInput && textInput.value) ? textInput.value.trim() : "";
    if (!text) return;

    if (output) output.textContent = text;
    sendInteractionToBackend(text);

    if (window.enviarTextoAlServidorYHablar && typeof window.enviarTextoAlServidorYHablar === "function") {
      window.enviarTextoAlServidorYHablar(text);
    } else {
      // fallback
      fetch("https://english-teacher-ai.onrender.com/ask_jack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: text })
      })
        .then(r => r.json())
        .then(d => {
          const reply = d && (d.response || d.reply);
          if (!reply) return;
          fetch("https://english-teacher-ai.onrender.com/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: reply })
          })
            .then(res => res.blob())
            .then(blob => {
              const url = URL.createObjectURL(blob);
              const audio = new Audio(url);
              audio.play();
            });
        })
        .catch(e => console.error("Fallback send error:", e));
    }

    if (textInput) textInput.value = "";
  });

  if (textInput) {
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }
}
