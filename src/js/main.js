import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const INSTANCE_COUNT_LARGE = 700;
const SPAWN_RADIUS = 50;
const HDRI_URL =
  "https://happy358.github.io/Images/HDR/kloofendal_48d_partly_cloudy_puresky_2k.jpg";
const AUDIO_FILE = "/love.mp3";

let scene, camera, renderer, controls;
let instancedMesh, heartGeometry, environmentTexture;
let material;

const backgroundAudio = new Audio(AUDIO_FILE);
backgroundAudio.play().catch(() => {
  console.log("Autoplay bloqueado. Esperando interacción del usuario.");
});
document.body.addEventListener("click", () => backgroundAudio.play(), {
  once: true,
});

const textureLoader = new THREE.TextureLoader();
textureLoader.load(HDRI_URL, (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  environmentTexture = texture;
  initScene();
});

function initScene() {
  scene = new THREE.Scene();
  scene.environment = environmentTexture;
  scene.fog = new THREE.FogExp2(0xf5b1aa, 0.005);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    SPAWN_RADIUS * 3
  );
  camera.position.set(0, 0, SPAWN_RADIUS * Math.SQRT2);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, SPAWN_RADIUS * 2, 0);
  scene.add(directionalLight);

  material = new THREE.MeshPhysicalMaterial({
    color: 0xff0000,
    metalness: 0,
    roughness: 0,
    transmission: 0.8,
    thickness: 2,
    clearcoat: 1,
    clearcoatRoughness: 0,
    ior: 1.5,
    opacity: 0.9,
    transparent: true,
  });

  createHeartGeometry();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 0.1;
  controls.maxDistance = SPAWN_RADIUS * Math.SQRT2;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 0, 0);
  controls.update();

  window.addEventListener("resize", onWindowResize);
  animate();
}

function createHeartGeometry() {
  const x = 0,
    y = 0;
  const heartShape = new THREE.Shape();

  heartShape.moveTo(x, y + 0);
  heartShape.bezierCurveTo(x, y + 3, x - 5, y + 3, x - 5, y + 0); // Lóbulo izquierdo
  heartShape.bezierCurveTo(x - 5, y - 3, x - 2.5, y - 5, x, y - 7); // Pico inferior izquierdo
  heartShape.bezierCurveTo(x + 2.5, y - 5, x + 5, y - 3, x + 5, y + 0); // Pico inferior derecho y lóbulo derecho
  heartShape.bezierCurveTo(x + 5, y + 3, x, y + 3, x, y + 0); // Cierra la forma

  const extrudeSettings = {
    depth: 3,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 3,
    bevelSize: 0.5,
    bevelThickness: 0.5,
  };

  heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  heartGeometry.center();
  heartGeometry.scale(0.15, 0.15, 0.15);

  createInstancedHearts();
}

function createInstancedHearts() {
  const dummyMatrix = new THREE.Matrix4();
  const dummyColor = new THREE.Color();

  instancedMesh = new THREE.InstancedMesh(
    heartGeometry,
    material,
    INSTANCE_COUNT_LARGE
  );
  for (let i = 0; i < INSTANCE_COUNT_LARGE; i++) {
    const transform = generateRandomTransform();
    dummyMatrix.compose(
      transform.position,
      transform.rotation,
      transform.scale
    );
    instancedMesh.setMatrixAt(i, dummyMatrix);
    dummyColor.setHSL(0, 0.8 + Math.random() * 0.2, 0.4 + Math.random() * 0.2);
    instancedMesh.setColorAt(i, dummyColor);
  }
  scene.add(instancedMesh);
}

function generateRandomTransform() {
  const pos = new THREE.Vector3(
    (Math.random() * 2 - 1) * SPAWN_RADIUS,
    (Math.random() * 2 - 1) * SPAWN_RADIUS,
    (Math.random() * 2 - 1) * SPAWN_RADIUS
  );
  const rot = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(Math.random() * 2 * Math.PI, Math.random() * 2 * Math.PI, 0)
  );
  const scale = new THREE.Vector3(1, 1, 1);
  return { position: pos, rotation: rot, scale: scale };
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (instancedMesh) {
    const time = clock.getElapsedTime();
    instancedMesh.rotation.y += 0.003;
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
