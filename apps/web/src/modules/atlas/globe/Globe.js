import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const GLOBE_CONFIG = {
  radius: 5,
  segments: 64,
  startingPosition: { lat: 31.5, lng: 35.2 },
};

export default class Globe {
  constructor(container) {
    this.container = container;
    this.disposed = false;
    this.scene = new THREE.Scene();

    this._createCamera();
    this._createRenderer();
    this._createLights();
    this._createGlobe();
    this._createStars();
    this._setupControls();

    this.markerGroup = new THREE.Group();
    this.scene.add(this.markerGroup);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clickables = [];
    this.hoverables = [];

    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    this._animate = this._animate.bind(this);
    this._animationId = requestAnimationFrame(this._animate);
  }

  _createCamera() {
    const aspect =
      this.container.clientWidth / Math.max(this.container.clientHeight, 1);
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 2, 14);
  }

  _createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);
  }

  _createLights() {
    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));

    const sun = new THREE.DirectionalLight(0xffffff, 1.8);
    sun.position.set(10, 10, 10);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-10, -5, -10);
    this.scene.add(fill);
  }

  _createGlobe() {
    const geometry = new THREE.SphereGeometry(
      GLOBE_CONFIG.radius,
      GLOBE_CONFIG.segments,
      GLOBE_CONFIG.segments
    );

    const loader = new THREE.TextureLoader();
    const textureUrl =
      'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

    const material = new THREE.MeshPhongMaterial({
      map: loader.load(textureUrl),
      specular: new THREE.Color(0x222244),
      shininess: 15,
    });

    this.globeMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.globeMesh);

    const glowGeo = new THREE.SphereGeometry(
      GLOBE_CONFIG.radius * 1.008,
      32,
      32
    );
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.glow);

    const atmosGeo = new THREE.SphereGeometry(
      GLOBE_CONFIG.radius * 1.015,
      48,
      48
    );
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    this.atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
    this.scene.add(this.atmosphere);
  }

  _createStars() {
    const starsGeo = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      const r = 80 + Math.random() * 120;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.15,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(starsGeo, starsMat);
    this.scene.add(this.stars);
  }

  _setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 25;
    this.controls.enablePan = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
  }

  _resize() {
    if (this.disposed || !this.container.isConnected) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    if (this.disposed) return;
    this._animationId = requestAnimationFrame(this._animate);
    this.controls.update();
    this.glow.rotation.y += 0.0002;
    this.renderer.render(this.scene, this.camera);
  }

  latLngToPosition(lat, lng, radius = GLOBE_CONFIG.radius) {
    const phi = ((90 - lat) * Math.PI) / 180;
    const theta = ((lng + 180) * Math.PI) / 180;
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  latLngToScreen(lat, lng) {
    const pos = this.latLngToPosition(lat, lng);
    const vec = pos.clone().project(this.camera);
    return {
      x: (vec.x * 0.5 + 0.5) * this.container.clientWidth,
      y: (-vec.y * 0.5 + 0.5) * this.container.clientHeight,
      behindCamera: vec.z > 1,
    };
  }

  addToScene(obj) {
    this.markerGroup.add(obj);
  }

  clearMarkers() {
    while (this.markerGroup.children.length) {
      const child = this.markerGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      this.markerGroup.remove(child);
    }
    this.clickables = [];
    this.hoverables = [];
  }

  flyTo(lat, lng, distance = 8.5) {
    const pos = this.latLngToPosition(lat, lng, distance);
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endTarget = this.latLngToPosition(lat, lng, 0);
    const duration = 1000;
    const startTime = Date.now();

    this.controls.autoRotate = false;

    const animate = () => {
      if (this.disposed) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, pos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.camera.updateProjectionMatrix();
      this.controls.update();

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();
  }

  resetView() {
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const endPos = new THREE.Vector3(0, 2, 14);
    const endTarget = new THREE.Vector3(0, 0, 0);
    const duration = 800;
    const startTime = Date.now();

    this.controls.autoRotate = false;

    const animate = () => {
      if (this.disposed) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.controls.target.lerpVectors(startTarget, endTarget, ease);
      this.camera.updateProjectionMatrix();
      this.controls.update();

      if (t < 1) requestAnimationFrame(animate);
      else this.controls.autoRotate = true;
    };
    animate();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this._animationId);
    window.removeEventListener('resize', this._onResize);
    this.controls.dispose();
    this.clearMarkers();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
