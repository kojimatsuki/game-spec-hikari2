// w1-escape.js - W1ステージ4: バイク脱出＆ブレインロット戦

import { DIALOGUES, BRAINROT_FORMS } from './data.js';
import { playSound, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW1Escape(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let cleaned = false;
  let animId = null;
  let bikeY = 50;
  let speed = 3;
  let distance = 0;
  const GOAL = 1000;
  let brainrotForm = 0;
  let obstacles = [];
  let brainrotX = -10;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w1-escape';

  // 背景スクロール
  const bg = document.createElement('div');
  bg.className = 'escape-bg';
  wrap.appendChild(bg);

  // 道路
  const road = document.createElement('div');
  road.className = 'escape-road';
  wrap.appendChild(road);

  // バイク（ひかりちゃん）
  const bike = document.createElement('div');
  bike.className = 'bike-player';
  bike.textContent = '🏍️👧';
  wrap.appendChild(bike);

  // ブレインロット
  const brainrot = document.createElement('div');
  brainrot.className = 'brainrot-chaser';
  brainrot.textContent = BRAINROT_FORMS[0].emoji;
  wrap.appendChild(brainrot);

  // 距離表示
  const distDisplay = document.createElement('div');
  distDisplay.className = 'dist-display';
  distDisplay.textContent = `🏍️ 0m`;
  wrap.appendChild(distDisplay);

  // 形態表示
  const formDisplay = document.createElement('div');
  formDisplay.className = 'form-display';
  formDisplay.textContent = `👾 ${BRAINROT_FORMS[0].name}`;
  wrap.appendChild(formDisplay);

  initCoinUI(wrap);
  showMessage(wrap, d.bikeIntro, 3000);
  setForm('roblox');

  container.appendChild(wrap);

  // 操作：クリック/タップで上下移動
  let targetY = 50;
  function handleInput(e) {
    if (cleaned) return;
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    targetY = ((cy - rect.top) / rect.height) * 100;
    targetY = Math.max(15, Math.min(85, targetY));
  }
  wrap.addEventListener('click', handleInput);
  wrap.addEventListener('touchstart', handleInput, { passive: false });
  wrap.addEventListener('touchmove', handleInput, { passive: false });

  // 障害物生成
  function spawnObstacle() {
    if (cleaned) return;
    const obs = document.createElement('div');
    obs.className = 'obstacle';
    const types = ['🪨', '🌵', '🚧', '🛢️'];
    obs.textContent = types[Math.floor(Math.random() * types.length)];
    obs.dataset.x = 105;
    obs.dataset.y = 15 + Math.random() * 70;
    wrap.appendChild(obs);
    obstacles.push(obs);
  }

  let frameCount = 0;

  function gameLoop() {
    if (cleaned) return;
    frameCount++;

    // バイク位置スムーズ移動
    bikeY += (targetY - bikeY) * 0.1;
    bike.style.top = bikeY + '%';
    bike.style.left = '20%';

    // 距離
    distance += speed * 0.3;
    distDisplay.textContent = `🏍️ ${Math.floor(distance)}m`;

    // 障害物移動
    if (frameCount % 40 === 0) spawnObstacle();
    obstacles = obstacles.filter(obs => {
      let ox = parseFloat(obs.dataset.x) - speed * 0.5;
      obs.dataset.x = ox;
      obs.style.left = ox + '%';
      obs.style.top = obs.dataset.y + '%';

      // 当たり判定
      if (Math.abs(ox - 20) < 5 && Math.abs(parseFloat(obs.dataset.y) - bikeY) < 8) {
        showMessage(wrap, 'ガシャン！💥', 800);
        playSound('hit');
        distance = Math.max(0, distance - 30);
      }

      if (ox < -10) {
        if (obs.parentNode) obs.parentNode.removeChild(obs);
        addCoins(1);
        return false;
      }
      return true;
    });

    // ブレインロット追跡
    const form = BRAINROT_FORMS[brainrotForm];
    brainrotX += 0.02;
    if (brainrotX > 5) brainrotX = 5;
    brainrot.style.left = brainrotX + '%';
    brainrot.style.top = bikeY + Math.sin(frameCount * 0.05) * 10 + '%';
    brainrot.style.fontSize = form.size + 'px';

    // 進化チェック
    if (distance > 300 && brainrotForm === 0) {
      brainrotForm = 1;
      brainrot.textContent = BRAINROT_FORMS[1].emoji;
      formDisplay.textContent = `👿 ${BRAINROT_FORMS[1].name}`;
      showBigMessage(wrap, d.brainrotEvolve + '👿', 2000);
      playSound('brainrot');
      speed += 0.5;
    }
    if (distance > 600 && brainrotForm === 1) {
      brainrotForm = 2;
      brainrot.textContent = BRAINROT_FORMS[2].emoji;
      formDisplay.textContent = `💀 ${BRAINROT_FORMS[2].name}`;
      showBigMessage(wrap, d.brainrotEvolve + '💀 巨大化！', 2000);
      playSound('brainrot');
      speed += 0.5;
    }

    // バイクSE
    if (frameCount % 15 === 0) playSound('bike');

    // ゴール
    if (distance >= GOAL) {
      brainrotDeath();
      return;
    }

    // 背景スクロール
    bg.style.backgroundPositionX = -(frameCount * 2) + 'px';
    road.style.backgroundPositionX = -(frameCount * 3) + 'px';

    animId = requestAnimationFrame(gameLoop);
  }

  function brainrotDeath() {
    if (cleaned) return;
    showBigMessage(wrap, d.brainrotDeath, 2500);
    brainrot.classList.add('dying');

    setTimeout(() => {
      if (cleaned) return;
      playSound('explode');
      brainrot.textContent = '💥';
      brainrot.style.fontSize = '150px';
      brainrot.classList.add('exploding');

      const flash = document.createElement('div');
      flash.className = 'white-flash';
      wrap.appendChild(flash);

      setTimeout(() => {
        showBigMessage(wrap, d.w1Clear, 3000);
        playSound('clear');
        addCoins(20);
        setTimeout(() => {
          if (!cleaned) onComplete();
        }, 3500);
      }, 1500);
    }, 2500);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (animId) cancelAnimationFrame(animId);
      obstacles.forEach(o => { if (o.parentNode) o.parentNode.removeChild(o); });
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
