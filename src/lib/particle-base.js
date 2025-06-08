// lib/particle-base.js
import * as THREE from "three";

/**
 * Base ParticleSystem reads *all* of its config from one `props` object:
 *   - position:       THREE.Vector3 or [x,y,z]
 *   - velocity:       THREE.Vector3 or [x,y,z]
 *   - lifetime:       number
 *   - color:          0xRRGGBB
 *   - size:           number
 *   - particleCount:  number
 *   - …plus any subclass‐specific keys (e.g. `radius`, `height`, etc.)
 */
export class ParticleSystem {
  constructor(props = {}) {
    // 1) Set defaults (unpack any array→Vector3 automatically)
    const {
      position = new THREE.Vector3(0, 0, 0),
      velocity = new THREE.Vector3(0, 1, 0),
      lifetime = 1,
      color = 0xffffff,
      size = 0.05,
      particleCount = 100,
    } = props;

    // If JSON passed an array for position or velocity, convert to Vector3:
    this.position =
      position instanceof THREE.Vector3
        ? position.clone()
        : new THREE.Vector3(...position);
    this.velocity =
      velocity instanceof THREE.Vector3
        ? velocity.clone()
        : new THREE.Vector3(...velocity);

    this.lifetime = lifetime;
    this.color = color;
    this.size = size;
    this.particleCount = particleCount;

    // subEmitter or other keys can live in props; subclasses may read them
    this.props = { ...props };

    // Each ParticleSystem has its own BufferGeometry + PointsMaterial
    this.age = 0;
    this.particles = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: this.size,
      color: this.color,
      transparent: true,
      opacity: 1.0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(this.geometry, this.material);

    // Do not auto‐spawn particles here; subclasses call initParticles()
  }

  // Virtual: subclasses must override this to decide initial spawn positions.
  spawnParticlePosition() {
    // default‐sphere behavior (unused unless a subclass calls super.spawn…)
    const u = Math.random(),
      v = Math.random();
    const theta = 2 * Math.PI * u,
      phi = Math.acos(2 * v - 1),
      r = 0.5 * Math.cbrt(Math.random());
    return new THREE.Vector3(
      this.position.x + r * Math.sin(phi) * Math.cos(theta),
      this.position.y + r * Math.sin(phi) * Math.sin(theta),
      this.position.z + r * Math.cos(phi)
    );
  }

  // Call this once you’ve set up any extra subclass fields (e.g. radius)
  initParticles() {
    this.particles = [];
    const positions = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const pos = this.spawnParticlePosition();
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      this.particles.push({
        position: pos.clone(),
        velocity: this.velocity.clone(),
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

  // Move, respawn, fade out, etc.
  update(dt) {
    const posArr = this.geometry.attributes.position.array;
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age > p.lifetime) {
        // Respawn
        const newPos = this.spawnParticlePosition();
        p.position.copy(newPos);
        p.velocity.copy(this.velocity);
        p.age = 0;
        p.alpha = 1.0;
      }
      // Drift
      p.position.addScaledVector(p.velocity, dt);
      p.alpha = 1.0 - p.age / p.lifetime;

      posArr[i * 3] = p.position.x;
      posArr[i * 3 + 1] = p.position.y;
      posArr[i * 3 + 2] = p.position.z;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }

  // Optionally allow subclasses (or main code) to add/remove from scene:
  addToScene(scene) {
    scene.add(this.points);
  }
  removeFromScene(scene) {
    scene.remove(this.points);
  }
}
