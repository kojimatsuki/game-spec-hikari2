// w1-toilet.js - W1ステージ2: トイレ食べ（3Dポリゴン版）
// ひかりちゃんがフィールドを歩いてトイレを食べるステージ

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW1Toilet(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let toiletsEaten = 0;
  const TARGET = 10;
  let cleaned = false;
  let t = 0;

  // ひかりちゃんの移動先
  let targetPos = new THREE.Vector3(0, 0, 0);

  // === シーン作成 ===
  const scene = E.createScene(0x222244);
  scene.fog = new THREE.Fog(0x222244, 20, 60);
  const camera = E.createCamera(60);
  camera.position.set(0, 18, 18);
  camera.lookAt(0, 0, 0);
  E.setScene(scene, camera);

  // グリッド床
  const ground = E.createGridGround(40, 0x3366cc, 0x2255aa);
  scene.add(ground);

  // === ひかりちゃん ===
  const hikari = E.createHikari();
  hikari.position.set(0, 0, 0);
  scene.add(hikari);

  // === トイレ配置（15個） ===
  const toilets = [];
  for (let i = 0; i < 15; i++) {
    const toilet = E.createToilet();
    const angle = (i / 15) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 5 + Math.random() * 10;
    toilet.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    toilet.rotation.y = Math.random() * Math.PI * 2;
    toilet.userData.eaten = false;
    toilet.userData.bobOffset = Math.random() * Math.PI * 2;
    scene.add(toilet);
    toilets.push(toilet);
  }

  // === 地面クリックで移動 ===
  // 地面のヒット検出用平面（透明）
  const clickPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickPlane.rotation.x = -Math.PI / 2;
  clickPlane.position.y = 0.01;
  scene.add(clickPlane);

  E.registerClick(clickPlane, (hit) => {
    if (cleaned) return;
    targetPos.copy(hit.point);
    targetPos.y = 0;
    playSound('tap');
  });

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // カウンター表示
  const counterEl = document.createElement('div');
  counterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  counterEl.textContent = `🚽 0/${TARGET}`;
  overlay.appendChild(counterEl);

  // BGM開始
  startBGM('w1');
  showMessage(overlay, d.toiletIntro, 3000);

  // === トイレを食べる処理 ===
  function eatToilet(toilet) {
    if (toilet.userData.eaten || cleaned) return;
    toilet.userData.eaten = true;
    toiletsEaten++;
    counterEl.textContent = `🚽 ${toiletsEaten}/${TARGET}`;
    playSound('eat');
    addCoins(2);
    showMessage(overlay, 'モグモグ🚽', 800);

    // 食べるアニメ（縮小して消える）
    toilet.userData.shrinking = true;
    toilet.userData.shrinkTime = t;

    if (toiletsEaten >= TARGET) {
      setTimeout(() => brainrotAppear(), 1000);
    }
  }

  // === ブレインロット登場 ===
  function brainrotAppear() {
    if (cleaned) return;
    stopBGM();
    playSound('brainrot');
    showBigMessage(overlay, d.brainrotAppear, 2000);

    // ブレインロット生成（遠くから近づく）
    const brainrot = E.createBrainrot(0);
    brainrot.position.set(0, 0, -25);
    brainrot.userData.approaching = true;
    scene.add(brainrot);

    // 近づくアニメーション（ループ内で処理）
    brainrot.userData.approachStart = t;
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;

    // ひかりちゃんの移動（ターゲットに向かって歩く）
    const dx = targetPos.x - hikari.position.x;
    const dz = targetPos.z - hikari.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.2) {
      const speed = 0.12;
      hikari.position.x += (dx / dist) * speed;
      hikari.position.z += (dz / dist) * speed;
      // 向き変更
      hikari.rotation.y = Math.atan2(dx, dz);
      // 歩行アニメ（上下揺れ）
      hikari.position.y = Math.abs(Math.sin(t * 10)) * 0.15;
    } else {
      hikari.position.y = 0;
    }

    // トイレとの当たり判定＆アニメーション
    toilets.forEach(toilet => {
      if (toilet.userData.eaten) {
        // 縮小アニメ
        if (toilet.userData.shrinking) {
          const elapsed = t - toilet.userData.shrinkTime;
          const s = Math.max(0, 1 - elapsed * 3);
          toilet.scale.setScalar(s);
          toilet.position.y = elapsed * 3;
          toilet.rotation.y += 0.2;
          if (s <= 0) {
            scene.remove(toilet);
            toilet.userData.shrinking = false;
          }
        }
        return;
      }

      // 軽い浮遊
      toilet.position.y = Math.sin(t * 1.5 + toilet.userData.bobOffset) * 0.1;

      // 距離チェック
      const tdx = hikari.position.x - toilet.position.x;
      const tdz = hikari.position.z - toilet.position.z;
      const tdist = Math.sqrt(tdx * tdx + tdz * tdz);
      if (tdist < 1.5) {
        eatToilet(toilet);
      }
    });

    // ブレインロットの接近アニメーション
    scene.traverse((obj) => {
      if (obj.userData && obj.userData.approaching) {
        const elapsed = t - obj.userData.approachStart;
        // ゆっくり近づく
        obj.position.z += 0.15;
        obj.position.y = Math.sin(t * 3) * 0.3;
        obj.rotation.y = Math.sin(t * 2) * 0.3;

        // ひかりちゃんに到達
        if (obj.position.z >= hikari.position.z) {
          obj.userData.approaching = false;
          showBigMessage(overlay, d.brainrotEat, 2000);
          playSound('explode');

          // 白フラッシュ
          scene.background = new THREE.Color(0xffffff);
          setTimeout(() => {
            scene.background = new THREE.Color(0x222244);
          }, 300);

          setTimeout(() => {
            if (!cleaned) onComplete();
          }, 2500);
        }
      }
    });

    // カメラ追従（軽く追いかける）
    camera.position.x += (hikari.position.x - camera.position.x) * 0.02;
    camera.position.z = hikari.position.z + 18;
    camera.lookAt(hikari.position.x, 0, hikari.position.z);
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
