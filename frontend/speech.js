// speech.js (reemplazar completo)

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
  recognition.interimResults = true;
  recognition.lang = "es-ES";

  let listening = false;

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

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    if (output) output.textContent = transcript;
    if (textInput) textInput.value = transcript;

    // Guardar interacción
    sendInteractionToBackend(transcript);

    // Hacer que Jack responda y el avatar hable
    if (window.enviarTextoAlServidorYHablar && typeof window.enviarTextoAlServidorYHablar === "function") {
      window.enviarTextoAlServidorYHablar(transcript);
    } else {
      // fallback: pedir /ask_jack y reproducir TTS localmente
      fetch("/ask_jack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: transcript })
      })
        .then(r => r.json())
        .then(d => {
          const reply = d && (d.response || d.reply);
          if (!reply) return;
          fetch("/tts", {
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
        .catch(e => console.error("Fallback /ask_jack error:", e));
    }
  };

  recognition.onend = () => {
    if (micBtn) micBtn.style.background = "#d32f2f";
    listening = false;
    if (output) output.textContent = "";
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
  fetch("/save_interaction", {
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

    // Pedir a Jack y que el avatar hable (preferimos función expuesta)
    if (window.enviarTextoAlServidorYHablar && typeof window.enviarTextoAlServidorYHablar === "function") {
      window.enviarTextoAlServidorYHablar(text);
    } else {
      // fallback: pedir /ask_jack + /tts playback
      fetch("/ask_jack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_text: text })
      })
        .then(r => r.json())
        .then(d => {
          const reply = d && (d.response || d.reply);
          if (!reply) return;
          fetch("/tts", {
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

    // limpiar input
    if (textInput) textInput.value = "";
  });

  // Enviar con Enter
  if (textInput) {
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }
}


