// src/cameraManager.js
import * as THREE from "three";

export class CameraManager {
  constructor(
    camera,
    canvas,
    config,
    getFocusPosition,
    collisionObjects = [],
    collisionRadius = 0.25
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.config = config;
    this.getFocusPosition = getFocusPosition; // function returning THREE.Vector3
    this.collisionObjects = collisionObjects; // array of THREE.Object3D
    this.collisionRadius = collisionRadius; // how close camera can get to obstacles

    // Camera orbit state
    this.yaw = (config.camera.initialYaw || 0) * (Math.PI / 180);
    this.pitch = (config.camera.initialPitch || 0) * (Math.PI / 180);
    this.distance = config.camera.initialDistance || 5;
    this.sensitivity = config.camera.sensitivity || 0.01;
    this.minPitch = (config.camera.minPitch || -30) * (Math.PI / 180);
    this.maxPitch = (config.camera.maxPitch || 30) * (Math.PI / 180);
    this.minDistance = config.camera.minDistance || 2;
    this.maxDistance = config.camera.maxDistance || 20;
    this.lerpAlpha = 0.12;
    this.lerpTarget = new THREE.Vector3();
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.maxYaw =
      (config.camera.maxYaw !== undefined ? config.camera.maxYaw : 360) *
      (Math.PI / 180);
    this.minYaw =
      (config.camera.minYaw !== undefined ? config.camera.minYaw : -360) *
      (Math.PI / 180);
    this.overshootYaw = (config.camera.overshootYaw || 0) * (Math.PI / 180);
    this.overshootPitch = (config.camera.overshootPitch || 0) * (Math.PI / 180);
    this.overshootDecay = 0.15; // How quickly overshoot is corrected (0-1)
    this.overshootYawValue = 0;
    this.overshootPitchValue = 0;

    this._addEventListeners();
  }

  _addEventListeners() {
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.distance += e.deltaY * 0.01;
      this.distance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.distance)
      );
    });
    this.canvas.addEventListener("pointerdown", (e) => {
      // Allow left mouse or touch
      if (
        e.button === 0 ||
        e.pointerType === "touch" ||
        e.pointerType === "pen"
      ) {
        e.preventDefault();
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = "grabbing";
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (this.isDragging) e.preventDefault();
      this.isDragging = false;
      this.canvas.style.cursor = "";
    });
    window.addEventListener("pointermove", (e) => {
      if (this.isDragging) {
        e.preventDefault();
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.yaw -= dx * this.sensitivity;
        this.pitch += dy * this.sensitivity;
        // Clamp yaw and pitch with overshoot
        let minYaw = this.minYaw - this.overshootYaw;
        let maxYaw = this.maxYaw + this.overshootYaw;
        let minPitch = this.minPitch - this.overshootPitch;
        let maxPitch = this.maxPitch + this.overshootPitch;
        // Track overshoot
        if (this.yaw < this.minYaw) {
          this.overshootYawValue = this.yaw - this.minYaw;
        } else if (this.yaw > this.maxYaw) {
          this.overshootYawValue = this.yaw - this.maxYaw;
        } else {
          this.overshootYawValue = 0;
        }
        if (this.pitch < this.minPitch) {
          this.overshootPitchValue = this.pitch - this.minPitch;
        } else if (this.pitch > this.maxPitch) {
          this.overshootPitchValue = this.pitch - this.maxPitch;
        } else {
          this.overshootPitchValue = 0;
        }
        this.yaw = Math.max(minYaw, Math.min(maxYaw, this.yaw));
        this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    });
  }

  update() {
    // Overshoot correction: ease yaw/pitch back to allowed range
    if (this.overshootYawValue !== 0) {
      if (this.yaw < this.minYaw) {
        this.yaw += (this.minYaw - this.yaw) * this.overshootDecay;
        if (Math.abs(this.yaw - this.minYaw) < 0.001) this.yaw = this.minYaw;
      } else if (this.yaw > this.maxYaw) {
        this.yaw += (this.maxYaw - this.yaw) * this.overshootDecay;
        if (Math.abs(this.yaw - this.maxYaw) < 0.001) this.yaw = this.maxYaw;
      }
    }
    if (this.overshootPitchValue !== 0) {
      if (this.pitch < this.minPitch) {
        this.pitch += (this.minPitch - this.pitch) * this.overshootDecay;
        if (Math.abs(this.pitch - this.minPitch) < 0.001)
          this.pitch = this.minPitch;
      } else if (this.pitch > this.maxPitch) {
        this.pitch += (this.maxPitch - this.pitch) * this.overshootDecay;
        if (Math.abs(this.pitch - this.maxPitch) < 0.001)
          this.pitch = this.maxPitch;
      }
    }

    // Focus point
    const focus = this.getFocusPosition();
    // Spherical coordinates
    const tx =
      focus.x + this.distance * Math.cos(this.pitch) * Math.sin(this.yaw);
    const ty = focus.y + this.distance * Math.sin(this.pitch);
    const tz =
      focus.z + this.distance * Math.cos(this.pitch) * Math.cos(this.yaw);
    this.lerpTarget.set(tx, ty, tz);

    // --- Camera collision check ---
    let finalTarget = this.lerpTarget.clone();
    if (this.collisionObjects && this.collisionObjects.length > 0) {
      const raycaster = new THREE.Raycaster();
      const dir = new THREE.Vector3()
        .subVectors(this.lerpTarget, focus)
        .normalize();
      raycaster.set(focus, dir);
      raycaster.far = this.distance;
      const intersects = raycaster.intersectObjects(
        this.collisionObjects,
        true
      );
      if (
        intersects.length > 0 &&
        intersects[0].distance < this.distance - this.collisionRadius
      ) {
        // Place camera just before the collision point
        finalTarget = new THREE.Vector3().addVectors(
          focus,
          dir.multiplyScalar(intersects[0].distance - this.collisionRadius)
        );
      }
    }
    this.camera.position.lerp(finalTarget, this.lerpAlpha);
    this.camera.lookAt(focus.x, focus.y, focus.z);
  }

  updateFocusPosition(newFocusPosition) {
    this.getFocusPosition = () => newFocusPosition;
  }
}
