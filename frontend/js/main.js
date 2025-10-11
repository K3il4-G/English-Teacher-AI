alert("main.js correcto cargado ");

import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";


//  Escena básica
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaaaaaa);
// scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 3);

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
loader.load(
  "./models/avatar.glb",
  function (gltf) {
    avatar = gltf.scene;
    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);
  },
  undefined,
  function (error) {
    console.error("Error al cargar el modelo:", error);
  }
);

//  Controles de cámara
const controls = new OrbitControls(camera, renderer.domElement);

//  Animación simple de “hablar”
let mouthMovement = 0;
function moveMouth() {
  if (!avatar) return;
  mouthMovement = (mouthMovement + 0.1) % Math.PI;
  avatar.position.y = 0.05 * Math.sin(mouthMovement); // leve movimiento para simular hablar
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
  const mouthInterval = setInterval(moveMouth, 50);
  audio.onended = () => clearInterval(mouthInterval);
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
