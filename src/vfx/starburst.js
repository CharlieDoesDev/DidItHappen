// vfx/starburst.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class StarburstSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure with defaults
    const {
      position = [0, 0, 0],
      color = 0xffff66,
      size = 0.13,
      lifetime = 1.0,
      velocity = new THREE.Vector3(0, 0.5, 0),
      particleCount = 40,
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
    // Starburst: spawn all particles at the same origin
    return this.position.clone();
  }
}
