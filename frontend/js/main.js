import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

// --------------------
//   ESCENA BÁSICA
// --------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2.1, 1.5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --------------------
//   LUCES
// --------------------
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 2, 5);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// --------------------
//   CARGA DEL AVATAR
// --------------------
const loader = new GLTFLoader();
let avatar;
let mouthMesh;

loader.load(
  "./models/avatar.glb",
  function (gltf) {
    avatar = gltf.scene;
    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);

    findEyes();
    setInterval(fakeBlink, 5000);

    avatar.traverse((child) => {
      if (
        child.isMesh &&
        child.name === "Wolf3D_Head" &&
        child.morphTargetDictionary &&
        "mouthOpen" in child.morphTargetDictionary
      ) {
        mouthMesh = child;
      }
    });

    // Movimiento de cabeza
    let headBone;
    avatar.traverse((child) => {
      if (child.name === "Head") headBone = child;
    });

    function headMovement() {
      if (!headBone) return;
      const angle = Math.random() * 0.3 - 0.15;
      const duration = 1 + Math.random() * 1.5;
      gsap.to(headBone.rotation, {
        y: angle,
        duration: duration,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1,
      });
    }

    function scheduleHeadMovement() {
      const interval = 7000 + Math.random() * 10000;
      setTimeout(() => {
        headMovement();
        scheduleHeadMovement();
      }, interval);
    }

    scheduleHeadMovement();
  },
  undefined,
  function (error) {
    console.error("Error al cargar el modelo:", error);
  }
);

// --------------------
//   CONTROLES
// --------------------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.update();

// --------------------
//   FUNCIÓN HABLAR
// --------------------
export async function hablar(texto) {
  if (!texto || texto.length === 0) return;

  const response = await fetch("https://english-teacher-ai.onrender.com/tts", { //here used to be the host 5000 : http://127.0.0.1:5000/
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto }),
  });

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioContext.createMediaElementSource(audio);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  function animateMouth() {
    analyser.getByteFrequencyData(dataArray);
    const volume =
      dataArray.reduce((a, b) => a + b) / dataArray.length / 255;

    if (mouthMesh && mouthMesh.morphTargetDictionary["mouthOpen"] !== undefined) {
      const mouthIndex = mouthMesh.morphTargetDictionary["mouthOpen"];
      mouthMesh.morphTargetInfluences[mouthIndex] = Math.min(volume * 3, 1);
    }

    if (!audio.paused && !audio.ended) {
      requestAnimationFrame(animateMouth);
    }
  }

  audio.play();
  animateMouth();
}

// --------------------------------------------
//   NUEVA FUNCIÓN: Enviar texto → Jack → hablar ...............................................................................
// --------------------------------------------
export async function enviarTextoAlServidorYHablar(userText) {
  if (!userText || userText.trim().length === 0) return;

  try {
    const response = await fetch("https://english-teacher-ai.onrender.com/ask_jack", {  // <- CORREGIDO
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_text: userText })
    });

    const data = await response.json();

    // Tu backend devuelve { "response": jack_reply }
    const jackReply = data && (data.response || data.reply); // soporta ambos por seguridad

    if (!jackReply) {
      console.error("⚠ Backend no devolvió respuesta válida:", data);
      return;
    }

    console.log("🧠 Respuesta de Jack:", jackReply);

    // 👉 Hacer hablar al avatar
    hablar(jackReply);

  } catch (error) {
    console.error("❌ Error enviando texto al servidor:", error);
  }
}

// --------------------
//   PARPADEO
// --------------------
let leftEye, rightEye;

function findEyes() {
  avatar?.traverse((child) => {
    if (child.name === "EyeLeft") leftEye = child;
    if (child.name === "EyeRight") rightEye = child;
  });
}

function fakeBlink() {
  if (!leftEye || !rightEye) return;

  const duration = 800;
  const closeTime = 300;
  const holdTime = 150;
  const openTime = 350;
  const start = performance.now();

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function animateBlink(now) {
    const elapsed = now - start;
    let scaleY = 1;

    if (elapsed < closeTime) {
      scaleY = 1 - easeInOut(elapsed / closeTime) * 0.8;
    } else if (elapsed < closeTime + holdTime) {
      scaleY = 0.2;
    } else if (elapsed < duration) {
      scaleY =
        0.2 + easeInOut((elapsed - closeTime - holdTime) / openTime) * 0.8;
    }

    leftEye.scale.y = scaleY;
    rightEye.scale.y = scaleY;

    if (elapsed < duration) requestAnimationFrame(animateBlink);
  }

  requestAnimationFrame(animateBlink);
}

// --------------------
//   RENDER LOOP
// --------------------
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --------------------
//   Exponer funciones para speech.js (no-modular)
// --------------------
window.hablar = hablar;
window.enviarTextoAlServidorYHablar = enviarTextoAlServidorYHablar;
