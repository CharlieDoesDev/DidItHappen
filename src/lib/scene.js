import * as THREE from "three";

export function createBasicScene(config) {
  const fov = config?.camera?.fov;
  if (fov === undefined) {
    console.error(
      "Camera FOV not defined in config, please add it to sceneconfig.json"
    );
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // Camera position will be set in main.js based on config
  camera.lookAt(0, 0, 0); // Look at center

  // Add a soft ambient light so particles are visible
  const ambientLight = new THREE.AmbientLight(0x404040, 1);
  scene.add(ambientLight);

  return { scene, camera };
}

export function createCube(scene) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.1,
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  return cube;
}
