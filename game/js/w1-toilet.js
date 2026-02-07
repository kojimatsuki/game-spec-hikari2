// w1-toilet.js - W1ステージ2: トイレ食べ（3D風）

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, initCoinUI } from './ui.js';
import { getEmoji } from './hikari.js';

export function initW1Toilet(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let toiletsEaten = 0;
  const TARGET = 10;
  let cleaned = false;
  let animId = null;
  let playerX = 50, playerZ = 50;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w1-toilet';

  // 3Dシーン
  const scene = document.createElement('div');
  scene.className = 'scene-3d';

  const floor = document.createElement('div');
  floor.className = 'floor-3d';
  scene.appendChild(floor);

  // グリッド線
  for (let i = 0; i <= 10; i++) {
    const lineH = document.createElement('div');
    lineH.className = 'grid-line-h';
    lineH.style.top = (i * 10) + '%';
    floor.appendChild(lineH);
    const lineV = document.createElement('div');
    lineV.className = 'grid-line-v';
    lineV.style.left = (i * 10) + '%';
    floor.appendChild(lineV);
  }

  // プレイヤー
  const player = document.createElement('div');
  player.className = 'player-3d';
  player.textContent = getEmoji();
  scene.appendChild(player);

  // トイレ配置
  const toilets = [];
  for (let i = 0; i < 15; i++) {
    const t = document.createElement('div');
    t.className = 'toilet-3d';
    t.textContent = '🚽';
    t.dataset.x = 10 + Math.random() * 80;
    t.dataset.z = 10 + Math.random() * 80;
    t.dataset.eaten = 'false';
    scene.appendChild(t);
    toilets.push(t);
  }

  wrap.appendChild(scene);

  // UI
  const counter = document.createElement('div');
  counter.className = 'counter-display';
  counter.textContent = `🚽 ${toiletsEaten}/${TARGET}`;
  wrap.appendChild(counter);

  initCoinUI(wrap);
  showMessage(wrap, d.toiletIntro, 3000);
  startBGM('w1');

  container.appendChild(wrap);

  // 移動ハンドラ
  function handleMove(e) {
    if (cleaned) return;
    e.preventDefault();
    const rect = scene.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    playerX = ((cx - rect.left) / rect.width) * 100;
    playerZ = ((cy - rect.top) / rect.height) * 100;
    playerX = Math.max(5, Math.min(95, playerX));
    playerZ = Math.max(5, Math.min(95, playerZ));
  }

  scene.addEventListener('click', handleMove);
  scene.addEventListener('touchstart', handleMove, { passive: false });

  function update3DPositions() {
    // プレイヤー位置更新（3D遠近感）
    const scale = 0.4 + (playerZ / 100) * 1.0;
    player.style.left = playerX + '%';
    player.style.top = playerZ + '%';
    player.style.transform = `translate(-50%, -50%) scale(${scale})`;
    player.style.zIndex = Math.floor(playerZ);

    // トイレ位置更新＆当たり判定
    toilets.forEach(t => {
      if (t.dataset.eaten === 'true') return;
      const tx = parseFloat(t.dataset.x);
      const tz = parseFloat(t.dataset.z);
      const ts = 0.4 + (tz / 100) * 1.0;
      t.style.left = tx + '%';
      t.style.top = tz + '%';
      t.style.transform = `translate(-50%, -50%) scale(${ts})`;
      t.style.zIndex = Math.floor(tz);

      // 当たり判定
      const dist = Math.hypot(playerX - tx, playerZ - tz);
      if (dist < 8) {
        eatToilet(t);
      }
    });
  }

  function eatToilet(t) {
    if (t.dataset.eaten === 'true' || cleaned) return;
    t.dataset.eaten = 'true';
    t.classList.add('eaten');
    toiletsEaten++;
    counter.textContent = `🚽 ${toiletsEaten}/${TARGET}`;
    playSound('eat');
    showMessage(wrap, 'モグモグ🚽', 800);
    addCoins(2);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 500);

    if (toiletsEaten >= TARGET) {
      brainrotAppear();
    }
  }

  function brainrotAppear() {
    if (cleaned) return;
    stopBGM();
    playSound('brainrot');
    showBigMessage(wrap, d.brainrotAppear, 2000);

    const monster = document.createElement('div');
    monster.className = 'brainrot-3d';
    monster.innerHTML = '<span class="br-brain">🧠</span><span class="br-body">👾</span>';
    scene.appendChild(monster);

    // 迫ってくるアニメーション
    let mz = 0;
    const approach = setInterval(() => {
      if (cleaned) { clearInterval(approach); return; }
      mz += 2;
      const ms = 0.5 + (mz / 100) * 2.0;
      monster.style.left = '50%';
      monster.style.top = mz + '%';
      monster.style.transform = `translate(-50%, -50%) scale(${ms})`;
      if (mz >= 80) {
        clearInterval(approach);
        showBigMessage(wrap, d.brainrotEat, 2000);
        playSound('explode');
        monster.classList.add('eat-flash');
        setTimeout(() => {
          if (!cleaned) onComplete();
        }, 2500);
      }
    }, 50);
  }

  function gameLoop() {
    if (cleaned) return;
    update3DPositions();
    animId = requestAnimationFrame(gameLoop);
  }
  animId = requestAnimationFrame(gameLoop);

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (animId) cancelAnimationFrame(animId);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
