// w3-dolls.js - W3ステージ1: 人形食べ＆光集め

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, createCounter, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW3Dolls(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false;
  let animId = null;
  let lightsCollected = 0;
  const LIGHT_TARGET = 50;
  let brightness = 20;
  let magicAwakened = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w3-dolls';
  wrap.style.filter = `brightness(${brightness}%)`;

  const field = document.createElement('div');
  field.className = 'dolls-field';

  // 人形を配置
  const dollTypes = ['🧸', '🪆', '🎎', '🪅', '🧶'];
  const dolls = [];
  for (let i = 0; i < 25; i++) {
    const doll = document.createElement('div');
    doll.className = 'doll-item';
    doll.textContent = dollTypes[i % dollTypes.length];
    doll.style.left = (5 + Math.random() * 85) + '%';
    doll.style.top = (10 + Math.random() * 75) + '%';
    doll.style.animationDelay = (Math.random() * 2) + 's';
    doll.dataset.eaten = 'false';

    const eatDoll = (e) => {
      e.preventDefault();
      if (cleaned || doll.dataset.eaten === 'true') return;
      doll.dataset.eaten = 'true';
      doll.classList.add('eaten');
      playSound('eat');
      showMessage(wrap, 'パクッ！🍴', 500);

      // 光の玉を出す
      setTimeout(() => {
        if (cleaned) return;
        if (doll.parentNode) doll.parentNode.removeChild(doll);
        spawnLights(parseFloat(doll.style.left), parseFloat(doll.style.top));
      }, 300);
    };
    doll.addEventListener('click', eatDoll);
    doll.addEventListener('touchstart', eatDoll, { passive: false });
    field.appendChild(doll);
    dolls.push(doll);
  }

  wrap.appendChild(field);

  const lightCounter = createCounter(wrap, '✨', 0, LIGHT_TARGET);
  initCoinUI(wrap);
  showMessage(wrap, d.dollIntro, 3000);
  startBGM('w3');
  setForm('normal');

  container.appendChild(wrap);

  function spawnLights(x, y) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const light = document.createElement('div');
      light.className = 'light-orb';
      light.textContent = '✨';
      const lx = x + (Math.random() - 0.5) * 20;
      const ly = y + (Math.random() - 0.5) * 20;
      light.style.left = Math.max(5, Math.min(90, lx)) + '%';
      light.style.top = Math.max(5, Math.min(85, ly)) + '%';
      light.style.animationDelay = (i * 0.1) + 's';

      const collectLight = (e) => {
        e.preventDefault();
        if (cleaned || light.dataset.collected === 'true') return;
        light.dataset.collected = 'true';
        light.classList.add('collected');
        lightsCollected++;
        lightCounter.update(lightsCollected);
        playSound('coin');
        addCoins(1);

        // 画面を明るくする
        brightness = 20 + (lightsCollected / LIGHT_TARGET) * 80;
        wrap.style.filter = `brightness(${Math.min(100, brightness)}%)`;

        setTimeout(() => { if (light.parentNode) light.parentNode.removeChild(light); }, 300);

        if (lightsCollected >= LIGHT_TARGET) {
          awakenMagic();
        }
      };
      light.addEventListener('click', collectLight);
      light.addEventListener('touchstart', collectLight, { passive: false });
      field.appendChild(light);
    }
  }

  // 足りない場合、追加の人形をスポーン
  let respawnTimer = setInterval(() => {
    if (cleaned) { clearInterval(respawnTimer); return; }
    if (lightsCollected < LIGHT_TARGET) {
      const remaining = field.querySelectorAll('.doll-item:not(.eaten)');
      if (remaining.length < 5) {
        for (let i = 0; i < 5; i++) {
          const doll = document.createElement('div');
          doll.className = 'doll-item';
          doll.textContent = dollTypes[Math.floor(Math.random() * dollTypes.length)];
          doll.style.left = (5 + Math.random() * 85) + '%';
          doll.style.top = (10 + Math.random() * 75) + '%';
          doll.dataset.eaten = 'false';
          const eatDoll = (e) => {
            e.preventDefault();
            if (cleaned || doll.dataset.eaten === 'true') return;
            doll.dataset.eaten = 'true';
            doll.classList.add('eaten');
            playSound('eat');
            showMessage(wrap, 'パクッ！🍴', 500);
            setTimeout(() => {
              if (cleaned) return;
              if (doll.parentNode) doll.parentNode.removeChild(doll);
              spawnLights(parseFloat(doll.style.left), parseFloat(doll.style.top));
            }, 300);
          };
          doll.addEventListener('click', eatDoll);
          doll.addEventListener('touchstart', eatDoll, { passive: false });
          field.appendChild(doll);
        }
      }
    }
  }, 3000);

  function awakenMagic() {
    if (cleaned || magicAwakened) return;
    magicAwakened = true;
    stopBGM();
    clearInterval(respawnTimer);
    wrap.style.filter = 'brightness(100%)';

    // 覚醒演出
    const overlay = document.createElement('div');
    overlay.className = 'magic-awaken-overlay';
    wrap.appendChild(overlay);

    playSound('magic');
    showBigMessage(wrap, d.magicAwaken, 3000);
    setForm('magician');

    // キラキラパーティクル
    for (let i = 0; i < 30; i++) {
      const spark = document.createElement('div');
      spark.className = 'magic-spark';
      spark.textContent = ['✨', '⭐', '🌟', '💫'][Math.floor(Math.random() * 4)];
      spark.style.left = Math.random() * 100 + '%';
      spark.style.top = Math.random() * 100 + '%';
      spark.style.animationDelay = (Math.random() * 1) + 's';
      overlay.appendChild(spark);
    }

    setTimeout(() => {
      if (!cleaned) onComplete();
    }, 4000);
  }

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      clearInterval(respawnTimer);
      if (animId) cancelAnimationFrame(animId);
      lightCounter.remove();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
