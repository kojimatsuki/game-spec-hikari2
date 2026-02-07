// w1-belly.js - W1ステージ3: お腹の中（3Dポリゴン版）
// コインと包丁を集め、消化液から逃げて脱出するステージ

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW1Belly(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let knives = 0;
  const KNIFE_TARGET = 6;
  let cleaned = false;
  let t = 0;
  let acidY = -5; // 消化液の高さ（下から上昇）
  let acidSpeed = 0.005;
  let cutCount = 0;

  // === シーン作成（ピンク/紫の体内空間） ===
  const scene = E.createScene(0x330022);
  scene.fog = new THREE.Fog(0x330022, 10, 40);
  const camera = E.createCamera(65);
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 4, 0);
  E.setScene(scene, camera);

  // 追加ライト（暖かみのあるピンクライト）
  const pinkLight = new THREE.PointLight(0xff66aa, 1.2, 30);
  pinkLight.position.set(0, 10, 0);
  scene.add(pinkLight);
  const greenLight = new THREE.PointLight(0x44ff44, 0.5, 20);
  greenLight.position.set(0, -3, 0);
  scene.add(greenLight);

  // === 体内の壁（ボックスで囲む） ===
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x993366 });
  const wallThickness = 1;
  const roomSize = 16;
  const roomHeight = 14;

  // 床
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, wallThickness, roomSize),
    new THREE.MeshLambertMaterial({ color: 0x660033 })
  );
  floor.position.y = -0.5;
  scene.add(floor);

  // 左壁
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, roomSize), wallMat);
  leftWall.position.set(-roomSize / 2, roomHeight / 2, 0);
  scene.add(leftWall);
  // 右壁
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, roomHeight, roomSize), wallMat);
  rightWall.position.set(roomSize / 2, roomHeight / 2, 0);
  scene.add(rightWall);
  // 奥壁
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, roomHeight, wallThickness), wallMat);
  backWall.position.set(0, roomHeight / 2, -roomSize / 2);
  scene.add(backWall);
  // 天井（半透明）
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(roomSize, wallThickness, roomSize),
    new THREE.MeshLambertMaterial({ color: 0x993366, transparent: true, opacity: 0.5 })
  );
  ceiling.position.y = roomHeight;
  scene.add(ceiling);

  // === コイン配置（30個、浮遊） ===
  const coins = [];
  for (let i = 0; i < 30; i++) {
    const coin = E.createCoin();
    coin.position.set(
      (Math.random() - 0.5) * (roomSize - 3),
      1 + Math.random() * 8,
      (Math.random() - 0.5) * (roomSize - 3)
    );
    coin.userData.collected = false;
    coin.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(coin);
    coins.push(coin);

    // コインクリック
    E.registerClick(coin, () => {
      if (cleaned || coin.userData.collected) return;
      coin.userData.collected = true;
      playSound('coin');
      addCoins(1);
      // 収集アニメ
      coin.userData.collectTime = t;
    });
  }

  // === 包丁配置（6本、少し隠す） ===
  const knifeObjects = [];
  const knifePositions = [
    { x: -6, y: 2, z: -5 },
    { x: 5, y: 6, z: -4 },
    { x: -3, y: 9, z: 2 },
    { x: 4, y: 3, z: 5 },
    { x: -5, y: 7, z: -2 },
    { x: 2, y: 5, z: -6 },
  ];

  knifePositions.forEach((pos) => {
    const knife = E.createKnife();
    knife.position.set(pos.x, pos.y, pos.z);
    knife.userData.collected = false;
    knife.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(knife);
    knifeObjects.push(knife);

    E.registerClick(knife, () => {
      if (cleaned || knife.userData.collected) return;
      knife.userData.collected = true;
      knives++;
      playSound('knife');
      knifeCounterEl.textContent = `🔪 ${knives}/${KNIFE_TARGET}`;
      showMessage(overlay, `🔪 包丁ゲット！`, 1200);
      knife.userData.collectTime = t;

      if (knives >= KNIFE_TARGET) {
        setTimeout(() => showCutButton(), 500);
      }
    });
  });

  // === 消化液（緑の半透明プレーン、下から上昇） ===
  const acidGeo = new THREE.BoxGeometry(roomSize - 0.5, 1, roomSize - 0.5);
  const acidMat = new THREE.MeshLambertMaterial({
    color: 0x33ff33, transparent: true, opacity: 0.5
  });
  const acid = new THREE.Mesh(acidGeo, acidMat);
  acid.position.y = acidY;
  scene.add(acid);

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // 包丁カウンター
  const knifeCounterEl = document.createElement('div');
  knifeCounterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  knifeCounterEl.textContent = `🔪 0/${KNIFE_TARGET}`;
  overlay.appendChild(knifeCounterEl);

  // 消化液警告バー
  const acidBarWrap = document.createElement('div');
  acidBarWrap.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);width:200px;z-index:10;';
  const acidLabel = document.createElement('div');
  acidLabel.style.cssText = 'font-size:14px;color:#66ff66;text-align:center;';
  acidLabel.textContent = '⚠️ 消化液';
  acidBarWrap.appendChild(acidLabel);
  const acidBarBg = document.createElement('div');
  acidBarBg.style.cssText = 'width:100%;height:12px;background:#333;border-radius:6px;overflow:hidden;';
  const acidBarFill = document.createElement('div');
  acidBarFill.style.cssText = 'width:0%;height:100%;background:linear-gradient(90deg,#33ff33,#ff3333);transition:width 0.3s;';
  acidBarBg.appendChild(acidBarFill);
  acidBarWrap.appendChild(acidBarBg);
  overlay.appendChild(acidBarWrap);

  startBGM('w1');
  showMessage(overlay, d.bellyIntro, 3000);

  // === 「切る」ボタン表示 ===
  function showCutButton() {
    if (cleaned) return;
    showBigMessage(overlay, d.cutReady, 2000);

    const cutBtn = document.createElement('button');
    cutBtn.className = 'game-btn';
    cutBtn.textContent = '✂️ 切る！！！';
    cutBtn.style.cssText = 'position:absolute;bottom:15%;left:50%;transform:translateX(-50%);font-size:24px;padding:15px 40px;z-index:100;animation:pulse 0.5s infinite alternate;';
    const doCut = (e) => {
      e.preventDefault();
      if (cleaned) return;
      cutCount++;
      playSound('cut');
      showMessage(overlay, '🔪✂️ザクッ！', 500);

      // 画面シェイク（カメラ揺らし）
      camera.position.x += (Math.random() - 0.5) * 2;
      camera.position.y += (Math.random() - 0.5) * 1;

      if (cutCount >= 5) {
        cutBtn.remove();
        escapeAnimation();
      }
    };
    cutBtn.addEventListener('click', doCut);
    cutBtn.addEventListener('touchstart', doCut, { passive: false });
    overlay.appendChild(cutBtn);
  }

  // === 脱出演出 ===
  function escapeAnimation() {
    if (cleaned) return;
    stopBGM();
    playSound('explode');
    showBigMessage(overlay, d.cutting, 1500);

    // 壁を破壊（非表示にする）
    scene.remove(backWall);
    scene.remove(ceiling);

    // 白フラッシュ
    scene.background = new THREE.Color(0xffffff);
    setTimeout(() => {
      scene.background = new THREE.Color(0x87ceeb);
    }, 500);

    // 脱出パーティクル
    const particles = E.createParticles(100, 0xffff00, 0.3);
    scene.add(particles);

    setTimeout(() => {
      showBigMessage(overlay, d.escaped, 2000);
      playSound('clear');
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 2500);
    }, 1500);
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;

    // コインアニメーション
    coins.forEach(coin => {
      if (coin.userData.collected) {
        if (coin.userData.collectTime !== undefined) {
          const elapsed = t - coin.userData.collectTime;
          coin.position.y += 0.15;
          coin.scale.setScalar(Math.max(0, 1 - elapsed * 3));
          if (elapsed > 0.5) {
            scene.remove(coin);
            coin.userData.collectTime = undefined;
          }
        }
        return;
      }
      // 浮遊回転
      coin.position.y += Math.sin(t * 2 + coin.userData.bobOffset) * 0.003;
      coin.rotation.z += 0.03;
    });

    // 包丁アニメーション
    knifeObjects.forEach(knife => {
      if (knife.userData.collected) {
        if (knife.userData.collectTime !== undefined) {
          const elapsed = t - knife.userData.collectTime;
          knife.position.y += 0.2;
          knife.rotation.z += 0.3;
          knife.scale.setScalar(Math.max(0, 1 - elapsed * 3));
          if (elapsed > 0.5) {
            scene.remove(knife);
            knife.userData.collectTime = undefined;
          }
        }
        return;
      }
      // 浮遊＆微回転
      knife.position.y += Math.sin(t * 1.5 + knife.userData.bobOffset) * 0.003;
      knife.rotation.y += 0.02;
      // 光るエフェクト（スケールパルス）
      const pulse = 1 + Math.sin(t * 4 + knife.userData.bobOffset) * 0.1;
      knife.scale.setScalar(pulse);
    });

    // 消化液上昇
    acidY += acidSpeed;
    acid.position.y = acidY;
    acid.scale.y = Math.max(0.1, acidY + 5);
    const acidPct = Math.min(100, Math.max(0, ((acidY + 5) / 14) * 100));
    acidBarFill.style.width = acidPct + '%';

    // 消化液が上まで来たらリセット
    if (acidY > 9) {
      showBigMessage(overlay, '消化されちゃった！💀 もう一度！', 2000);
      acidY = -5;
      acidSpeed += 0.001;
    }

    // ライトの揺らぎ
    pinkLight.intensity = 1.2 + Math.sin(t * 2) * 0.3;
    greenLight.position.y = acidY;
    greenLight.intensity = 0.5 + acidPct * 0.01;

    // カメラの軽い揺れ
    camera.position.x = Math.sin(t * 0.7) * 1;
    camera.lookAt(0, 4, 0);
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
