// main.js
import "./style.css";
import * as THREE from "three";
import { WebGLRenderer } from "three";
import { createBasicScene } from "./lib/scene.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { setupWorld } from "./world.js";
import { CameraManager } from "./cameraManager.js";

// -----------------------------------------------------------------------------
// Helper: load scene configuration from disk (or fallback to defaults).
// -----------------------------------------------------------------------------
async function loadConfig() {
  try {
    const response = await fetch("/sceneconfig.json");
    return await response.json();
  } catch (error) {
    console.error("Failed to load scene configuration:", error);
    return {
      environment: {
        modelPath: "/models/gaming_room.glb",
        position: [0, 0, 0],
        scale: 0.1,
      },
      camera: {
        height: 3,
        initialYaw: -100,
        initialPitch: -30,
        initialDistance: 5,
        minDistance: 2,
        maxDistance: 20,
        maxPitch: 30,
        minPitch: -30,
        sensitivity: 0.01,
        fov: 90,
      },
      lighting: {
        keyLight: {
          color: "0xffffff",
          intensity: 1.1,
          position: [5, 8, 6],
          castShadow: true,
          shadowMapSize: 2048,
        },
        fillLight: {
          color: "0x88aaff",
          intensity: 0.5,
          position: [-6, 4, 4],
        },
        rimLight: {
          color: "0xffeecc",
          intensity: 0.4,
          position: [0, 6, -8],
        },
        ambient: {
          color: "0xffffff",
          intensity: 0.25,
        },
        shadows: {
          enabled: true,
          shadowMapSize: 2048,
        },
      },
      fog: {
        color: "#222233",
        near: 2,
        far: 4,
      },
    };
  }
}

// -----------------------------------------------------------------------------
// MAIN
// -----------------------------------------------------------------------------
async function main() {
  // 1) Load configuration
  const config = await loadConfig();
  console.log("Loaded scene config:", config);

  // 2) Create and style root container
  const app = document.querySelector("#app");
  app.innerHTML = "";
  app.style.cssText =
    "width:100vw;height:100vh;margin:0;padding:0;overflow:hidden;position:relative;";

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "width:100vw;height:100vh;display:block;position:absolute;top:0;left:0;z-index:1;";
  app.appendChild(canvas);

  // 5) Build basic Three.js scene & camera
  const { scene, camera } = createBasicScene(config);
  setupWorld(scene, config);

  // 6) Collect collision objects (environment walls)
  const collisionObjects = [];
  scene.traverse((obj) => {
    if (obj.isMesh && obj.name.startsWith("wall")) {
      collisionObjects.push(obj);
    }
  });

  // 7) Load environment GLB (Earth)
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(config.environment.modelPath, (gltf) => {
    const env = gltf.scene;
    env.position.set(...config.environment.position);
    env.scale.set(
      config.environment.scale,
      config.environment.scale,
      config.environment.scale
    );
    env.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        collisionObjects.push(obj);
        if (obj.material && obj.material.isMeshBasicMaterial) {
          obj.material = new THREE.MeshStandardMaterial({
            color: obj.material.color,
            map: obj.material.map || null,
          });
        }
      }
    });
    scene.add(env);
  });

  // 8) Set up lighting
  // Key light
  const keyLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.keyLight?.color || "0xffffff"),
    config.lighting?.keyLight?.intensity || 1.1
  );
  keyLight.position.set(...(config.lighting?.keyLight?.position || [5, 8, 6]));
  keyLight.castShadow = config.lighting?.keyLight?.castShadow !== false;
  if (keyLight.castShadow) {
    const shadowRes =
      config.lighting?.keyLight?.shadowMapSize ||
      config.lighting?.shadows?.shadowMapSize ||
      2048;
    keyLight.shadow.mapSize.width = shadowRes;
    keyLight.shadow.mapSize.height = shadowRes;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.normalBias = 0.01;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -10;
    keyLight.shadow.camera.right = 10;
    keyLight.shadow.camera.top = 10;
    keyLight.shadow.camera.bottom = -10;
  }
  scene.add(keyLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.fillLight?.color || "0x88aaff"),
    config.lighting?.fillLight?.intensity || 0.5
  );
  fillLight.position.set(
    ...(config.lighting?.fillLight?.position || [-6, 4, 4])
  );
  scene.add(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(
    parseInt(config.lighting?.rimLight?.color || "0xffeecc"),
    config.lighting?.rimLight?.intensity || 0.4
  );
  rimLight.position.set(...(config.lighting?.rimLight?.position || [0, 6, -8]));
  scene.add(rimLight);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(
    parseInt(config.lighting?.ambient?.color || "0xffffff"),
    config.lighting?.ambient?.intensity || 0.25
  );
  scene.add(ambientLight);

  // 9) Create renderer
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 10) Apply fog if configured
  if (config.fog) {
    scene.fog = new THREE.Fog(
      config.fog.color || 0x222233,
      config.fog.near || 1.5,
      config.fog.far || 7.5
    );
    renderer.setClearColor(config.fog.color || 0x222233);
  }

  // 11) Camera manager
  const cameraManager = new CameraManager(
    camera,
    canvas,
    config,
    () => new THREE.Vector3(0, 0, 0), // Always look at Earth's center
    collisionObjects,
    0.25 // camera collision radius
  );

  // 12) Animation loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    cameraManager.update();
    renderer.render(scene, camera);
  }

  animate();
}

main();
