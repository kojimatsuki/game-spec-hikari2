// scenes.js - 3Dシーン遷移（タイトル/ワールド選択/エンディング）

import { GAME_TITLE, WORLDS, DIALOGUES } from './data.js';
import { playSound } from './audio.js';
import { getCoins } from './economy.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initTitle(container, gameState, onStartGame) {
  let cleaned = false;
  const scene = E.createScene(0x1a1040);
  scene.fog = new THREE.Fog(0x1a1040, 30, 80);
  const camera = E.createCamera(50);
  camera.position.set(0, 5, 12);
  camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);

  // 追加ライト
  const purpleLight = new THREE.PointLight(0xaa66ff, 1.5, 40);
  purpleLight.position.set(0, 10, 5);
  scene.add(purpleLight);
  const pinkLight = new THREE.PointLight(0xff66aa, 0.8, 25);
  pinkLight.position.set(-5, 5, 8);
  scene.add(pinkLight);

  // 床
  const ground = E.createGridGround(40, 0x2a1a4e, 0x4030a0);
  scene.add(ground);

  // ひかりちゃん
  const hikari = E.createHikari();
  hikari.position.set(0, 0, 0);
  scene.add(hikari);

  // ブレインロット（手前右に配置、見える位置）
  const br = E.createBrainrot(0);
  br.position.set(5, 0, -3);
  scene.add(br);

  // うんこ達
  const poops = [];
  for (let i = 0; i < 5; i++) {
    const p = E.createPoop();
    p.position.set((Math.random() - 0.5) * 15, 6 + Math.random() * 5, (Math.random() - 0.5) * 8);
    p.userData.vy = -0.03 - Math.random() * 0.02;
    scene.add(p);
    poops.push(p);
  }

  // 星の装飾
  for (let i = 0; i < 15; i++) {
    const star = E.createStar(0.1 + Math.random() * 0.15);
    const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 15;
    star.position.set(Math.cos(a) * r, 3 + Math.random() * 8, Math.sin(a) * r);
    scene.add(star);
  }

  // パーティクル
  const particles = E.createParticles(30, 0xaa66ff, 0.1);
  scene.add(particles);

  // HTML UI（タイトル＋ボタン）
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // タイトルテキスト（HTMLで表示 - 長いテキストも対応）
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'position:absolute;top:8%;left:50%;transform:translateX(-50%);font-size:clamp(18px,4.5vw,32px);font-weight:bold;text-align:center;padding:0 20px;color:#ffd700;text-shadow:0 0 20px #aa66ff,2px 2px 4px #000;z-index:10;line-height:1.4;';
  titleEl.textContent = GAME_TITLE;
  overlay.appendChild(titleEl);

  const subEl = document.createElement('div');
  subEl.style.cssText = 'position:absolute;top:22%;left:50%;transform:translateX(-50%);font-size:14px;color:#aa88ff;text-shadow:1px 1px 3px #000;z-index:10;';
  subEl.textContent = '🎮 3Dポリゴンアクション 🎮';
  overlay.appendChild(subEl);

  const btn = document.createElement('button');
  btn.className = 'game-btn start-btn';
  btn.textContent = '🎮 はじめる';
  const startGame = (e) => {
    e.preventDefault();
    if (cleaned) return;
    playSound('clear');
    cleanup();
    onStartGame();
  };
  btn.addEventListener('click', startGame);
  btn.addEventListener('touchstart', startGame, { passive: false });
  overlay.appendChild(btn);

  let t = 0;
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.02;
    hikari.rotation.y = Math.sin(t) * 0.5;
    hikari.position.y = Math.sin(t * 2) * 0.2;
    br.position.x = 5 + Math.sin(t * 0.5) * 2;
    br.rotation.y = Math.sin(t * 0.3) * 0.5;
    poops.forEach(p => {
      p.position.y += p.userData.vy;
      p.rotation.z += 0.02;
      if (p.position.y < 0) p.position.y = 10;
    });
    purpleLight.intensity = 1.5 + Math.sin(t * 2) * 0.3;
    E.updateParticles(particles);
    camera.position.x = Math.sin(t * 0.3) * 2;
    camera.lookAt(0, 2, 0);
  });

  function cleanup() {
    cleaned = true;
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }
  return { cleanup };
}

export function initWorldSelect(container, gameState, onSelectStage) {
  let cleaned = false;
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  const scene = E.createScene(0x1a1a3e);
  scene.fog = new THREE.Fog(0x1a1a3e, 30, 60);
  const camera = E.createCamera(50);
  camera.position.set(0, 8, 15);
  camera.lookAt(0, 0, 0);
  E.setScene(scene, camera);

  // 追加ライト
  const centerLight = new THREE.PointLight(0x6688ff, 1.0, 30);
  centerLight.position.set(0, 8, 5);
  scene.add(centerLight);

  const ground = E.createGridGround(30, 0x1a2040, 0x2040a0);
  scene.add(ground);

  // タイトル
  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'position:absolute;top:5%;left:50%;transform:translateX(-50%);font-size:24px;font-weight:bold;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  titleEl.textContent = '🌍 ワールド選択';
  overlay.appendChild(titleEl);

  // ワールドを3Dオブジェクトで表現
  const worldObjects = [];
  const worldData = [
    { color: 0x8844aa, model: () => E.createToilet(), unlocked: true },
    { color: 0x44aa44, model: () => E.createBuilding(2, 3, 2, 0xddddaa), unlocked: gameState.worldsCompleted[0] },
    { color: 0xaa44ff, model: () => E.createDoll(0xff66aa), unlocked: gameState.worldsCompleted[1] },
  ];

  worldData.forEach((wd, i) => {
    const g = new THREE.Group();
    const plat = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.5, 16),
      new THREE.MeshLambertMaterial({ color: wd.unlocked ? wd.color : 0x444444 })
    );
    plat.position.y = 0.25;
    g.add(plat);

    if (wd.unlocked) {
      const m = wd.model();
      m.position.y = 0.5;
      g.add(m);
      // ラベル（HTMLで表示）
      if (gameState.worldsCompleted[i]) {
        const check = E.createTextSprite('✅', { fontSize: 48 });
        check.position.y = 3.5;
        check.scale.set(2, 2, 1);
        g.add(check);
      }
    } else {
      const lock = E.createTextSprite('🔒', { fontSize: 60 });
      lock.position.y = 2;
      lock.scale.set(2, 2, 1);
      g.add(lock);
    }

    g.position.set((i - 1) * 6, 0, 0);
    scene.add(g);
    worldObjects.push(g);

    if (wd.unlocked) {
      E.registerClick(g, () => {
        if (cleaned) return;
        playSound('tap');
        cleanup();
        onSelectStage(WORLDS[i].stages[0].id);
      });
    }
  });

  // ワールドラベル（HTMLオーバーレイ）
  const labelsEl = document.createElement('div');
  labelsEl.style.cssText = 'position:absolute;bottom:25%;left:0;right:0;display:flex;justify-content:center;gap:20px;z-index:10;';
  worldData.forEach((wd, i) => {
    const lbl = document.createElement('div');
    lbl.style.cssText = `font-size:14px;color:${wd.unlocked ? '#fff' : '#666'};text-align:center;width:100px;text-shadow:1px 1px 2px #000;`;
    lbl.innerHTML = `${WORLDS[i].icon}<br>${WORLDS[i].name}${gameState.worldsCompleted[i] ? '<br><span style="color:#0f0">クリア</span>' : ''}`;
    labelsEl.appendChild(lbl);
  });
  overlay.appendChild(labelsEl);

  // 隠しステージ
  const allClear = gameState.worldsCompleted.every(w => w);
  const secretG = new THREE.Group();
  const secretPlat = new THREE.Mesh(
    new THREE.CylinderGeometry(2, 2, 0.5, 16),
    new THREE.MeshLambertMaterial({ color: allClear ? 0xff0066 : 0x444444 })
  );
  secretPlat.position.y = 0.25;
  secretG.add(secretPlat);
  if (allClear) {
    const ghost = E.createGhost(1.5);
    ghost.position.y = 0.5;
    secretG.add(ghost);
    E.registerClick(secretG, () => {
      if (cleaned) return;
      playSound('tap');
      cleanup();
      onSelectStage('secret');
    });
  } else {
    const lock = E.createTextSprite('🔒', { fontSize: 60 });
    lock.position.y = 2;
    lock.scale.set(2, 2, 1);
    secretG.add(lock);
  }
  secretG.position.set(0, 0, -7);
  scene.add(secretG);

  // 隠しステージラベル
  const secretLabel = document.createElement('div');
  secretLabel.style.cssText = `position:absolute;bottom:12%;left:50%;transform:translateX(-50%);font-size:14px;color:${allClear ? '#ff6688' : '#666'};text-shadow:1px 1px 2px #000;z-index:10;`;
  secretLabel.textContent = allClear ? '👻 隠しステージ' : '🔒 ???';
  overlay.appendChild(secretLabel);

  const coinLabel = document.createElement('div');
  coinLabel.className = 'coin-display';
  coinLabel.textContent = `💰 ${getCoins()} コイン`;
  overlay.appendChild(coinLabel);

  let t = 0;
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.01;
    worldObjects.forEach((wo, i) => { wo.position.y = Math.sin(t + i) * 0.2; });
    secretG.position.y = Math.sin(t + 3) * 0.2;
    centerLight.intensity = 1.0 + Math.sin(t * 2) * 0.2;
  });

  function cleanup() {
    cleaned = true;
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }
  return { cleanup };
}

export function initEnding(container, gameState, onRestart) {
  let cleaned = false;
  const overlay = E.getOverlay();
  overlay.innerHTML = '';
  const isSecret = gameState.secretCompleted;

  const scene = E.createScene(0x1a1040);
  scene.fog = new THREE.Fog(0x1a1040, 30, 60);
  const camera = E.createCamera(50);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);

  // 追加ライト
  const warm = new THREE.PointLight(0xffcc66, 1.2, 30);
  warm.position.set(0, 8, 5);
  scene.add(warm);

  // 全キャラ集合
  const hikari = E.createHikari();
  hikari.position.set(0, 0, 0);
  scene.add(hikari);

  if (isSecret) {
    const br = E.createBrainrot(0);
    br.position.set(-4, 0, -2);
    br.scale.setScalar(0.7);
    scene.add(br);
    for (let i = 0; i < 5; i++) {
      const f = E.createBlockChar(0x44aa44 + i * 0x111111, 0xffdbac, 0.7);
      f.position.set(-2 + i * 1.5, 0, 2);
      scene.add(f);
    }
  }

  // パーティクル
  const particles = E.createParticles(100, isSecret ? 0xffd700 : 0x6688ff, 0.15);
  scene.add(particles);

  // テキスト（HTMLオーバーレイ）
  const lines = isSecret ? DIALOGUES.ending.secret : DIALOGUES.ending.normal;
  const endDiv = document.createElement('div');
  endDiv.className = 'ending-overlay';
  endDiv.innerHTML = `<h1 class="ending-title">${isSecret ? '🏆 真のエンディング 🏆' : '🎬 エンディング'}</h1>`;
  lines.forEach((l, i) => {
    const p = document.createElement('p');
    p.className = 'ending-line';
    p.textContent = l;
    p.style.animationDelay = (1 + i * 2) + 's';
    endDiv.appendChild(p);
  });
  const credits = document.createElement('p');
  credits.className = 'ending-line';
  credits.textContent = `💰 合計 ${getCoins()} コイン！ 原案: ひかりちゃん / プログラム: Claude Code`;
  credits.style.animationDelay = (1 + lines.length * 2) + 's';
  endDiv.appendChild(credits);

  const btnText = isSecret ? '🔄 もう一度あそぶ' : '▶ つぎへ';
  const btn = document.createElement('button');
  btn.className = 'game-btn restart-btn';
  btn.textContent = btnText;
  btn.style.animationDelay = '6s';
  const restart = (e) => { e.preventDefault(); if (cleaned) return; playSound('tap'); cleanup(); onRestart(); };
  btn.addEventListener('click', restart);
  btn.addEventListener('touchstart', restart, { passive: false });
  endDiv.appendChild(btn);
  overlay.appendChild(endDiv);

  playSound('clear');

  let t = 0;
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.01;
    hikari.rotation.y += 0.01;
    hikari.position.y = Math.sin(t * 2) * 0.3;
    E.updateParticles(particles);
    camera.position.x = Math.sin(t * 0.5) * 3;
    camera.lookAt(0, 2, 0);
  });

  function cleanup() {
    cleaned = true;
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }
  return { cleanup };
}
