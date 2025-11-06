const btn = document.getElementById("mic-btn");
const output = document.getElementById("output");

// Comprobar compatibilidad del navegador
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  output.textContent = "❌ Tu navegador no soporta reconocimiento de voz.";
} else {
  const recognition = new SpeechRecognition();
  recognition.continuous = false; // detiene después de hablar
  recognition.interimResults = true; // muestra texto mientras hablas
  recognition.lang = "es-ES"; // idioma por defecto: español

  let listening = false;

  btn.addEventListener("click", () => {
    if (!listening) {
      recognition.start();
      btn.style.background = "#03a9f4";
      output.textContent = "🎙️ Escuchando... (habla en inglés o español)";
    } else {
      recognition.stop();
      btn.style.background = "#6200ee";
      output.textContent = "🛑 Detenido.";
    }
    listening = !listening;
  });

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    output.textContent = transcript;
  };

  recognition.onend = () => {
    btn.style.background = "#6200ee";
    listening = false;
  };
}
