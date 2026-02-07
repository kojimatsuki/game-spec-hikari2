// w1-poop.js - W1ステージ1: うんこ3回（3Dポリゴン版）
// 巨大うんこを3回クリックするシンプルなステージ

import { DIALOGUES } from './data.js';
import { playSound } from './audio.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW1Poop(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let count = 0;
  let cleaned = false;
  let t = 0;

  // === シーン作成（暗い紫の背景） ===
  const scene = E.createScene(0x1a0a2e);
  scene.fog = new THREE.Fog(0x1a0a2e, 15, 60);
  const camera = E.createCamera(55);
  camera.position.set(0, 4, 10);
  camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);

  // 追加ライト（紫っぽいポイントライト）
  const pointLight = new THREE.PointLight(0xaa44ff, 1.0, 30);
  pointLight.position.set(0, 8, 5);
  scene.add(pointLight);

  // 床
  const ground = E.createGround(30, 0x220033);
  scene.add(ground);

  // === 巨大うんこモデル（中央） ===
  const bigPoop = E.createPoop();
  bigPoop.scale.setScalar(3);
  bigPoop.position.set(0, 0, 0);
  scene.add(bigPoop);

  // 飛び散るうんこ達を保持
  const flyingPoops = [];

  // === うんこクリックハンドラ ===
  E.registerClick(bigPoop, () => {
    if (cleaned || count >= 3) return;
    count++;
    playSound('poop');

    // バウンスアニメーション用フラグ
    bigPoop.userData.bounceTime = t;

    // 飛び散るうんこを生成（5個）
    for (let i = 0; i < 5; i++) {
      const fp = E.createPoop();
      fp.scale.setScalar(0.5 + Math.random() * 0.5);
      fp.position.copy(bigPoop.position);
      fp.position.y += 2;
      fp.userData.vx = (Math.random() - 0.5) * 0.4;
      fp.userData.vy = 0.2 + Math.random() * 0.3;
      fp.userData.vz = (Math.random() - 0.5) * 0.4;
      fp.userData.life = 0;
      scene.add(fp);
      flyingPoops.push(fp);
    }

    // カウンター更新
    updateCounter();

    // 3回目で進化演出
    if (count >= 3) {
      setTimeout(() => evolveTransition(), 1000);
    }
  });

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // カウンター表示
  const counterEl = document.createElement('div');
  counterEl.className = 'counter-display';
  counterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:32px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  counterEl.textContent = '💩 0/3';
  overlay.appendChild(counterEl);

  // 説明テキスト
  const instrEl = document.createElement('div');
  instrEl.style.cssText = 'position:absolute;bottom:40px;left:50%;transform:translateX(-50%);font-size:18px;color:#ffcc00;text-shadow:1px 1px 3px #000;text-align:center;z-index:10;';
  instrEl.textContent = d.poopIntro;
  overlay.appendChild(instrEl);

  function updateCounter() {
    counterEl.textContent = `💩 ${count}/3`;
  }

  // === 進化演出 ===
  function evolveTransition() {
    if (cleaned) return;

    // フラッシュエフェクト（白い平面を画面前に出す）
    const flashGeo = new THREE.PlaneGeometry(100, 100);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      side: THREE.DoubleSide, depthTest: false
    });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.set(0, 5, 8);
    flash.renderOrder = 999;
    scene.add(flash);

    // フラッシュアニメーション
    let flashPhase = 0;
    const flashInterval = setInterval(() => {
      flashPhase += 0.05;
      if (flashPhase < 1) {
        flashMat.opacity = flashPhase;
      } else if (flashPhase < 2) {
        flashMat.opacity = 2 - flashPhase;
      } else {
        clearInterval(flashInterval);
        scene.remove(flash);
        flashGeo.dispose();
        flashMat.dispose();
      }
    }, 30);

    // メッセージ表示
    showBigMessage(overlay, d.evolved, 2000);
    playSound('clear');

    // パーティクル演出
    const particles = E.createParticles(80, 0xffd700, 0.3);
    scene.add(particles);

    // 完了コール
    setTimeout(() => {
      if (!cleaned) onComplete();
    }, 3000);
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;

    // 巨大うんこの浮遊アニメーション
    bigPoop.position.y = 1.5 + Math.sin(t * 2) * 0.3;
    bigPoop.rotation.y += 0.01;

    // バウンスエフェクト
    if (bigPoop.userData.bounceTime !== undefined) {
      const elapsed = t - bigPoop.userData.bounceTime;
      if (elapsed < 0.5) {
        const bounce = Math.sin(elapsed * Math.PI * 4) * (0.5 - elapsed);
        bigPoop.position.y += bounce * 3;
        bigPoop.scale.setScalar(3 + bounce * 2);
      } else {
        bigPoop.scale.setScalar(3);
      }
    }

    // 飛び散るうんこのアニメーション
    for (let i = flyingPoops.length - 1; i >= 0; i--) {
      const fp = flyingPoops[i];
      fp.userData.life += 0.016;
      fp.position.x += fp.userData.vx;
      fp.position.y += fp.userData.vy;
      fp.position.z += fp.userData.vz;
      fp.userData.vy -= 0.015; // 重力
      fp.rotation.x += 0.1;
      fp.rotation.z += 0.05;

      // 寿命チェック
      if (fp.userData.life > 2.5) {
        scene.remove(fp);
        flyingPoops.splice(i, 1);
      }
    }

    // ポイントライトのパルス
    pointLight.intensity = 1.0 + Math.sin(t * 3) * 0.3;

    // カメラの軽い揺れ
    camera.position.x = Math.sin(t * 0.5) * 0.5;
  });

  // === クリーンアップ ===
  function cleanup() {
    cleaned = true;
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }

  return { cleanup };
}
