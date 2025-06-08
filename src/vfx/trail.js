// vfx/trail.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class TrailSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure with defaults
    const {
      position = [0, 0, 0],
      color = 0x00ccff,
      size = 0.09,
      lifetime = 1.2,
      velocity = new THREE.Vector3(0, 1.5, 0),
      particleCount = 80,
    } = props;

    // Pass common parameters into ParticleSystem
    super({
      position,
      velocity,
      lifetime,
      color,
      size,
      particleCount,
    });

    // Initialize all particles
    this.initParticles();
  }

  spawnParticlePosition() {
    // Trail: spawn all particles at the same origin
    return this.position.clone();
  }
}
