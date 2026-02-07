// w2-ghost.js - W2ステージ2: 夜のお化け（3Dポリゴン版）
// 暗い夜の学校でお化けを12体倒すステージ
// ひかりちゃんはマウス/タッチ位置に向かって移動

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW2Ghost(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let t = 0;
  let ghostsDefeated = 0;
  const TOTAL_GHOSTS = 12;
  let stageCompleted = false;

  // ひかりちゃんの位置
  let hikariTarget = new THREE.Vector3(0, 0, 0);

  // === シーン作成（暗闇の夜空） ===
  const scene = E.createScene(0x050510);
  scene.fog = new THREE.Fog(0x050510, 15, 50);
  const camera = E.createCamera(60);
  camera.position.set(0, 15, 18);
  camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);

  // 夜の照明（暗い青のアンビエント、月光）
  scene.children.forEach(c => { if (c.isAmbientLight) c.intensity = 0.15; });
  const moonLight = new THREE.DirectionalLight(0x6666aa, 0.4);
  moonLight.position.set(-5, 20, 10);
  scene.add(moonLight);

  // === 月（黄色い球） ===
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffee88 })
  );
  moon.position.set(-10, 22, -20);
  scene.add(moon);
  // 月のグロー
  const moonGlow = new THREE.PointLight(0xffee66, 0.6, 60);
  moonGlow.position.copy(moon.position);
  scene.add(moonGlow);

  // === 地面（暗い校庭） ===
  const ground = E.createGround(50, 0x1a1a2a);
  scene.add(ground);

  // === 学校の建物（窓が光る） ===
  const schoolBody = new THREE.Mesh(
    new THREE.BoxGeometry(14, 8, 5),
    new THREE.MeshLambertMaterial({ color: 0x222233 })
  );
  schoolBody.position.set(0, 4, -12);
  schoolBody.castShadow = true;
  scene.add(schoolBody);

  // 光る窓
  const glowWindows = [];
  const winMat = new THREE.MeshBasicMaterial({ color: 0xffcc44 });
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const win = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.9, 0.1),
        winMat.clone()
      );
      win.position.set(-4 + col * 2, 2 + row * 2, -9.43);
      win.userData.flickerOffset = Math.random() * Math.PI * 2;
      scene.add(win);
      glowWindows.push(win);
      // 窓の光源
      const winLight = new THREE.PointLight(0xffcc44, 0.15, 5);
      winLight.position.copy(win.position);
      winLight.position.z += 0.5;
      scene.add(winLight);
    }
  }

  // === ひかりちゃん ===
  const hikari = E.createHikari();
  hikari.position.set(0, 0, 5);
  scene.add(hikari);
  // ひかりちゃんの懐中電灯
  const flashlight = new THREE.PointLight(0xffffcc, 0.8, 8);
  flashlight.position.set(0, 2, 0);
  hikari.add(flashlight);

  // === 地面クリックで移動先を設定 ===
  const clickPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickPlane.rotation.x = -Math.PI / 2;
  clickPlane.position.y = 0.01;
  scene.add(clickPlane);

  E.registerClick(clickPlane, (hit) => {
    if (cleaned) return;
    hikariTarget.copy(hit.point);
    hikariTarget.y = 0;
  });

  // === お化け生成（12体） ===
  const ghosts = [];
  for (let i = 0; i < TOTAL_GHOSTS; i++) {
    const ghost = E.createGhost(0.8 + Math.random() * 0.4);
    const angle = (i / TOTAL_GHOSTS) * Math.PI * 2;
    const radius = 6 + Math.random() * 8;
    ghost.position.set(
      Math.cos(angle) * radius,
      1 + Math.random() * 2,
      Math.sin(angle) * radius - 2
    );
    ghost.userData.alive = true;
    ghost.userData.dx = (Math.random() - 0.5) * 0.08;
    ghost.userData.dy = (Math.random() - 0.5) * 0.03;
    ghost.userData.dz = (Math.random() - 0.5) * 0.08;
    ghost.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(ghost);
    ghosts.push(ghost);

    // お化けクリック → 倒す
    E.registerClick(ghost, () => {
      if (cleaned || !ghost.userData.alive || stageCompleted) return;
      ghost.userData.alive = false;
      ghostsDefeated++;
      playSound('hit');
      showMessage(overlay, '一発！💥', 600);
      addCoins(2);
      updateCounter();

      // 倒れアニメ開始
      ghost.userData.defeatTime = t;
      checkComplete();
    });
  }

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // カウンター
  const counterEl = document.createElement('div');
  counterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  counterEl.textContent = `👻 0/${TOTAL_GHOSTS}`;
  overlay.appendChild(counterEl);

  function updateCounter() {
    counterEl.textContent = `👻 ${ghostsDefeated}/${TOTAL_GHOSTS}`;
  }

  // 友達応援テキスト
  const cheerEl = document.createElement('div');
  cheerEl.style.cssText = 'position:absolute;bottom:8%;left:50%;transform:translateX(-50%);font-size:22px;color:#ffcc00;text-shadow:1px 1px 3px #000;z-index:10;animation:pulse 1.5s infinite alternate;';
  cheerEl.textContent = 'がんばれー！📣';
  overlay.appendChild(cheerEl);

  startBGM('w2night');
  showMessage(overlay, d.nightIntro, 2500);
  setTimeout(() => { if (!cleaned) showMessage(overlay, d.ghostTip, 2500); }, 3000);

  // === 当たり判定（お化け→ひかり） ===
  let hitCooldown = 0;

  // === 完了チェック ===
  function checkComplete() {
    if (stageCompleted) return;
    if (ghostsDefeated >= TOTAL_GHOSTS) {
      stageCompleted = true;
      stopBGM();
      showBigMessage(overlay, 'お化け全滅！🎉 次はフライトだ！', 2500);
      playSound('clear');

      // お祝いパーティクル
      const particles = E.createParticles(80, 0xffff00, 0.3);
      scene.add(particles);

      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3000);
    }
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;
    if (hitCooldown > 0) hitCooldown -= 0.016;

    // ひかりちゃん移動（ターゲットに向かって）
    const dx = hikariTarget.x - hikari.position.x;
    const dz = hikariTarget.z - hikari.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.3) {
      const speed = 0.1;
      hikari.position.x += (dx / dist) * speed;
      hikari.position.z += (dz / dist) * speed;
      hikari.rotation.y = Math.atan2(dx, dz);
      // 歩行アニメ
      hikari.position.y = Math.abs(Math.sin(t * 10)) * 0.12;
    } else {
      hikari.position.y = 0;
    }

    // お化けのアニメーション＆AI
    ghosts.forEach(ghost => {
      if (!ghost.userData.alive) {
        // 倒れアニメ（縮小して上に飛んで消える）
        if (ghost.userData.defeatTime !== undefined) {
          const elapsed = t - ghost.userData.defeatTime;
          ghost.position.y += 0.2;
          ghost.rotation.z += 0.15;
          ghost.scale.setScalar(Math.max(0, 1 - elapsed * 2));
          if (elapsed > 0.7) {
            scene.remove(ghost);
            ghost.userData.defeatTime = undefined;
          }
        }
        return;
      }

      // ランダム移動
      ghost.position.x += ghost.userData.dx;
      ghost.position.y += ghost.userData.dy;
      ghost.position.z += ghost.userData.dz;

      // 浮遊感
      ghost.position.y += Math.sin(t * 2 + ghost.userData.bobOffset) * 0.005;

      // 範囲制限＆反発
      if (ghost.position.x < -18 || ghost.position.x > 18) ghost.userData.dx *= -1;
      if (ghost.position.y < 0.5 || ghost.position.y > 5) ghost.userData.dy *= -1;
      if (ghost.position.z < -8 || ghost.position.z > 12) ghost.userData.dz *= -1;

      // たまに方向転換
      if (Math.random() < 0.008) ghost.userData.dx = (Math.random() - 0.5) * 0.08;
      if (Math.random() < 0.008) ghost.userData.dy = (Math.random() - 0.5) * 0.03;
      if (Math.random() < 0.008) ghost.userData.dz = (Math.random() - 0.5) * 0.08;

      // ゆらゆら回転
      ghost.rotation.y = Math.sin(t * 1.5 + ghost.userData.bobOffset) * 0.5;

      // ひかりちゃんとの当たり判定
      const gdx = ghost.position.x - hikari.position.x;
      const gdz = ghost.position.z - hikari.position.z;
      const gdy = ghost.position.y - hikari.position.y;
      const gDist = Math.sqrt(gdx * gdx + gdz * gdz + gdy * gdy);
      if (gDist < 1.8 && hitCooldown <= 0) {
        showMessage(overlay, '😱つかまった！', 1000);
        playSound('ghost');
        // ひかりちゃんリセット
        hikari.position.set(0, 0, 5);
        hikariTarget.set(0, 0, 5);
        hitCooldown = 1.5; // クールダウン1.5秒
      }
    });

    // 窓のちらつき
    glowWindows.forEach(win => {
      const flicker = 0.6 + Math.sin(t * 3 + win.userData.flickerOffset) * 0.4;
      win.material.opacity = flicker;
      win.material.transparent = true;
    });

    // 月のゆっくり回転
    moon.position.x = -10 + Math.sin(t * 0.1) * 2;

    // カメラの軽い追従
    camera.position.x += (hikari.position.x * 0.3 - camera.position.x) * 0.02;
    camera.lookAt(hikari.position.x * 0.3, 2, hikari.position.z * 0.2);
  });

  // === クリーンアップ ===
  function cleanup() {
    cleaned = true;
    stopBGM();
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }

  return { cleanup };
}
