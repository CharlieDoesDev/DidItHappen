// vfx/ringtrail.js

import { ParticleSystem } from "../lib/particle-base.js";
import * as THREE from "three";

export class RingTrailSystem extends ParticleSystem {
  constructor(props = {}) {
    // Destructure props with defaults
    const {
      position = [0, 0, 0],
      color = 0xffffff,
      size = 0.15,
      trailLength = 30,
      particleCount = 10,
    } = props;

    // Pass common parameters into ParticleSystem
    super({
      position,
      color,
      size,
      particleCount,
      // velocity and lifetime are unused here, so defaults in ParticleSystem apply
    });

    // Store ring-specific properties
    this.trailLength = trailLength;

    // Prepare per-particle trails
    this.trails = Array.from({ length: this.particleCount }, () => []);
    this.trailGeometry = Array.from(
      { length: this.particleCount },
      () => new THREE.BufferGeometry()
    );
    this.trailLines = Array.from({ length: this.particleCount }, (_, i) => {
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.Line(this.trailGeometry[i], mat);
      line.frustumCulled = false;
      return line;
    });

    // Initialize particles now that everything is set up
    this.initParticles();
  }

  // Override initParticles to place each particle on the ring
  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.spawnParticlePosition(i);
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      this.particles.push({
        position: pos.clone(),
        angle: (i / this.particleCount) * Math.PI * 2,
        speed: 1.2,
        age: 0,
      });
      this.trails[i] = [pos.clone()];
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
  }

  // Compute initial position on a circle of radius 1.2
  spawnParticlePosition(i = 0) {
    const angle = (i / this.particleCount) * Math.PI * 2;
    const radius = 1.2;
    return new THREE.Vector3(
      this.position.x + Math.cos(angle) * radius,
      this.position.y,
      this.position.z + Math.sin(angle) * radius
    );
  }

  update(dt) {
    const positions = this.geometry.attributes.position.array;

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];

      // Advance around the ring
      p.angle += p.speed * dt * 0.5;
      const radius = 1.2;
      p.position.set(
        this.position.x + Math.cos(p.angle) * radius,
        this.position.y,
        this.position.z + Math.sin(p.angle) * radius
      );

      // Update point positions
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;

      // Record trail
      this.trails[i].push(p.position.clone());
      if (this.trails[i].length > this.trailLength) {
        this.trails[i].shift();
      }

      // Update trail geometry
      const trailPos = new Float32Array(this.trails[i].length * 3);
      for (let j = 0; j < this.trails[i].length; j++) {
        trailPos[j * 3] = this.trails[i][j].x;
        trailPos[j * 3 + 1] = this.trails[i][j].y;
        trailPos[j * 3 + 2] = this.trails[i][j].z;
      }
      this.trailGeometry[i].setAttribute(
        "position",
        new THREE.BufferAttribute(trailPos, 3)
      );
      this.trailGeometry[i].setDrawRange(0, this.trails[i].length);
      this.trailGeometry[i].attributes.position.needsUpdate = true;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  addToScene(scene) {
    scene.add(this.points);
    for (const line of this.trailLines) {
      scene.add(line);
    }
  }

  removeFromScene(scene) {
    scene.remove(this.points);
    for (const line of this.trailLines) {
      scene.remove(line);
    }
  }
}
