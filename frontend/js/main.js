import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";
import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";



//  Escena básica
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa); // Fondo gris


const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.1, 1.5);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//  Luz
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 2, 5);
//scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

//  Carga del modelo .glb
const loader = new GLTFLoader();
let avatar;
let mouthMesh;

loader.load(
  "./models/avatar.glb",
  function (gltf) {
    console.log("GLTF Model:", gltf);

    // 🧩 Log all morph targets in the model ......
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        console.log(child.name, child.morphTargetDictionary);
      }
    });

    avatar = gltf.scene;
    window.avatar = avatar; // temporal para revisión en consola
    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);


    // Make sure we locate the eyes before blinking
    findEyes();

    // Start blinking every 5 seconds
    setInterval(() => {
      fakeBlink(); // always blink every 5s for now
    }, 5000);


    // Buscar el mesh que tiene 'mouthOpen'
    avatar.traverse((child) => {
      if (
        child.isMesh &&
        child.name === "Wolf3D_Head" && // 👈 solo este
        child.morphTargetDictionary &&
        "mouthOpen" in child.morphTargetDictionary
      ) {
        mouthMesh = child;
        console.log("Found mouth mesh:", mouthMesh.name);
      }
    });

    let head;

    // Buscar el nodo de la cabeza
    let headBone;

    avatar.traverse((child) => {
      if (child.name === "Head") {
        headBone = child;
      }
    });

    console.log("Head bone found:", headBone ? headBone.name : "❌ Not found");

    function headMovement() {
      if (!headBone) return;
      const angle = (Math.random() * 0.3 - 0.15); // -0.15 a +0.15 rad (~±8.5°)
      const duration = 1 + Math.random() * 1.5; // 1 a 2.5 s
      gsap.to(headBone.rotation, {
        y: angle,
        duration: duration,
        ease: "power1.inOut",
        yoyo: true,
        repeat: 1, // ida y vuelta
      });
    }

  function scheduleHeadMovement() {
    const interval = 15000 + Math.random() * 10000;
    setTimeout(() => {
      headMovement();
      scheduleHeadMovement();
    }, interval);
  }

    scheduleHeadMovement(); // ⬅️ Llamar una sola vez después de definirla



  },
  undefined,
  function (error) {
    console.error("Error al cargar el modelo:", error);
  }
);



//  Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0); // <-- punto al que la cámara mira (la cabeza)
controls.update();



//  Animación simple de “hablar”

function moveMouth() {
  if (!mouthMesh) return;
  const mouthIndex = mouthMesh.morphTargetDictionary["mouthOpen"];
  if (mouthIndex === undefined) return;
  mouthMesh.morphTargetInfluences[mouthIndex] = 0.5 + 0.5 * Math.sin(performance.now() * 0.02);
}



// --- Fake Blink animation (scale eyes) ---
let leftEye, rightEye;

function findEyes() {
  avatar.traverse((child) => {
    if (child.name === "EyeLeft") leftEye = child;
    if (child.name === "EyeRight") rightEye = child;
  });
}



function fakeBlink() {
  if (!leftEye || !rightEye) findEyes();
  if (!leftEye || !rightEye) return;

  const duration = 800; // full blink cycle (ms)
  const closeTime = 300; // time to close
  const holdTime = 150;  // eyes stay closed
  const openTime = 350;  // time to open
  const start = performance.now();

  function easeInOut(t) {
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t; // smooth cubic easing
  }

  function animateBlink(now) {
    const elapsed = now - start;
    let scaleY = 1;

    if (elapsed < closeTime) {
      // closing phase
      const t = elapsed / closeTime;
      scaleY = 1 - easeInOut(t) * 0.8;
    } else if (elapsed < closeTime + holdTime) {
      // hold closed
      scaleY = 0.2;
    } else if (elapsed < closeTime + holdTime + openTime) {
      // opening phase
      const t = (elapsed - closeTime - holdTime) / openTime;
      scaleY = 0.2 + easeInOut(t) * 0.8;
    } else {
      // fully open again
      scaleY = 1;
    }

    leftEye.scale.y = scaleY;
    rightEye.scale.y = scaleY;

    if (elapsed < duration) {
      requestAnimationFrame(animateBlink);
    } else {
      leftEye.scale.y = 1;
      rightEye.scale.y = 1;
    }
  }

  requestAnimationFrame(animateBlink);
}





//  Interfaz simple
const input = document.createElement("input");
input.type = "text";
input.placeholder = "Escribe algo para que el avatar hable...";
input.style.position = "absolute";
input.style.bottom = "70px";
input.style.left = "50%";
input.style.transform = "translateX(-50%)";
input.style.padding = "10px";
input.style.width = "60%";
input.style.fontSize = "16px";
input.style.borderRadius = "8px";
input.style.border = "none";
document.body.appendChild(input);

const button = document.createElement("button");
button.textContent = "Hablar";
button.style.position = "absolute";
button.style.bottom = "20px";
button.style.left = "50%";
button.style.transform = "translateX(-50%)";
button.style.padding = "10px 20px";
button.style.fontSize = "16px";
button.style.borderRadius = "8px";
button.style.border = "none";
button.style.cursor = "pointer";
button.style.background = "#ff5c5c";
button.style.color = "#fff";
document.body.appendChild(button);

button.addEventListener("click", async () => {
  const text = input.value.trim();
  if (!text) return;

  const response = await fetch("http://127.0.0.1:5000/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const blob = await response.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  audio.play();

  // Mueve la boca mientras se reproduce
    // Use Web Audio API for realistic mouth movement
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function animateMouth() {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((a, b) => a + b) / dataArray.length / 255;

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

});

//  Loop de renderizado
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

//  Ajuste de ventana
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});