// vfx/fountain.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class FountainSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure with defaults
    const {
      position = [0, 0, 0],
      height = 2.5,
      color = 0x66ccff,
      size = 0.09,
      lifetime = 1.5,
      velocity = new THREE.Vector3(0, height, 0),
      particleCount = 100,
    } = props;

    // Pass common parameters into ParticleSystem constructor
    super({
      position,
      velocity,
      lifetime,
      color,
      size,
      particleCount,
      // Store height in props for reference if needed
      height,
    });

    // Store fountain‐specific height
    this.height = height;

    // Initialize all particles
    this.initParticles();
  }

  spawnParticlePosition() {
    // Spawn at base of fountain, with some horizontal spread
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.2;
    return new THREE.Vector3(
      this.position.x + Math.cos(angle) * radius,
      this.position.y,
      this.position.z + Math.sin(angle) * radius
    );
  }
}
