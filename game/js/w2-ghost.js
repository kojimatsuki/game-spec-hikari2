// w2-ghost.js - W2ステージ2: 夜のお化けから逃げる

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, createCounter, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW2Ghost(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let animId = null;
  let ghostsDefeated = 0;
  const TOTAL_GHOSTS = 12;
  let playerX = 50, playerY = 70;
  let ghosts = [];
  let stageCompleted = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w2-ghost';

  // 暗い背景
  const darkBg = document.createElement('div');
  darkBg.className = 'dark-school';

  // 学校の窓が光る演出
  for (let i = 0; i < 6; i++) {
    const win = document.createElement('div');
    win.className = 'school-window';
    win.style.left = (10 + i * 15) + '%';
    win.style.top = (10 + (i % 2) * 15) + '%';
    win.style.animationDelay = (i * 0.5) + 's';
    darkBg.appendChild(win);
  }

  // 月
  const moon = document.createElement('div');
  moon.className = 'moon';
  moon.textContent = '🌙';
  darkBg.appendChild(moon);

  wrap.appendChild(darkBg);

  // プレイヤー
  const player = document.createElement('div');
  player.className = 'ghost-player';
  player.textContent = '👧😨';
  wrap.appendChild(player);

  // お化け生成
  const ghostTypes = ['👻', '💀', '🎃'];
  for (let i = 0; i < TOTAL_GHOSTS; i++) {
    const g = document.createElement('div');
    g.className = 'ghost-enemy';
    g.textContent = ghostTypes[i % ghostTypes.length];
    g.dataset.x = Math.random() * 80 + 10;
    g.dataset.y = Math.random() * 60 + 5;
    g.dataset.dx = (Math.random() - 0.5) * 2;
    g.dataset.dy = (Math.random() - 0.5) * 2;
    g.dataset.alive = 'true';
    g.style.animationDelay = (Math.random() * 2) + 's';

    const defeatGhost = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (cleaned || g.dataset.alive !== 'true') return;
      g.dataset.alive = 'false';
      g.classList.add('ghost-defeated');
      ghostsDefeated++;
      playSound('hit');
      showMessage(wrap, '一発！💥', 600);
      ghostCounter.update(ghostsDefeated);
      addCoins(2);
      setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 500);
      checkComplete();
    };
    g.addEventListener('click', defeatGhost);
    g.addEventListener('touchstart', defeatGhost, { passive: false });
    wrap.appendChild(g);
    ghosts.push(g);
  }

  // 友達応援
  const cheerEl = document.createElement('div');
  cheerEl.className = 'cheer-text';
  cheerEl.textContent = 'がんばれー！📣';
  wrap.appendChild(cheerEl);

  const ghostCounter = createCounter(wrap, '👻', 0, TOTAL_GHOSTS);
  initCoinUI(wrap);
  showMessage(wrap, d.nightIntro, 2500);
  setTimeout(() => showMessage(wrap, d.ghostTip, 2500), 3000);
  startBGM('w2night');
  setForm('scared');

  container.appendChild(wrap);

  // プレイヤー移動
  function handleMove(e) {
    if (cleaned) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    playerX = ((cx - rect.left) / rect.width) * 100;
    playerY = ((cy - rect.top) / rect.height) * 100;
    playerX = Math.max(5, Math.min(95, playerX));
    playerY = Math.max(5, Math.min(95, playerY));
  }
  wrap.addEventListener('mousemove', handleMove);
  wrap.addEventListener('touchmove', handleMove, { passive: false });

  function gameLoop() {
    if (cleaned) return;

    // プレイヤー更新
    player.style.left = playerX + '%';
    player.style.top = playerY + '%';

    // お化け移動
    ghosts.forEach(g => {
      if (g.dataset.alive !== 'true') return;
      let gx = parseFloat(g.dataset.x);
      let gy = parseFloat(g.dataset.y);
      let dx = parseFloat(g.dataset.dx);
      let dy = parseFloat(g.dataset.dy);

      gx += dx * 0.3;
      gy += dy * 0.3;

      // 壁で跳ね返り
      if (gx < 5 || gx > 95) dx = -dx;
      if (gy < 5 || gy > 85) dy = -dy;

      // たまに方向転換
      if (Math.random() < 0.01) dx = (Math.random() - 0.5) * 2;
      if (Math.random() < 0.01) dy = (Math.random() - 0.5) * 2;

      g.dataset.x = gx;
      g.dataset.y = gy;
      g.dataset.dx = dx;
      g.dataset.dy = dy;
      g.style.left = gx + '%';
      g.style.top = gy + '%';

      // プレイヤーとの当たり判定
      if (Math.hypot(gx - playerX, gy - playerY) < 6) {
        showMessage(wrap, '😱 つかまった！', 1000);
        playSound('ghost');
        playerX = 50;
        playerY = 70;
      }
    });

    animId = requestAnimationFrame(gameLoop);
  }
  animId = requestAnimationFrame(gameLoop);

  function checkComplete() {
    if (stageCompleted) return;
    if (ghostsDefeated >= TOTAL_GHOSTS) {
      stageCompleted = true;
      stopBGM();
      showBigMessage(wrap, 'お化け全滅！🎉 次はフライトだ！', 2500);
      playSound('clear');
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3000);
    }
  }

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (animId) cancelAnimationFrame(animId);
      ghostCounter.remove();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
