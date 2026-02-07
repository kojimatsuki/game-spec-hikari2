// w1-escape.js - W1ステージ4: バイク脱出（3Dポリゴン版）
// サイドビューでバイクに乗って障害物を避けながらブレインロットから逃げるステージ

import { DIALOGUES } from './data.js';
import { playSound, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW1Escape(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let cleaned = false;
  let t = 0;
  let bikeY = 2;
  let targetY = 2;
  let distance = 0;
  const GOAL = 1000;
  let brainrotPhase = 0;
  let speed = 3;
  let frameCount = 0;

  // === シーン作成（サイドビュー） ===
  const scene = E.createScene(0x553300);
  scene.fog = new THREE.Fog(0x553300, 30, 80);
  const camera = E.createCamera(50);
  // サイドビュー：カメラを横から配置
  camera.position.set(0, 5, 20);
  camera.lookAt(0, 3, 0);
  E.setScene(scene, camera);

  // 地面（道路）
  const roadGeo = new THREE.BoxGeometry(200, 0.5, 12);
  const roadMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.position.y = -0.25;
  road.receiveShadow = true;
  scene.add(road);

  // 道路線（白線）
  const lineGeo = new THREE.BoxGeometry(200, 0.05, 0.2);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let z = -4; z <= 4; z += 4) {
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, 0.01, z);
    scene.add(line);
  }

  // === バイク＋ひかりちゃん ===
  const bikeGroup = new THREE.Group();
  const bike = E.createBike();
  bikeGroup.add(bike);
  const hikari = E.createHikari();
  hikari.scale.setScalar(0.7);
  hikari.position.set(-0.1, 0.8, 0);
  bikeGroup.add(hikari);
  bikeGroup.position.set(-5, bikeY, 0);
  scene.add(bikeGroup);

  // === ブレインロット（後ろから追跡） ===
  let brainrot = E.createBrainrot(0);
  brainrot.position.set(-15, 2, 0);
  scene.add(brainrot);

  // === 障害物管理 ===
  const obstacles = [];
  function spawnObstacle() {
    if (cleaned) return;
    const g = new THREE.Group();
    // ランダムな障害物タイプ
    const types = [
      { color: 0x888888, w: 1.5, h: 2, d: 1.5, name: '岩' },
      { color: 0x44aa22, w: 1, h: 3, d: 1, name: '柱' },
      { color: 0xaa4400, w: 2, h: 1.5, d: 1.5, name: '箱' },
      { color: 0xff8800, w: 1.2, h: 1.2, d: 1.2, name: 'ドラム缶' },
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(type.w, type.h, type.d),
      new THREE.MeshLambertMaterial({ color: type.color })
    );
    mesh.castShadow = true;
    mesh.position.y = type.h / 2;
    g.add(mesh);
    // Y位置（上下に散らす）
    const yPos = 0.5 + Math.random() * 4;
    g.position.set(30, yPos, 0);
    g.userData.yPos = yPos;
    scene.add(g);
    obstacles.push(g);
  }

  // === 背景の建物（スクロール用） ===
  const bgBuildings = [];
  for (let i = 0; i < 8; i++) {
    const h = 3 + Math.random() * 8;
    const building = E.createBuilding(2 + Math.random() * 2, h, 2, 0x666666 + Math.floor(Math.random() * 0x333333));
    building.position.set(-30 + i * 10, 0, -8);
    scene.add(building);
    bgBuildings.push(building);
  }

  // === 操作：クリック/タップでバイクの上下移動 ===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // クリック検出用の透明壁
  const clickWall = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 20),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickWall.position.set(0, 5, 15);
  scene.add(clickWall);

  E.registerClick(clickWall, (hit) => {
    if (cleaned) return;
    // クリック位置のY座標でバイクの上下を決定
    targetY = Math.max(0.5, Math.min(7, hit.point.y));
  });

  // === UI表示 ===
  const distEl = document.createElement('div');
  distEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:24px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  distEl.textContent = '🏍️ 0m';
  overlay.appendChild(distEl);

  const formEl = document.createElement('div');
  formEl.style.cssText = 'position:absolute;top:55px;left:50%;transform:translateX(-50%);font-size:18px;color:#ff88aa;text-shadow:1px 1px 3px #000;z-index:10;';
  formEl.textContent = '👾 第1形態';
  overlay.appendChild(formEl);

  showMessage(overlay, d.bikeIntro, 3000);

  // === ブレインロット進化 ===
  function evolveBrainrot(newPhase) {
    if (cleaned) return;
    brainrotPhase = newPhase;
    const oldPos = brainrot.position.clone();
    scene.remove(brainrot);
    brainrot = E.createBrainrot(newPhase);
    brainrot.position.copy(oldPos);
    scene.add(brainrot);

    const names = ['第1形態', '第2形態（翼）', '第3形態（巨大）'];
    const emojis = ['👾', '👿', '💀'];
    formEl.textContent = `${emojis[newPhase]} ${names[newPhase]}`;
    showBigMessage(overlay, d.brainrotEvolve + ` ${emojis[newPhase]}`, 2000);
    playSound('brainrot');
    speed += 0.5;
  }

  // === ブレインロット死亡＆クリア ===
  function brainrotDeath() {
    if (cleaned) return;
    showBigMessage(overlay, d.brainrotDeath, 2500);

    // 死亡アニメーション
    let deathTime = t;
    const deathInterval = setInterval(() => {
      if (cleaned) { clearInterval(deathInterval); return; }
      const elapsed = t - deathTime;
      brainrot.rotation.z += 0.1;
      brainrot.position.y -= 0.05;
      brainrot.scale.multiplyScalar(0.98);

      if (elapsed > 2) {
        clearInterval(deathInterval);
        // 爆発
        playSound('explode');
        scene.remove(brainrot);

        // 爆発パーティクル
        const particles = E.createParticles(80, 0xff4400, 0.4);
        particles.position.copy(brainrot.position);
        scene.add(particles);

        // 白フラッシュ
        scene.background = new THREE.Color(0xffffff);
        setTimeout(() => {
          scene.background = new THREE.Color(0x87ceeb);
        }, 500);

        setTimeout(() => {
          showBigMessage(overlay, d.w1Clear, 3000);
          playSound('clear');
          addCoins(20);
          setTimeout(() => {
            if (!cleaned) onComplete();
          }, 3500);
        }, 1000);
      }
    }, 30);
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;
    frameCount++;

    // バイクの上下移動（スムーズ補間）
    bikeY += (targetY - bikeY) * 0.08;
    bikeGroup.position.y = bikeY;
    // バイクの軽い傾き
    bikeGroup.rotation.z = (targetY - bikeY) * 0.3;

    // 距離更新
    distance += speed * 0.3;
    distEl.textContent = `🏍️ ${Math.floor(distance)}m`;

    // バイクSE
    if (frameCount % 20 === 0) playSound('bike');

    // 障害物生成
    if (frameCount % 35 === 0) spawnObstacle();

    // 障害物移動＆当たり判定
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.x -= speed * 0.15;
      obs.rotation.y += 0.02;

      // 当たり判定
      const dx = obs.position.x - bikeGroup.position.x;
      const dy = obs.userData.yPos - bikeY;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 1.5) {
        showMessage(overlay, 'ガシャン！💥', 600);
        playSound('hit');
        distance = Math.max(0, distance - 30);
        // 障害物を吹き飛ばす
        obs.position.y += 5;
        obs.userData.yPos = 99; // 再判定防止
      }

      // 画面外に出たら削除
      if (obs.position.x < -25) {
        scene.remove(obs);
        obstacles.splice(i, 1);
        addCoins(1);
      }
    }

    // ブレインロット追跡
    brainrot.position.x += (bikeGroup.position.x - 10 - brainrot.position.x) * 0.01;
    brainrot.position.y = bikeY + Math.sin(t * 3) * 1.5;
    brainrot.rotation.y = Math.sin(t * 2) * 0.3;

    // 進化チェック
    if (distance > 300 && brainrotPhase === 0) {
      evolveBrainrot(1);
    }
    if (distance > 600 && brainrotPhase === 1) {
      evolveBrainrot(2);
    }

    // ゴール到達
    if (distance >= GOAL) {
      E.stopLoop();
      brainrotDeath();
      return;
    }

    // 背景建物のスクロール
    bgBuildings.forEach(b => {
      b.position.x -= speed * 0.05;
      if (b.position.x < -40) b.position.x += 80;
    });

    // カメラの軽い振動（スピード感）
    camera.position.y = 5 + Math.sin(t * 8) * 0.05 * speed;
    camera.position.x = Math.sin(t * 0.5) * 0.5;
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
