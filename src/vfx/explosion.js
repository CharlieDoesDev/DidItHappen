// vfx/explosion.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class ExplosionSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure props with defaults
    const {
      radius = 0.3,
      color = 0xff6600,
      lifetime = 1.0,
      speed = 2.5, // base speed for outward burst
      particleCount = 80,
      size = 0.15,
      position = [0, 0, 0],
    } = props;

    // Pass common parameters into ParticleSystem
    super({
      position,
      // velocity is ignored here; we'll assign per‐particle velocities in initParticles
      lifetime,
      color,
      size,
      particleCount,
      radius,
      speed,
    });

    this.radius = radius;
    this.speed = speed;

    // Initialize all particles with individual velocities
    this.initParticles();
  }

  // Override initParticles to assign each particle a random outward velocity
  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      // Pick a random direction on unit sphere
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      // Position: random point within sphere of radius this.radius
      const r = this.radius * Math.cbrt(Math.random());
      const x = this.position.x + r * Math.sin(phi) * Math.cos(theta);
      const y = this.position.y + r * Math.sin(phi) * Math.sin(theta);
      const z = this.position.z + r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Velocity: direction vector normalized * base speed * random variation
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
      ).normalize();

      // Give each particle a random speed between 0.8× and 1.2× of base speed
      const speedVariation = this.speed * (0.8 + 0.4 * Math.random());
      const velocity = dir.multiplyScalar(speedVariation);

      this.particles.push({
        position: new THREE.Vector3(x, y, z),
        velocity,
        lifetime: this.lifetime,
        age: 0,
        alpha: 1.0,
      });
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
  }

  update(dt) {
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age > p.lifetime) {
        // Respawn: pick a new random direction and reinitialize
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = this.radius * Math.cbrt(Math.random());

        const x = this.position.x + r * Math.sin(phi) * Math.cos(theta);
        const y = this.position.y + r * Math.sin(phi) * Math.sin(theta);
        const z = this.position.z + r * Math.cos(phi);

        p.position.set(x, y, z);
        p.age = 0;
        p.alpha = 1.0;

        // Recompute velocity
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ).normalize();
        const speedVariation = this.speed * (0.8 + 0.4 * Math.random());
        p.velocity.copy(dir.multiplyScalar(speedVariation));
      }

      // Move outward by per‐particle velocity
      p.position.addScaledVector(p.velocity, dt);

      // Fade out over lifetime
      p.alpha = 1.0 - p.age / p.lifetime;

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}
