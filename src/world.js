// src/world.js
import * as THREE from "three";

/**
 * Adds world objects (walls, etc) to the scene based on config.
 * @param {THREE.Scene} scene
 * @param {object} config
 */
export function setupWorld(scene, config) {
  if (config.walls) {
    Object.entries(config.walls).forEach(([name, wallCfg]) => {
      const geometry = new THREE.BoxGeometry(...(wallCfg.size || [1, 2, 0.1]));
      const material = new THREE.MeshStandardMaterial({
        color: wallCfg.color || 0x888888,
        metalness: 0.1,
        roughness: 0.8,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...(wallCfg.position || [0, 1, 0]));
      mesh.rotation.set(
        ...(wallCfg.rotation
          ? wallCfg.rotation.map((deg) => (deg * Math.PI) / 180)
          : [0, 0, 0])
      );
      mesh.castShadow = !!wallCfg.castShadow;
      mesh.receiveShadow = !!wallCfg.receiveShadow;
      mesh.name = name;
      scene.add(mesh);
    });
  }
}
