// vfx/firework.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class FireworkSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure with defaults
    const {
      position = [0, 0, 0],
      color = 0xffffff,
      size = 0.12,
      lifetime = 1.2,
      velocity = new THREE.Vector3(0, 2.5, 0),
      particleCount = 120,
    } = props;

    // Pass common parameters into ParticleSystem constructor
    super({
      position,
      velocity,
      lifetime,
      color,
      size,
      particleCount,
    });

    // Now initialize particles
    this.initParticles();
  }

  spawnParticlePosition() {
    // Firework: all particles start from the same origin
    return this.position.clone();
  }
}
