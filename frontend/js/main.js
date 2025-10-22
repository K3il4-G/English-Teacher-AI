import * as THREE from "./libs/three.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { GLTFLoader } from "./libs/GLTFLoader.js";


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
    avatar = gltf.scene;
    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);

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
