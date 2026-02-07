// secret-boss.js - 隠しステージ: お化け連打→爆発

import { DIALOGUES } from './data.js';
import { playSound, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, initCoinUI } from './ui.js';

export function initSecretBoss(container, gameState, onComplete) {
  const d = DIALOGUES.secret;
  let cleaned = false;
  let animId = null;
  let ghostsDefeated = 0;
  const TOTAL = 50;
  let combo = 0;
  let phase = 'swarm'; // swarm, boss
  let bossHP = 100;
  let bossExploded = false;
  let ghosts = [];

  const wrap = document.createElement('div');
  wrap.className = 'stage-secret';

  // コンボ表示
  const comboEl = document.createElement('div');
  comboEl.className = 'combo-display';
  comboEl.textContent = '0 コンボ！';
  wrap.appendChild(comboEl);

  // 進捗
  const progressEl = document.createElement('div');
  progressEl.className = 'secret-progress';
  progressEl.textContent = `👻 0/${TOTAL}`;
  wrap.appendChild(progressEl);

  initCoinUI(wrap);
  showMessage(wrap, d.intro, 3000);

  container.appendChild(wrap);

  // お化け大量生成
  spawnGhostWave();

  function spawnGhostWave() {
    const batchSize = Math.min(15, TOTAL - ghostsDefeated);
    for (let i = 0; i < batchSize; i++) {
      spawnGhost();
    }
  }

  function spawnGhost() {
    const g = document.createElement('div');
    g.className = 'secret-ghost';
    g.textContent = '👻';
    g.dataset.alive = 'true';
    g.dataset.x = Math.random() * 85 + 5;
    g.dataset.y = Math.random() * 75 + 5;
    g.dataset.sizePhase = 0;
    g.dataset.dx = (Math.random() - 0.5) * 3;
    g.dataset.dy = (Math.random() - 0.5) * 3;

    const hitGhost = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (cleaned || g.dataset.alive !== 'true') return;
      g.dataset.alive = 'false';
      ghostsDefeated++;
      combo++;
      g.classList.add('ghost-popped');
      playSound('hit');

      comboEl.textContent = `${combo} コンボ！`;
      if (combo % 10 === 0) {
        comboEl.classList.add('combo-flash');
        setTimeout(() => comboEl.classList.remove('combo-flash'), 300);
        showMessage(wrap, `🔥 ${combo}コンボ！`, 800);
      }
      progressEl.textContent = `👻 ${ghostsDefeated}/${TOTAL}`;
      addCoins(1);

      setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 300);

      // 追加スポーン
      const aliveCount = ghosts.filter(gh => gh.dataset.alive === 'true').length;
      if (ghostsDefeated < TOTAL && aliveCount < 8) {
        for (let i = 0; i < 5; i++) {
          if (ghostsDefeated + aliveCount + i < TOTAL) spawnGhost();
        }
      }

      if (ghostsDefeated >= TOTAL) {
        startBossPhase();
      }
    };
    g.addEventListener('click', hitGhost);
    g.addEventListener('touchstart', hitGhost, { passive: false });
    wrap.appendChild(g);
    ghosts.push(g);
  }

  // お化けアニメーション
  function updateGhosts() {
    ghosts.forEach(g => {
      if (g.dataset.alive !== 'true') return;
      let x = parseFloat(g.dataset.x);
      let y = parseFloat(g.dataset.y);
      let dx = parseFloat(g.dataset.dx);
      let dy = parseFloat(g.dataset.dy);
      let sp = parseFloat(g.dataset.sizePhase);

      x += dx * 0.3;
      y += dy * 0.3;
      if (x < 3 || x > 92) dx = -dx;
      if (y < 3 || y > 82) dy = -dy;
      if (Math.random() < 0.02) dx = (Math.random() - 0.5) * 3;
      if (Math.random() < 0.02) dy = (Math.random() - 0.5) * 3;

      // サイズ変化（プルプル）
      sp += 0.05;
      const sizeMulti = 1 + Math.sin(sp) * 0.4;
      const baseSize = 28 + Math.random() * 4;

      g.dataset.x = x;
      g.dataset.y = y;
      g.dataset.dx = dx;
      g.dataset.dy = dy;
      g.dataset.sizePhase = sp;
      g.style.left = x + '%';
      g.style.top = y + '%';
      g.style.fontSize = (baseSize * sizeMulti) + 'px';
    });
  }

  // ボスフェーズ
  function startBossPhase() {
    if (cleaned) return;
    phase = 'boss';
    showBigMessage(wrap, d.bossAppear, 2500);
    playSound('brainrot');

    // 残ったお化けを消す
    ghosts.forEach(g => {
      if (g.parentNode) g.parentNode.removeChild(g);
    });
    ghosts = [];

    setTimeout(() => {
      if (cleaned) return;
      spawnBoss();
    }, 2500);
  }

  let boss = null;
  let bossEyePhase = 0;

  function spawnBoss() {
    boss = document.createElement('div');
    boss.className = 'boss-ghost';
    boss.innerHTML = '<div class="boss-body">👻</div><div class="boss-eyes">👀</div>';
    boss.style.left = '50%';
    boss.style.top = '40%';
    wrap.appendChild(boss);

    // HP表示
    const hpBar = document.createElement('div');
    hpBar.className = 'boss-hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = 'boss-hp-fill';
    hpFill.id = 'boss-hp';
    hpBar.appendChild(hpFill);
    wrap.appendChild(hpBar);

    progressEl.textContent = `BOSS HP: ${bossHP}%`;

    const hitBoss = (e) => {
      e.preventDefault();
      if (cleaned || bossHP <= 0) return;
      bossHP -= 2;
      combo++;
      comboEl.textContent = `${combo} コンボ！`;
      playSound('hit');

      const hpEl = document.getElementById('boss-hp');
      if (hpEl) hpEl.style.width = bossHP + '%';
      progressEl.textContent = `BOSS HP: ${Math.max(0, bossHP)}%`;

      boss.classList.add('boss-hit');
      setTimeout(() => boss.classList.remove('boss-hit'), 100);

      if (combo % 20 === 0) {
        showMessage(wrap, `🔥🔥 ${combo}コンボ！！`, 800);
      }

      // 背景が徐々に明るく
      const brightness = 100 - bossHP;
      wrap.style.backgroundColor = `rgba(255, 255, 255, ${brightness / 200})`;

      if (bossHP <= 0) {
        bossExplode();
      }
    };
    boss.addEventListener('click', hitBoss);
    boss.addEventListener('touchstart', hitBoss, { passive: false });
  }

  function bossExplode() {
    if (cleaned || bossExploded) return;
    bossExploded = true;
    playSound('bigExplode');
    showBigMessage(wrap, d.explosion, 3000);

    boss.classList.add('boss-exploding');

    // 大爆発フラッシュ
    const flash = document.createElement('div');
    flash.className = 'mega-flash';
    wrap.appendChild(flash);

    // パーティクル
    for (let i = 0; i < 50; i++) {
      const p = document.createElement('div');
      p.className = 'victory-particle';
      p.textContent = ['✨', '🌟', '💫', '⭐', '🎉', '🎊', '🏆'][Math.floor(Math.random() * 7)];
      p.style.left = 50 + (Math.random() - 0.5) * 80 + '%';
      p.style.top = 40 + (Math.random() - 0.5) * 60 + '%';
      p.style.animationDelay = (Math.random() * 0.5) + 's';
      wrap.appendChild(p);
    }

    setTimeout(() => {
      if (cleaned) return;
      showBigMessage(wrap, d.allClear, 4000);
      playSound('clear');
      addCoins(100);

      // 伝説の称号
      const title = document.createElement('div');
      title.className = 'legend-title';
      title.textContent = '🏆 伝説のプレイヤー 🏆';
      wrap.appendChild(title);

      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 5000);
    }, 3000);
  }

  function gameLoop() {
    if (cleaned) return;
    if (phase === 'swarm') {
      updateGhosts();
    }
    if (phase === 'boss' && boss) {
      bossEyePhase += 0.05;
      const eyes = boss.querySelector('.boss-eyes');
      if (eyes) {
        eyes.style.transform = `translate(${Math.sin(bossEyePhase) * 10}px, ${Math.cos(bossEyePhase * 0.7) * 5}px)`;
      }
    }
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
