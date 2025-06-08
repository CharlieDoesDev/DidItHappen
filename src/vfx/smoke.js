// vfx/smoke.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class SmokeSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure with defaults
    const {
      position = [0, 0, 0],
      color = 0x888888,
      size = 0.18,
      lifetime = 2.0,
      // Base velocity is unused when randomizing direction/speed
      velocity = new THREE.Vector3(0, 0.1, 0),
      particleCount = 60,
      // New properties:
      spawnRadius = 0.25, // radius for disk or sphere spawn
      spawnInSphere = false, // false → spawn in disk at base; true → spawn within sphere
      minSpeed = 0.1, // minimum random speed per particle
      maxSpeed = 0.5, // maximum random speed per particle
      directionRandom = true, // if true, assign random direction; if false, use `velocity` vector
    } = props;

    // Store additional props on `this` so spawn/update can use them:
    super({
      position,
      lifetime,
      color,
      size,
      particleCount,
      // We still pass velocity, but it will be overridden per-particle if directionRandom is true
      velocity,
    });

    this.spawnRadius = spawnRadius;
    this.spawnInSphere = spawnInSphere;
    this.minSpeed = minSpeed;
    this.maxSpeed = maxSpeed;
    this.directionRandom = directionRandom;
    // Keep a reference to baseVelocity if directionRandom is false
    this.baseVelocity = velocity.clone();

    // Initialize all particles with randomized positions & velocities
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      // Determine spawn position:
      let spawnPos;
      if (this.spawnInSphere) {
        // Random point inside sphere of radius this.spawnRadius
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = this.spawnRadius * Math.cbrt(Math.random());
        spawnPos = new THREE.Vector3(
          this.position.x + r * Math.sin(phi) * Math.cos(theta),
          this.position.y + r * Math.sin(phi) * Math.sin(theta),
          this.position.z + r * Math.cos(phi)
        );
      } else {
        // Random point in disk of radius this.spawnRadius at base (y = this.position.y)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.spawnRadius;
        spawnPos = new THREE.Vector3(
          this.position.x + Math.cos(angle) * radius,
          this.position.y,
          this.position.z + Math.sin(angle) * radius
        );
      }

      positions[i * 3] = spawnPos.x;
      positions[i * 3 + 1] = spawnPos.y;
      positions[i * 3 + 2] = spawnPos.z;

      // Determine per-particle velocity:
      let vel;
      if (this.directionRandom) {
        // Random direction on unit sphere
        const dir = new THREE.Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ).normalize();
        // Random speed between minSpeed and maxSpeed
        const speed =
          this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
        vel = dir.multiplyScalar(speed);
      } else {
        // Use the baseVelocity passed in props
        vel = this.baseVelocity.clone();
      }

      this.particles.push({
        position: spawnPos.clone(),
        velocity: vel,
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

  spawnParticlePosition() {
    // Called when re-spawning after lifetime; pick new random position as above
    if (this.spawnInSphere) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = this.spawnRadius * Math.cbrt(Math.random());
      return new THREE.Vector3(
        this.position.x + r * Math.sin(phi) * Math.cos(theta),
        this.position.y + r * Math.sin(phi) * Math.sin(theta),
        this.position.z + r * Math.cos(phi)
      );
    } else {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * this.spawnRadius;
      return new THREE.Vector3(
        this.position.x + Math.cos(angle) * radius,
        this.position.y,
        this.position.z + Math.sin(angle) * radius
      );
    }
  }

  update(dt) {
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      p.age += dt;

      if (p.age > p.lifetime) {
        // Respawn particle: assign new position & velocity
        const newPos = this.spawnParticlePosition();
        p.position.copy(newPos);
        p.age = 0;
        p.alpha = 1.0;

        if (this.directionRandom) {
          const dir = new THREE.Vector3(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1
          ).normalize();
          const speed =
            this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);
          p.velocity.copy(dir.multiplyScalar(speed));
        } else {
          p.velocity.copy(this.baseVelocity);
        }
      }

      // Move each particle by its velocity
      p.position.addScaledVector(p.velocity, dt);

      // Fade out over its lifetime
      p.alpha = 1.0 - p.age / p.lifetime;

      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}
