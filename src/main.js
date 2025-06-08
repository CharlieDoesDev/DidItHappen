// main.js
import "./style.css";
import * as THREE from "three";
import { WebGLRenderer } from "three";
import { createBasicScene } from "./lib/scene.js";
import { ParticleSystem } from "./lib/particle-base.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { setupWorld } from "./world.js";
import { CameraManager } from "./cameraManager.js";

// Import each VFX subclass instead of factory functions:
import { ExplosionSystem } from "./vfx/explosion.js";
import { FountainSystem } from "./vfx/fountain.js";
import { FireworkSystem } from "./vfx/firework.js";
import { SmokeSystem } from "./vfx/smoke.js";
import { StarburstSystem } from "./vfx/starburst.js";
import { RingTrailSystem } from "./vfx/ringtrail.js";

import MeshParticleSystem, {
  DustParticleSystem,
} from "./vfx/meshParticleSystem.js";

import sceneConfig from "../public/sceneconfig.json";

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
        fov: 75,
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
      vfx: {
        slideSpacing: 2.5,
        systems: [
          {
            type: "explosion",
            name: "Large Explosion",
            properties: {
              position: [0, 1.0, 0],
              radius: 1,
              size: 1.0,
            },
          },
          {
            type: "explosion",
            name: "Small Explosion",
            properties: {
              position: [0, 1.0, 0],
              radius: 0.2,
              size: 0.01,
            },
          },
        ],
      },
      walls: {
        wall1: {
          position: [-0.75, 1, -2.4],
          size: [4, 3, 0.1],
          color: "#444488",
          rotation: [0, 0, 0],
          castShadow: true,
          receiveShadow: true,
        },
        wall2: {
          position: [-2.7, 1, 0],
          size: [0.1, 4, 6],
          color: "#884444",
          rotation: [0, 0, 0],
          castShadow: true,
          receiveShadow: true,
        },
        wall3: {
          position: [0, 2.5, 0],
          size: [10, 0.1, 10],
          color: "#884444",
          rotation: [0, 0, 0],
          castShadow: true,
          receiveShadow: true,
        },
      },
      sceneParticleSystems: [
        {
          type: "dust",
          volume: {
            min: { x: -2, y: 0.2, z: -2 },
            max: { x: 2, y: 2.2, z: 2 },
          },
          count: 50,
          color: "#ffffff",
          size: 0.01,
          speed: 0.003,
        },
      ],
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

  // 3) Slideshow navigation buttons
  const leftBtn = document.createElement("button");
  leftBtn.textContent = "◀";
  leftBtn.style.cssText =
    "position:absolute;left:20px;top:50%;z-index:20;font-size:2rem;" +
    "background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;" +
    "width:48px;height:48px;transform:translateY(-50%);cursor:pointer;";
  app.appendChild(leftBtn);

  const rightBtn = document.createElement("button");
  rightBtn.textContent = "▶";
  rightBtn.style.cssText =
    "position:absolute;right:20px;top:50%;z-index:20;font-size:2rem;" +
    "background:rgba(0,0,0,0.5);color:white;border:none;border-radius:50%;" +
    "width:48px;height:48px;transform:translateY(-50%);cursor:pointer;";
  app.appendChild(rightBtn);

  // 4) Create canvas and add to page
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

  // 7) Load environment GLB
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

    // Add one DustParticleSystem for room ambience
    let roomMesh = null;
    env.traverse((obj) => {
      if (obj.isMesh && !roomMesh) roomMesh = obj;
    });
    if (roomMesh) {
      const dust = new DustParticleSystem(roomMesh, {
        count: 1200,
        color: 0xffffff,
        size: 0.04,
        speed: 0.003,
      });
      scene.add(dust.points);
      if (!window._dustSystems) window._dustSystems = [];
      window._dustSystems.push(dust);
    }
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

  // ---------------------------------------------------------------------------
  // Build a registry that maps "type" strings → the corresponding class
  // ---------------------------------------------------------------------------
  const VFX_REGISTRY = {
    explosion: ExplosionSystem,
    fountain: FountainSystem,
    firework: FireworkSystem,
    smoke: SmokeSystem,
    starburst: StarburstSystem,
    ringtrail: RingTrailSystem,
    // (add new systems here as needed)
  };

  // ---------------------------------------------------------------------------
  // Instantiate each VFX from sceneConfig.vfx.systems
  // ---------------------------------------------------------------------------
  const vfxSystemsConfig = sceneConfig.vfx?.systems || [];
  const vfxNames = vfxSystemsConfig.map((s) => s.name);
  const particleSystems = vfxSystemsConfig.map((entry) => {
    const Cls = VFX_REGISTRY[entry.type];
    if (!Cls) {
      throw new Error(`Unknown VFX type "${entry.type}" in JSON`);
    }
    // Merge entry.properties into one flat object:
    const props = entry.properties || {};
    // Ensure position is a Vector3 or `[x,y,z]`:
    if (Array.isArray(props.position)) {
      props.position = new THREE.Vector3(...props.position);
    }
    return new Cls(props);
  });

  // 11) Set up captions for each VFX
  const captions = vfxNames.map((name, i) => {
    const caption = document.createElement("div");
    caption.textContent = name;
    caption.style.cssText =
      "position:absolute;left:50%;top:80%;" +
      "transform:translate(-50%,0);z-index:10;font-size:1.5rem;" +
      "color:white;text-shadow:0 2px 8px #000;opacity:0;" +
      "pointer-events:none;transition:opacity 0.3s;display:none;";
    app.appendChild(caption);
    return caption;
  });

  let selectedIndex = Math.floor(particleSystems.length / 2);

  function showOnlySelectedSystem() {
    // Remove all systems from scene
    for (let i = 0; i < particleSystems.length; i++) {
      const sys = particleSystems[i];
      sys.removeFromScene?.(scene) ?? scene.remove(sys.points);
    }
    // Add only the selected one
    const chosen = particleSystems[selectedIndex];
    chosen.addToScene?.(scene) ?? scene.add(chosen.points);

    // Update captions
    captions.forEach((cap, idx) => {
      if (idx === selectedIndex) {
        cap.style.display = "block";
        cap.style.opacity = "1";
      } else {
        cap.style.opacity = "0";
        cap.style.display = "none";
      }
    });
  }

  // Initial display
  showOnlySelectedSystem();

  // 12) Navigation button handlers
  leftBtn.onclick = () => {
    selectedIndex =
      (selectedIndex - 1 + particleSystems.length) % particleSystems.length;
    showOnlySelectedSystem();
  };
  rightBtn.onclick = () => {
    selectedIndex = (selectedIndex + 1) % particleSystems.length;
    showOnlySelectedSystem();
  };
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      selectedIndex =
        (selectedIndex - 1 + particleSystems.length) % particleSystems.length;
      showOnlySelectedSystem();
    } else if (e.key === "ArrowRight") {
      selectedIndex = (selectedIndex + 1) % particleSystems.length;
      showOnlySelectedSystem();
    }
  });

  // 13) Camera manager
  const cameraManager = new CameraManager(
    camera,
    canvas,
    config,
    () => particleSystems[selectedIndex].position,
    collisionObjects,
    0.25 // camera collision radius
  );

  // 14) Add scene-level particle systems (dust volumes, etc.)
  if (config.sceneParticleSystems) {
    for (const psys of config.sceneParticleSystems) {
      if (psys.type === "dust" && psys.volume) {
        const dust = new DustParticleSystem(psys.volume, {
          count: psys.count || 1000,
          color: psys.color || 0xffffff,
          size: psys.size || 0.04,
          speed: psys.speed || 0.003,
        });
        scene.add(dust.points);
        if (!window._dustSystems) window._dustSystems = [];
        window._dustSystems.push(dust);
      }
      // Add more sceneParticleSystems types here if needed
    }
  }

  // 15) Style navigation buttons (remove focus outlines)
  leftBtn.style.outline = "none";
  leftBtn.style.boxShadow = "none";
  rightBtn.style.outline = "none";
  rightBtn.style.boxShadow = "none";

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();

    // Update all VFX systems
    for (const sys of particleSystems) {
      sys.update?.(deltaTime);
    }
    // Update dust systems if any
    if (window._dustSystems) {
      for (const d of window._dustSystems) {
        d.update?.();
      }
    }

    // Optionally, smoothly center the selected system at x=0
    const pos = particleSystems[selectedIndex].position;
    pos.x += (0 - pos.x) * 0.15;

    cameraManager.update();
    renderer.render(scene, camera);
  }

  animate();
}

main();
