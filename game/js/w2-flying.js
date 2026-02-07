// w2-flying.js - W2ステージ3: 空飛びうんちフライト（3Dポリゴン版）
// サイドビュー3Dシーンでフラッピーバード風に飛ぶ
// クリック/ホールドで上昇、離すと落下、60フレームごとにうんち投下

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW2Flying(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let t = 0;
  let frameCount = 0;
  let playerY = 5;
  let velocity = 0;
  const gravity = 0.012;
  const flapForce = -0.06;
  let distance = 0;
  const GOAL = 800;
  let pressing = false;
  let poopTimer = 0;
  let bonusScore = 0;
  let finished = false;

  // === シーン作成（青空サイドビュー） ===
  const scene = E.createScene(0x66bbff);
  scene.fog = new THREE.Fog(0x66bbff, 40, 100);
  const camera = E.createCamera(50);
  // サイドビュー配置
  camera.position.set(0, 6, 20);
  camera.lookAt(0, 5, 0);
  E.setScene(scene, camera);

  // 太陽
  const sunLight = new THREE.PointLight(0xffee88, 1.0, 80);
  sunLight.position.set(20, 25, 10);
  scene.add(sunLight);

  // === 地面（緑の草原） ===
  const groundGeo = new THREE.BoxGeometry(200, 1, 20);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x44aa33 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(0, -0.5, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // 地面のライン（道路/茶色の土）
  const dirtStripe = new THREE.Mesh(
    new THREE.BoxGeometry(200, 0.05, 3),
    new THREE.MeshLambertMaterial({ color: 0x886633 })
  );
  dirtStripe.position.set(0, 0.01, 0);
  scene.add(dirtStripe);

  // === 雲（3D球の集合体） ===
  const clouds = [];
  for (let i = 0; i < 10; i++) {
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    // 雲の本体（3つの球を重ねる）
    for (let j = 0; j < 3; j++) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 8, 8),
        cloudMat
      );
      sphere.position.set(j * 0.7 - 0.7, Math.random() * 0.3, 0);
      cloudGroup.add(sphere);
    }
    cloudGroup.position.set(
      -30 + Math.random() * 80,
      8 + Math.random() * 6,
      -5 - Math.random() * 10
    );
    cloudGroup.userData.speed = 0.02 + Math.random() * 0.02;
    scene.add(cloudGroup);
    clouds.push(cloudGroup);
  }

  // === ひかりちゃん（飛行キャラ） ===
  const hikari = E.createHikari();
  hikari.scale.setScalar(0.8);
  hikari.position.set(-5, playerY, 0);
  scene.add(hikari);

  // 翼エフェクト（小さなボックスを腕の横に）
  const wingMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.2), wingMat);
  leftWing.position.set(-0.8, 1.2, -0.2);
  hikari.add(leftWing);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 1.2), wingMat);
  rightWing.position.set(0.8, 1.2, -0.2);
  hikari.add(rightWing);

  // === 障害物管理 ===
  const obstacles = [];
  const groundEnemies = [];
  const poops = [];

  // 障害物生成（空中のボックスや鳥型）
  function spawnObstacle() {
    if (cleaned || finished) return;
    const g = new THREE.Group();
    const typeRoll = Math.random();

    if (typeRoll < 0.5) {
      // ボックス障害物
      const colors = [0x888888, 0xcc4444, 0x4444cc];
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
      );
      mesh.castShadow = true;
      g.add(mesh);
    } else {
      // 鳥型障害物（翼を広げた形）
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      g.add(body);
      const w1 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.08, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      w1.position.set(-0.8, 0, 0);
      g.add(w1);
      const w2 = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.08, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      w2.position.set(0.8, 0, 0);
      g.add(w2);
    }

    const yPos = 2 + Math.random() * 8;
    g.position.set(30, yPos, 0);
    g.userData.type = 'obstacle';
    g.userData.hit = false;
    scene.add(g);
    obstacles.push(g);
  }

  // 地面敵生成（小さな色つきボックス）
  function spawnGroundEnemy() {
    if (cleaned || finished) return;
    const colors = [0xff4444, 0x44ff44, 0xff8800, 0x8844ff];
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.8, 0.8),
      new THREE.MeshLambertMaterial({ color: colors[Math.floor(Math.random() * colors.length)] })
    );
    body.position.y = 0.4;
    body.castShadow = true;
    g.add(body);
    // 目
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const eye1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
    eye1.position.set(-0.15, 0.55, 0.41);
    g.add(eye1);
    const eye2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), eyeMat);
    eye2.position.set(0.15, 0.55, 0.41);
    g.add(eye2);

    g.position.set(30, 0, 0);
    g.userData.type = 'ground';
    g.userData.hit = false;
    scene.add(g);
    groundEnemies.push(g);
  }

  // うんち投下
  function dropPoop() {
    if (cleaned || finished) return;
    const poop = E.createPoop();
    poop.scale.setScalar(0.5);
    poop.position.set(hikari.position.x, hikari.position.y - 0.5, 0);
    poop.userData.vy = 0;
    poop.userData.active = true;
    scene.add(poop);
    poops.push(poop);
    playSound('poop');
  }

  // === 操作：クリック/タッチでホールド上昇 ===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // 透明クリック壁
  const clickWall = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  clickWall.position.set(0, 8, 15);
  scene.add(clickWall);

  // canvas上でのマウス/タッチ操作
  const canvas = E.getCanvas();
  function startPress(e) { e.preventDefault(); if (!cleaned) pressing = true; }
  function endPress() { pressing = false; }
  canvas.addEventListener('mousedown', startPress);
  canvas.addEventListener('touchstart', startPress, { passive: false });
  canvas.addEventListener('mouseup', endPress);
  canvas.addEventListener('touchend', endPress);

  // === UI表示 ===
  // 距離カウンター
  const distEl = document.createElement('div');
  distEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:24px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  distEl.textContent = '✈️ 0m';
  overlay.appendChild(distEl);

  // ボーナススコア
  const scoreEl = document.createElement('div');
  scoreEl.style.cssText = 'position:absolute;top:55px;left:50%;transform:translateX(-50%);font-size:18px;color:#ffcc00;text-shadow:1px 1px 3px #000;z-index:10;';
  scoreEl.textContent = '💩ボーナス: 0';
  overlay.appendChild(scoreEl);

  startBGM('w2fly');
  showMessage(overlay, d.flyIntro, 3000);

  // === ゴール到達 ===
  function finishFlight() {
    if (cleaned || finished) return;
    finished = true;
    stopBGM();
    showBigMessage(overlay, d.flyComplete, 2500);
    playSound('clear');
    addCoins(15);
    setTimeout(() => {
      if (cleaned) return;
      showBigMessage(overlay, d.w2Clear, 3000);
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3500);
    }, 3000);
  }

  // === 背景の建物（スクロール用） ===
  const bgBuildings = [];
  for (let i = 0; i < 6; i++) {
    const h = 2 + Math.random() * 4;
    const building = E.createBuilding(
      1.5 + Math.random() * 2, h, 2,
      0x777777 + Math.floor(Math.random() * 0x444444)
    );
    building.position.set(-20 + i * 10, 0, -6);
    scene.add(building);
    bgBuildings.push(building);
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;
    frameCount++;

    // 物理演算
    if (pressing) {
      velocity += flapForce;
      if (velocity < -0.25) velocity = -0.25;
      // 翼はばたきアニメ
      leftWing.rotation.z = Math.sin(t * 15) * 0.5;
      rightWing.rotation.z = -Math.sin(t * 15) * 0.5;
    } else {
      leftWing.rotation.z = Math.sin(t * 3) * 0.15;
      rightWing.rotation.z = -Math.sin(t * 3) * 0.15;
    }
    velocity += gravity;
    playerY += velocity;

    // 上下制限
    if (playerY < 1.2) { playerY = 1.2; velocity = 0; }
    if (playerY > 14) { playerY = 14; velocity = 0; }

    hikari.position.y = playerY;
    // 傾きアニメ
    hikari.rotation.z = velocity * 1.5;

    // 距離更新
    if (!finished) {
      distance += 0.5;
      distEl.textContent = `✈️ ${Math.floor(distance)}m`;
    }

    // うんち自動投下（60フレームごと）
    poopTimer++;
    if (poopTimer >= 60 && !finished) {
      poopTimer = 0;
      dropPoop();
    }

    // 障害物生成
    if (frameCount % 80 === 0 && !finished) spawnObstacle();
    if (frameCount % 120 === 0 && !finished) spawnGroundEnemy();

    // 障害物更新
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.position.x -= 0.15;
      obs.rotation.y += 0.02;

      // 当たり判定
      if (!obs.userData.hit) {
        const odx = obs.position.x - hikari.position.x;
        const ody = obs.position.y - playerY;
        if (Math.abs(odx) < 1.5 && Math.abs(ody) < 1.5) {
          obs.userData.hit = true;
          showMessage(overlay, '💥 ぶつかった！', 600);
          playSound('hit');
          distance = Math.max(0, distance - 15);
          // 障害物を吹き飛ばす
          obs.position.y += 5;
        }
      }

      // 画面外削除
      if (obs.position.x < -25) {
        scene.remove(obs);
        obstacles.splice(i, 1);
      }
    }

    // 地面敵更新
    for (let i = groundEnemies.length - 1; i >= 0; i--) {
      const en = groundEnemies[i];
      en.position.x -= 0.12;
      // 小さな跳ねアニメ
      en.children[0].position.y = 0.4 + Math.abs(Math.sin(t * 5 + i)) * 0.1;

      if (en.position.x < -25) {
        scene.remove(en);
        groundEnemies.splice(i, 1);
      }
    }

    // うんち更新＆当たり判定
    for (let i = poops.length - 1; i >= 0; i--) {
      const p = poops[i];
      if (!p.userData.active) continue;

      p.userData.vy += 0.008; // 重力
      p.position.y -= p.userData.vy;
      p.position.x -= 0.03; // 少し後方へ流れる
      p.rotation.x += 0.1;
      p.rotation.z += 0.05;

      // 地面に到達
      if (p.position.y <= 0.3) {
        // 地面の敵との当たり判定
        let hitEnemy = false;
        for (let j = groundEnemies.length - 1; j >= 0; j--) {
          const en = groundEnemies[j];
          if (en.userData.hit) continue;
          const ex = Math.abs(en.position.x - p.position.x);
          if (ex < 1.5) {
            hitEnemy = true;
            en.userData.hit = true;
            bonusScore++;
            scoreEl.textContent = `💩ボーナス: ${bonusScore}`;
            addCoins(3);
            showMessage(overlay, '💩命中！+3', 600);
            playSound('coin');
            // 敵が吹っ飛ぶ
            en.position.y += 3;
            en.rotation.z = Math.PI;
            setTimeout(() => {
              scene.remove(en);
              const idx = groundEnemies.indexOf(en);
              if (idx >= 0) groundEnemies.splice(idx, 1);
            }, 500);
            break;
          }
        }

        // うんち消去
        p.userData.active = false;
        scene.remove(p);
        poops.splice(i, 1);
        continue;
      }

      // 画面外削除
      if (p.position.x < -25 || p.position.y < -2) {
        p.userData.active = false;
        scene.remove(p);
        poops.splice(i, 1);
      }
    }

    // ゴールチェック
    if (distance >= GOAL && !finished) {
      finishFlight();
    }

    // 雲スクロール
    clouds.forEach(c => {
      c.position.x -= c.userData.speed;
      if (c.position.x < -35) c.position.x = 50;
    });

    // 背景建物スクロール
    bgBuildings.forEach(b => {
      b.position.x -= 0.05;
      if (b.position.x < -35) b.position.x += 60;
    });

    // カメラ追従（軽い上下揺れ）
    camera.position.y = 6 + (playerY - 5) * 0.2;
    camera.position.x = Math.sin(t * 0.5) * 0.3;
    camera.lookAt(hikari.position.x + 3, playerY * 0.5 + 2, 0);
  });

  // === クリーンアップ ===
  function cleanup() {
    cleaned = true;
    stopBGM();
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
    // イベントリスナー解除
    canvas.removeEventListener('mousedown', startPress);
    canvas.removeEventListener('touchstart', startPress);
    canvas.removeEventListener('mouseup', endPress);
    canvas.removeEventListener('touchend', endPress);
  }

  return { cleanup };
}
