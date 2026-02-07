// engine3d.js - Three.js 3Dエンジン・共通ユーティリティ

import * as THREE from 'three';

let renderer, canvas, overlay;
let currentScene, currentCamera, animId;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clickables = new Map();

// ===== 初期化 =====
export function initEngine(container) {
  canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  container.appendChild(canvas);

  overlay = document.createElement('div');
  overlay.className = 'ui-overlay';
  container.appendChild(overlay);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  window.addEventListener('resize', onResize);
  canvas.addEventListener('click', onPointerDown);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
}

function onResize() {
  if (!renderer || !currentCamera) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (currentCamera.isPerspectiveCamera) {
    currentCamera.aspect = window.innerWidth / window.innerHeight;
    currentCamera.updateProjectionMatrix();
  }
}

function onPointerDown(e) {
  if (clickables.size === 0) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, currentCamera);
  const keys = [...clickables.keys()];
  const hits = raycaster.intersectObjects(keys, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj) {
      if (clickables.has(obj)) { clickables.get(obj)(hits[0]); return; }
      obj = obj.parent;
    }
  }
}

export function getOverlay() { return overlay; }
export function getCanvas() { return canvas; }
export function getRenderer() { return renderer; }

export function setScene(scene, camera) {
  currentScene = scene;
  currentCamera = camera;
}

export function registerClick(mesh, cb) { clickables.set(mesh, cb); }
export function unregisterClick(mesh) { clickables.delete(mesh); }
export function clearClicks() { clickables.clear(); }

export function startLoop(updateFn) {
  stopLoop();
  function loop() {
    animId = requestAnimationFrame(loop);
    if (updateFn) updateFn();
    if (currentScene && currentCamera) renderer.render(currentScene, currentCamera);
  }
  loop();
}

export function stopLoop() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
}

export function screenToWorld(e, groundY = 0) {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  const y = e.touches ? e.touches[0].clientY : e.clientY;
  pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, currentCamera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, target);
  return target;
}

// ===== シーン作成 =====
export function createScene(bgColor = 0x87ceeb) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bgColor);
  scene.fog = new THREE.Fog(bgColor, 30, 80);
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(10, 20, 10);
  dir.castShadow = true;
  dir.shadow.camera.left = -20; dir.shadow.camera.right = 20;
  dir.shadow.camera.top = 20; dir.shadow.camera.bottom = -20;
  dir.shadow.mapSize.setScalar(1024);
  scene.add(dir);
  return scene;
}

export function createCamera(fov = 60) {
  const cam = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 200);
  return cam;
}

// ===== 地面 =====
export function createGround(size = 40, color = 0x4a7c59) {
  const geo = new THREE.PlaneGeometry(size, size);
  const mat = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

export function createGridGround(size = 40, color1 = 0x3366cc, color2 = 0x2255aa) {
  const geo = new THREE.PlaneGeometry(size, size, size, size);
  const mat = new THREE.MeshLambertMaterial({ color: color1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  // grid
  const grid = new THREE.GridHelper(size, size, color2, color2);
  grid.position.y = 0.01;
  const grp = new THREE.Group();
  grp.add(mesh);
  grp.add(grid);
  return grp;
}

// ===== キャラクタービルダー =====
const M = (c) => new THREE.MeshLambertMaterial({ color: c });

export function createBlockChar(bodyColor, headColor, scale = 1) {
  const g = new THREE.Group();
  // Body
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), M(bodyColor)), { position: new THREE.Vector3(0, 1.1, 0), castShadow: true }));
  // Head
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), M(headColor)), { position: new THREE.Vector3(0, 2.1, 0), castShadow: true }));
  // Eyes
  const eyeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1);
  const eyeMat = M(0x000000);
  g.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), { position: new THREE.Vector3(-0.2, 2.2, 0.41) }));
  g.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), { position: new THREE.Vector3(0.2, 2.2, 0.41) }));
  // Arms
  const armGeo = new THREE.BoxGeometry(0.3, 0.9, 0.3);
  g.add(Object.assign(new THREE.Mesh(armGeo, M(bodyColor)), { position: new THREE.Vector3(-0.65, 1.05, 0), castShadow: true }));
  g.add(Object.assign(new THREE.Mesh(armGeo, M(bodyColor)), { position: new THREE.Vector3(0.65, 1.05, 0), castShadow: true }));
  // Legs
  const legGeo = new THREE.BoxGeometry(0.35, 0.7, 0.35);
  g.add(Object.assign(new THREE.Mesh(legGeo, M(bodyColor)), { position: new THREE.Vector3(-0.2, 0.35, 0), castShadow: true }));
  g.add(Object.assign(new THREE.Mesh(legGeo, M(bodyColor)), { position: new THREE.Vector3(0.2, 0.35, 0), castShadow: true }));
  g.scale.setScalar(scale);
  return g;
}

export function createHikari() {
  return createBlockChar(0xff69b4, 0xffdbac);
}

export function createBrainrot(phase = 0) {
  const colors = [0x8b00ff, 0xcc0044, 0x220022];
  const sizes = [1.2, 1.5, 2.5];
  const g = createBlockChar(colors[phase], 0xff88aa, sizes[phase]);
  // Brain on head
  const brain = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), M(0xff69b4));
  brain.position.y = 2.8 * sizes[phase];
  brain.scale.set(1, 0.6, 1);
  g.add(brain);
  // Italian flag stripe on body
  const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.02), M(0x009246));
  stripe1.position.set(-0.33, 1.1 * sizes[phase], 0.32);
  g.add(stripe1);
  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.02), M(0xce2b37));
  stripe2.position.set(0.33, 1.1 * sizes[phase], 0.32);
  g.add(stripe2);
  if (phase >= 1) {
    // Wings
    const wingGeo = new THREE.BoxGeometry(0.1, 1, 1.5);
    const wingMat = M(0x440066);
    const lw = new THREE.Mesh(wingGeo, wingMat);
    lw.position.set(-0.8, 1.5 * sizes[phase], -0.3);
    lw.rotation.z = 0.3;
    g.add(lw);
    const rw = new THREE.Mesh(wingGeo, wingMat);
    rw.position.set(0.8, 1.5 * sizes[phase], -0.3);
    rw.rotation.z = -0.3;
    g.add(rw);
  }
  return g;
}

export function createGhost(size = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.6 * size, 12, 12),
    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
  );
  body.position.y = 0.8 * size;
  body.castShadow = true;
  g.add(body);
  // Tail
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.5 * size, 0.8 * size, 8),
    new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })
  );
  tail.position.y = 0.2 * size;
  tail.rotation.x = Math.PI;
  g.add(tail);
  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.1 * size, 8, 8);
  const eyeMat = M(0x000000);
  g.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), { position: new THREE.Vector3(-0.2 * size, 0.9 * size, 0.5 * size) }));
  g.add(Object.assign(new THREE.Mesh(eyeGeo, eyeMat), { position: new THREE.Vector3(0.2 * size, 0.9 * size, 0.5 * size) }));
  return g;
}

export function createCoin() {
  const g = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.06, 16),
    new THREE.MeshLambertMaterial({ color: 0xffd700 })
  );
  g.rotation.x = Math.PI / 2;
  g.castShadow = true;
  return g;
}

export function createKnife() {
  const g = new THREE.Group();
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.02), M(0xcccccc));
  blade.position.y = 0.5;
  g.add(blade);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.06), M(0x8B4513));
  handle.position.y = 0.05;
  g.add(handle);
  return g;
}

export function createToilet() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), M(0xffffff));
  base.position.y = 0.25;
  g.add(base);
  const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16), M(0xeeeeee));
  seat.position.y = 0.55;
  g.add(seat);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.25), M(0xffffff));
  tank.position.set(0, 0.6, -0.2);
  g.add(tank);
  g.castShadow = true;
  return g;
}

export function createPoop() {
  const g = new THREE.Group();
  const mat = M(0x8B4513);
  g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), mat), { position: new THREE.Vector3(0, 0.3, 0) }));
  g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), mat), { position: new THREE.Vector3(0, 0.65, 0) }));
  g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mat), { position: new THREE.Vector3(0, 0.9, 0) }));
  return g;
}

export function createBike() {
  const g = new THREE.Group();
  // Frame
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.3), M(0xcc0000)), { position: new THREE.Vector3(0, 0.5, 0) }));
  // Wheels
  const wheelGeo = new THREE.TorusGeometry(0.3, 0.08, 8, 16);
  const wheelMat = M(0x222222);
  g.add(Object.assign(new THREE.Mesh(wheelGeo, wheelMat), { position: new THREE.Vector3(-0.6, 0.3, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0) }));
  g.add(Object.assign(new THREE.Mesh(wheelGeo, wheelMat), { position: new THREE.Vector3(0.6, 0.3, 0), rotation: new THREE.Euler(Math.PI / 2, 0, 0) }));
  // Handlebar
  g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), M(0x666666)), { position: new THREE.Vector3(0.6, 0.8, 0) }));
  return g;
}

export function createDoll(color = 0xee8866) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8), M(color));
  body.position.y = 0.3;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), M(0xffdbac));
  head.position.y = 0.8;
  g.add(head);
  return g;
}

export function createLightOrb() {
  const g = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffff66 })
  );
  const glow = new THREE.PointLight(0xffff66, 0.5, 3);
  g.add(glow);
  return g;
}

export function createTV() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 0.3), M(0x333333));
  body.position.y = 1.5;
  g.add(body);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 0.05), M(0x4488ff));
  screen.position.set(0, 1.5, 0.18);
  g.add(screen);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), M(0x222222));
  stand.position.y = 0.3;
  g.add(stand);
  return g;
}

export function createBuilding(w = 4, h = 6, d = 4, color = 0xcccccc) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color));
  body.position.y = h / 2;
  body.castShadow = true;
  g.add(body);
  // Windows
  const winGeo = new THREE.BoxGeometry(0.5, 0.6, 0.05);
  const winMat = M(0x88ccff);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(-1 + col * 1, 1.5 + row * 1.5, d / 2 + 0.03);
      g.add(win);
    }
  }
  return g;
}

export function createStar(size = 0.3) {
  const g = new THREE.Mesh(
    new THREE.OctahedronGeometry(size),
    new THREE.MeshBasicMaterial({ color: 0xffff00 })
  );
  return g;
}

// ===== テキストスプライト =====
export function createTextSprite(text, { fontSize = 48, color = '#ffffff', bg = 'transparent' } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  // テキスト幅に合わせてキャンバスサイズを動的に決定
  ctx.font = `bold ${fontSize}px sans-serif`;
  const metrics = ctx.measureText(text);
  const w = Math.max(256, Math.ceil(metrics.width) + 40);
  const h = Math.max(64, fontSize + 20);
  c.width = w; c.height = h;
  // キャンバスリサイズ後にフォントを再設定
  ctx.font = `bold ${fontSize}px sans-serif`;
  if (bg !== 'transparent') { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  const aspect = w / h;
  sprite.scale.set(aspect * 2, 2, 1);
  return sprite;
}

// ===== パーティクル =====
export function createParticles(count = 50, color = 0xffff00, size = 0.2) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    velocities.push({ x: (Math.random() - 0.5) * 0.2, y: Math.random() * 0.1 + 0.05, z: (Math.random() - 0.5) * 0.2 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true });
  const points = new THREE.Points(geo, mat);
  points.userData.velocities = velocities;
  return points;
}

export function updateParticles(points) {
  const pos = points.geometry.attributes.position;
  const vels = points.userData.velocities;
  for (let i = 0; i < vels.length; i++) {
    pos.array[i * 3] += vels[i].x;
    pos.array[i * 3 + 1] += vels[i].y;
    pos.array[i * 3 + 2] += vels[i].z;
    if (pos.array[i * 3 + 1] > 10) pos.array[i * 3 + 1] = 0;
  }
  pos.needsUpdate = true;
}

// ===== クリーンアップ =====
export function disposeScene(scene) {
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}

export function cleanupEngine() {
  stopLoop();
  clearClicks();
  window.removeEventListener('resize', onResize);
}

export { THREE };
