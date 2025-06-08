import "./style.css";
import { WebGLRenderer } from "three";
import { createBasicScene } from "./lib/scene.js";
import { ParticleSystem } from "./lib/particle-base.js";
import * as THREE from "three";
import createFireworkVFX from "./vfx/firework.js";
import createExplosionVFX from "./vfx/explosion.js";
import createFountainVFX from "./vfx/fountain.js";
import createSmokeVFX from "./vfx/smoke.js";
import createStarburstVFX from "./vfx/starburst.js";
import createRingTrailVFX from "./vfx/ringtrail.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createFovIndicator, updateFovIndicator, createHeightIndicator, updateHeightIndicator } from "./lib/ui-utils.js";
import { createHelpOverlay } from "./lib/help-overlay.js";

// Load scene configuration
async function loadConfig() {
  try {
    const response = await fetch("/sceneconfig.json");
    return await response.json();
  } catch (error) {
    console.error("Failed to load scene configuration:", error);

  console.log("Creating cube...");
  const mesh = createCube(scene);
  console.log("Cube created.");

  console.log("Setting up renderer...");
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  console.log("Renderer setup complete.");

  // Create the default particle system
  console.log("Creating default particle system...");
  const defaultParticles = new ParticleSystem({
    scene,
    sourceMesh: mesh,
    particleCount: 200,
    color: { r: 1.0, g: 0.3, b: 0.0 }, // Orange
    size: 0.05,
    minLifetime: 0.1,
    maxLifetime: 0.4,
    velocityFactor: 1.0,
    drag: 0.97,
    useWorldSpace: true,
    blending: THREE.AdditiveBlending,
  });

  // Create a second particle system with different settings
  console.log("Creating blue particle system...");
  const blueParticles = new ParticleSystem({
    scene,
    sourceMesh: mesh,
    particleCount: 100,
    color: { r: 0.0, g: 0.5, b: 1.0 }, // Blue
    size: 0.03,
    minLifetime: 0.2,
    maxLifetime: 0.6,
    velocityFactor: 0.5, // Slower movement
    drag: 0.99, // Less drag
    useWorldSpace: true,
    blending: THREE.AdditiveBlending,
  });

  // Offset the blue particles slightly to make them visible separately
  const bluePositions = blueParticles.geometry.attributes.position.array;
  for (let i = 0; i < blueParticles.particleCount * 3; i += 3) {
    bluePositions[i] += 0.1; // Offset in X direction
  }
  blueParticles.geometry.attributes.position.needsUpdate = true;

  const clock = new THREE.Clock();
  let elapsedTime = 0;

  console.log("Starting animation loop...");
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    elapsedTime += delta;

    // Animate the cube
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.01;
    mesh.scale.setScalar(1 + 0.2 * Math.sin(elapsedTime * 2));

    // Update both particle systems
    defaultParticles.update(delta);
    blueParticles.update(delta);

    // Example of dynamically changing particle settings
    if (elapsedTime % 5 < delta) {
      // Every 5 seconds, change particle color
      const hue = (elapsedTime / 5) % 1;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);

      defaultParticles.setOptions({
        color: { r: color.r, g: color.g, b: color.b },
        velocityFactor: 0.5 + Math.sin(elapsedTime * 0.1) * 0.5,
      });

      console.log(`Changed particle color to hue: ${hue.toFixed(2)}`);
    }

    renderer.render(scene, camera);
  }
  animate();
  console.log("Animation loop started.");

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Example of keyboard controls to change particle settings
  window.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "1":
        // Increase particle size
        defaultParticles.setOptions({
          size: defaultParticles.options.size * 1.2,
        });
        console.log(
          `Particle size: ${defaultParticles.options.size.toFixed(3)}`
        );
        break;
      case "2":
        // Decrease particle size
        defaultParticles.setOptions({
          size: defaultParticles.options.size / 1.2,
        });
        console.log(
          `Particle size: ${defaultParticles.options.size.toFixed(3)}`
        );
        break;
      case "3":
        // Increase velocity
        defaultParticles.setOptions({
          velocityFactor: defaultParticles.options.velocityFactor * 1.2,
        });
        console.log(
          `Velocity factor: ${defaultParticles.options.velocityFactor.toFixed(
            2
          )}`
        );
        break;
      case "4":
        // Decrease velocity
        defaultParticles.setOptions({
          velocityFactor: defaultParticles.options.velocityFactor / 1.2,
        });
        console.log(
          `Velocity factor: ${defaultParticles.options.velocityFactor.toFixed(
            2
          )}`
        );
        break;
      case "r":
        // Red particles
        defaultParticles.setOptions({ color: { r: 1.0, g: 0.2, b: 0.2 } });
        break;
      case "g":
        // Green particles
        defaultParticles.setOptions({ color: { r: 0.2, g: 1.0, b: 0.2 } });
        break;
      case "b":
        // Blue particles
        defaultParticles.setOptions({ color: { r: 0.2, g: 0.2, b: 1.0 } });
        break;
    }
  });
}

main();
