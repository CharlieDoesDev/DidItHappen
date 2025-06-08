// src/vfx/meshParticleSystem.js

import * as THREE from "three";

/**
 * Places N particles at random positions on the surface of a mesh.
 * Usage: const mps = new MeshParticleSystem(targetMesh, { count: 1000, color: 0xffcc00, size: 0.12 });
 *        scene.add(mps.points);
 */
export default class MeshParticleSystem {
  constructor(mesh, props = {}) {
    this.mesh = mesh;
    const { color = 0xffcc00, size = 0.12, count = 1 } = props;

    this.color = color;
    this.size = size;
    this.count = count;

    this.points = this._createPoints();
  }

  _createPoints() {
    const geom = this.mesh.geometry.clone();
    geom.computeBoundingBox();
    geom.computeBoundingSphere();

    const posAttr = geom.getAttribute("position");
    const indexAttr = geom.getIndex();

    const positions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      let faceIdx;
      if (indexAttr) {
        // Three indices per face
        faceIdx = Math.floor(Math.random() * (indexAttr.count / 3));
      } else {
        // Three vertices per face
        faceIdx = Math.floor(Math.random() * (posAttr.count / 3));
      }

      let aIdx, bIdx, cIdx;
      if (indexAttr) {
        aIdx = indexAttr.getX(faceIdx * 3);
        bIdx = indexAttr.getX(faceIdx * 3 + 1);
        cIdx = indexAttr.getX(faceIdx * 3 + 2);
      } else {
        aIdx = faceIdx * 3;
        bIdx = faceIdx * 3 + 1;
        cIdx = faceIdx * 3 + 2;
      }

      const a = new THREE.Vector3().fromBufferAttribute(posAttr, aIdx);
      const b = new THREE.Vector3().fromBufferAttribute(posAttr, bIdx);
      const c = new THREE.Vector3().fromBufferAttribute(posAttr, cIdx);

      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;

      const p = new THREE.Vector3()
        .addScaledVector(a, u)
        .addScaledVector(b, v)
        .addScaledVector(c, w);

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    const mat = new THREE.PointsMaterial({
      color: this.color,
      size: this.size,
    });

    return new THREE.Points(particleGeom, mat);
  }
}

/**
 * DustParticleSystem: Ambient dust effect within a box volume.
 * Spawns many small, slow-moving particles randomly distributed in a box volume.
 * Usage:
 *   const dust = new DustParticleSystem(
 *     { min: { x: -2, y: 0.2, z: -2 }, max: { x: 2, y: 2.2, z: 2 } },
 *     { count: 1000, color: 0xffffff, size: 0.04, speed: 0.02 }
 *   );
 *   scene.add(dust.points);
 */
export class DustParticleSystem {
  constructor(volume, props = {}) {
    // volume: { min: {x,y,z}, max: {x,y,z} }
    this.volume = volume;

    const { count = 1000, color = 0xffffff, size = 0.04, speed = 0.02 } = props;

    this.count = count;
    this.color = color;
    this.size = size;
    this.speed = speed;

    this.points = this._createPoints();
    this.velocities = [];
    this._initVelocities();
  }

  _createPoints() {
    const min = this.volume.min;
    const max = this.volume.max;
    const positions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const x = THREE.MathUtils.lerp(min.x, max.x, Math.random());
      const y = THREE.MathUtils.lerp(min.y, max.y, Math.random());
      const z = THREE.MathUtils.lerp(min.z, max.z, Math.random());

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: this.color,
      size: this.size,
      transparent: true,
      opacity: 0.18,
    });

    return new THREE.Points(geom, mat);
  }

  _initVelocities() {
    for (let i = 0; i < this.count; i++) {
      this.velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * this.speed,
          (Math.random() - 0.5) * this.speed,
          (Math.random() - 0.5) * this.speed
        )
      );
    }
  }

  update() {
    const posAttr = this.points.geometry.getAttribute("position");
    const min = this.volume.min;
    const max = this.volume.max;

    for (let i = 0; i < this.count; i++) {
      let x = posAttr.getX(i) + this.velocities[i].x;
      let y = posAttr.getY(i) + this.velocities[i].y;
      let z = posAttr.getZ(i) + this.velocities[i].z;

      // Wrap position inside the volume
      if (x < min.x) x = max.x;
      else if (x > max.x) x = min.x;

      if (y < min.y) y = max.y;
      else if (y > max.y) y = min.y;

      if (z < min.z) z = max.z;
      else if (z > max.z) z = min.z;

      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;
  }
}
