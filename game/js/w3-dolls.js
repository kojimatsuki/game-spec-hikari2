// w3-dolls.js - W3ステージ1: 人形食べ＆光集め（3Dポリゴン版）
// 暗い3Dシーンで人形をクリック→光を集めて魔法使いに覚醒

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import { setForm } from './hikari.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW3Dolls(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false;
  let t = 0;
  let lightsCollected = 0;
  const LIGHT_TARGET = 50;
  let magicAwakened = false;

  // === シーン作成（暗闇、徐々に明るくなる） ===
  const scene = E.createScene(0x0a0a1a);
  scene.fog = new THREE.Fog(0x0a0a1a, 15, 50);
  const camera = E.createCamera(60);
  camera.position.set(0, 14, 18);
  camera.lookAt(0, 1, 0);
  E.setScene(scene, camera);

  // アンビエントライト（最初は暗い、光を集めると明るくなる）
  let ambLight = null;
  scene.children.forEach(c => {
    if (c.isAmbientLight) { c.intensity = 0.08; ambLight = c; }
  });
  // ディレクショナルライトも暗く
  scene.children.forEach(c => {
    if (c.isDirectionalLight) c.intensity = 0.15;
  });

  // 紫のポイントライト（魔法的雰囲気）
  const magicLight = new THREE.PointLight(0x9944ff, 0.4, 30);
  magicLight.position.set(0, 8, 0);
  scene.add(magicLight);

  // === 地面（暗い紫の草原） ===
  const ground = E.createGround(50, 0x1a0a2a);
  scene.add(ground);

  // === 人形を25体配置 ===
  const dollColors = [0xee8866, 0xff6699, 0x66ccff, 0xaaff66, 0xffcc33];
  const dolls = [];

  function spawnDoll() {
    const color = dollColors[Math.floor(Math.random() * dollColors.length)];
    const doll = E.createDoll(color);
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 14;
    doll.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    doll.userData.alive = true;
    doll.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(doll);
    dolls.push(doll);

    // 人形クリック → 食べる → 光の玉を出す
    E.registerClick(doll, () => {
      if (cleaned || !doll.userData.alive || magicAwakened) return;
      doll.userData.alive = false;
      doll.userData.eatTime = t;
      playSound('eat');
      showMessage(overlay, 'パクッ！', 500);

      // 2-3個の光の玉を出す
      const count = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < count; j++) {
        spawnLightOrb(doll.position.x, doll.position.z);
      }
    });
  }

  for (let i = 0; i < 25; i++) spawnDoll();

  // === 光の玉 ===
  const lightOrbs = [];

  function spawnLightOrb(x, z) {
    const orb = E.createLightOrb();
    orb.position.set(
      x + (Math.random() - 0.5) * 4,
      1 + Math.random() * 2,
      z + (Math.random() - 0.5) * 4
    );
    orb.userData.alive = true;
    orb.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(orb);
    lightOrbs.push(orb);

    // 光の玉クリック → 収集
    E.registerClick(orb, () => {
      if (cleaned || !orb.userData.alive || magicAwakened) return;
      orb.userData.alive = false;
      orb.userData.collectTime = t;
      lightsCollected++;
      playSound('coin');
      addCoins(1);
      counterEl.textContent = `✨ ${lightsCollected}/${LIGHT_TARGET}`;

      // 明るさ更新
      updateBrightness();

      if (lightsCollected >= LIGHT_TARGET) {
        awakenMagic();
      }
    });
  }

  // === 明るさ更新 ===
  function updateBrightness() {
    const ratio = lightsCollected / LIGHT_TARGET;
    if (ambLight) ambLight.intensity = 0.08 + ratio * 0.52;
    scene.children.forEach(c => {
      if (c.isDirectionalLight) c.intensity = 0.15 + ratio * 0.65;
    });
    // 背景色も徐々に明るく
    const r = Math.floor(10 + ratio * 80);
    const g = Math.floor(10 + ratio * 60);
    const b = Math.floor(26 + ratio * 120);
    const bg = new THREE.Color(`rgb(${r},${g},${b})`);
    scene.background = bg;
    scene.fog.color = bg;
  }

  // === 人形リスポーン（3秒ごと） ===
  const respawnTimer = setInterval(() => {
    if (cleaned || magicAwakened) { clearInterval(respawnTimer); return; }
    const aliveDolls = dolls.filter(d => d.userData.alive).length;
    if (aliveDolls < 5) {
      for (let i = 0; i < 5; i++) spawnDoll();
    }
  }, 3000);

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // カウンター
  const counterEl = document.createElement('div');
  counterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  counterEl.textContent = `✨ 0/${LIGHT_TARGET}`;
  overlay.appendChild(counterEl);

  startBGM('w3');
  setForm('normal');
  showMessage(overlay, d.dollIntro, 3000);

  // === 魔法覚醒演出 ===
  function awakenMagic() {
    if (cleaned || magicAwakened) return;
    magicAwakened = true;
    clearInterval(respawnTimer);
    stopBGM();
    setForm('magician');

    // シーン全体を明るく
    if (ambLight) ambLight.intensity = 0.8;
    scene.children.forEach(c => {
      if (c.isDirectionalLight) c.intensity = 1.0;
    });
    scene.background = new THREE.Color(0x4422aa);
    scene.fog.color = new THREE.Color(0x4422aa);

    // 白フラッシュ
    scene.background = new THREE.Color(0xffffff);
    setTimeout(() => {
      if (!cleaned) scene.background = new THREE.Color(0x4422aa);
    }, 400);

    // パーティクル演出
    const particles = E.createParticles(100, 0xffff00, 0.3);
    scene.add(particles);
    const particles2 = E.createParticles(60, 0xff66ff, 0.25);
    scene.add(particles2);

    // ひかりちゃんを中央に
    const hikari = E.createHikari();
    hikari.position.set(0, 0, 0);
    hikari.scale.setScalar(1.5);
    scene.add(hikari);

    // テキストスプライト
    const txt = E.createTextSprite('魔法使いに覚醒！', { fontSize: 40, color: '#ffcc00' });
    txt.position.set(0, 5, 0);
    scene.add(txt);

    playSound('magic');
    showBigMessage(overlay, d.magicAwaken, 3500);

    setTimeout(() => {
      playSound('clear');
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 1500);
    }, 3500);
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;

    // 人形アニメーション
    dolls.forEach(doll => {
      if (!doll.userData.alive) {
        // 食べられアニメ（縮小して消える）
        if (doll.userData.eatTime !== undefined) {
          const elapsed = t - doll.userData.eatTime;
          doll.scale.setScalar(Math.max(0, 1 - elapsed * 3));
          doll.position.y += 0.05;
          doll.rotation.y += 0.2;
          if (elapsed > 0.5) {
            scene.remove(doll);
            E.unregisterClick(doll);
            doll.userData.eatTime = undefined;
          }
        }
        return;
      }
      // 微動（浮遊感）
      doll.position.y = Math.sin(t * 2 + doll.userData.bobOffset) * 0.1;
      doll.rotation.y = Math.sin(t * 0.8 + doll.userData.bobOffset) * 0.3;
    });

    // 光の玉アニメーション
    lightOrbs.forEach(orb => {
      if (!orb.userData.alive) {
        if (orb.userData.collectTime !== undefined) {
          const elapsed = t - orb.userData.collectTime;
          orb.position.y += 0.2;
          orb.scale.setScalar(Math.max(0, 1 - elapsed * 3));
          if (elapsed > 0.5) {
            scene.remove(orb);
            E.unregisterClick(orb);
            orb.userData.collectTime = undefined;
          }
        }
        return;
      }
      // 浮遊＆パルス
      orb.position.y += Math.sin(t * 3 + orb.userData.bobOffset) * 0.005;
      const pulse = 1 + Math.sin(t * 5 + orb.userData.bobOffset) * 0.2;
      orb.scale.setScalar(pulse);
    });

    // 魔法ライトの揺らぎ
    magicLight.intensity = 0.4 + Math.sin(t * 2) * 0.15;
    magicLight.position.x = Math.sin(t * 0.5) * 3;
    magicLight.position.z = Math.cos(t * 0.5) * 3;

    // カメラ微動
    camera.position.x = Math.sin(t * 0.3) * 1.5;
    camera.lookAt(0, 1, 0);
  });

  // === クリーンアップ ===
  function cleanup() {
    cleaned = true;
    stopBGM();
    clearInterval(respawnTimer);
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }

  return { cleanup };
}
