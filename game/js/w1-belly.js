// w1-belly.js - W1ステージ3: お腹の中（コイン＆包丁集め）

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, createCounter, createButton, initCoinUI, createProgressBar } from './ui.js';

export function initW1Belly(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let knives = 0;
  const KNIFE_TARGET = 6;
  let cleaned = false;
  let animId = null;
  let acidLevel = 100;
  let acidSpeed = 0.03;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w1-belly';

  // 体内空間
  const belly = document.createElement('div');
  belly.className = 'belly-space';

  // 泡演出
  for (let i = 0; i < 15; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'belly-bubble';
    bubble.style.left = Math.random() * 90 + 5 + '%';
    bubble.style.bottom = Math.random() * 80 + '%';
    bubble.style.animationDelay = Math.random() * 3 + 's';
    bubble.style.animationDuration = (2 + Math.random() * 3) + 's';
    belly.appendChild(bubble);
  }

  // コイン配置
  for (let i = 0; i < 30; i++) {
    const coin = document.createElement('div');
    coin.className = 'belly-coin';
    coin.textContent = '💰';
    coin.style.left = Math.random() * 85 + 5 + '%';
    coin.style.top = Math.random() * 70 + 5 + '%';
    coin.style.animationDelay = Math.random() * 2 + 's';
    const collectCoin = (e) => {
      e.preventDefault();
      if (cleaned || coin.dataset.collected === 'true') return;
      coin.dataset.collected = 'true';
      coin.classList.add('collected');
      playSound('coin');
      addCoins(1);
      setTimeout(() => { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 300);
    };
    coin.addEventListener('click', collectCoin);
    coin.addEventListener('touchstart', collectCoin, { passive: false });
    belly.appendChild(coin);
  }

  // 包丁配置（隠された場所に）
  const knifePositions = [
    { left: '15%', top: '20%', hint: '壁の裏' },
    { left: '80%', top: '15%', hint: '泡の中' },
    { left: '50%', top: '60%', hint: '奥の方' },
    { left: '25%', top: '70%', hint: '暗がり' },
    { left: '70%', top: '45%', hint: '隙間' },
    { left: '40%', top: '30%', hint: '壁際' },
  ];

  knifePositions.forEach((pos, i) => {
    const knife = document.createElement('div');
    knife.className = 'belly-knife';
    knife.textContent = '🔪';
    knife.style.left = pos.left;
    knife.style.top = pos.top;
    // 少しランダムに動かして見つけにくくする
    knife.style.animationDelay = (i * 0.5) + 's';
    const collectKnife = (e) => {
      e.preventDefault();
      if (cleaned || knife.dataset.collected === 'true') return;
      knife.dataset.collected = 'true';
      knife.classList.add('collected');
      knives++;
      playSound('knife');
      knifeCounter.update(knives);
      showMessage(wrap, `🔪 包丁ゲット！（${pos.hint}で発見）`, 1500);
      setTimeout(() => { if (knife.parentNode) knife.parentNode.removeChild(knife); }, 300);
      if (knives >= KNIFE_TARGET) {
        showCutButton();
      }
    };
    knife.addEventListener('click', collectKnife);
    knife.addEventListener('touchstart', collectKnife, { passive: false });
    belly.appendChild(knife);
  });

  // 消化液（酸）
  const acid = document.createElement('div');
  acid.className = 'belly-acid';
  belly.appendChild(acid);

  wrap.appendChild(belly);

  // UI
  const knifeCounter = createCounter(wrap, '🔪', 0, KNIFE_TARGET);
  const acidBar = createProgressBar(wrap, '⚠️ 消化液');
  initCoinUI(wrap);
  showMessage(wrap, d.bellyIntro, 3000);
  startBGM('w1');

  container.appendChild(wrap);

  // 切るボタン表示
  function showCutButton() {
    if (cleaned) return;
    showBigMessage(wrap, d.cutReady, 2000);
    const cutBtn = createButton('✂️ 切る！！！', () => {
      if (cleaned) return;
      cutAction(cutBtn);
    }, 'cut-btn pulse-btn');
    cutBtn.style.position = 'absolute';
    cutBtn.style.bottom = '20%';
    cutBtn.style.left = '50%';
    cutBtn.style.transform = 'translateX(-50%)';
    cutBtn.style.zIndex = '100';
    wrap.appendChild(cutBtn);
  }

  let cutCount = 0;
  function cutAction(btn) {
    cutCount++;
    playSound('cut');
    showMessage(wrap, '🔪✂️ザクッ！', 500);
    wrap.classList.add('shake');
    setTimeout(() => wrap.classList.remove('shake'), 200);

    if (cutCount >= 5) {
      if (btn.parentNode) btn.parentNode.removeChild(btn);
      stopBGM();
      showBigMessage(wrap, d.cutting, 1500);
      playSound('explode');

      // 脱出演出
      const flash = document.createElement('div');
      flash.className = 'white-flash';
      wrap.appendChild(flash);

      setTimeout(() => {
        showBigMessage(wrap, d.escaped, 2000);
        playSound('clear');
        setTimeout(() => {
          if (!cleaned) onComplete();
        }, 2500);
      }, 1500);
    }
  }

  // ゲームループ（消化液上昇）
  function gameLoop() {
    if (cleaned) return;
    acidLevel -= acidSpeed;
    acid.style.height = (100 - acidLevel) + '%';
    acidBar.update(100 - acidLevel);

    if (acidLevel <= 10) {
      // ゲームオーバー → リスタート
      showBigMessage(wrap, '消化されちゃった！💀 もう一度！', 2000);
      acidLevel = 100;
      acidSpeed += 0.005; // 少しずつ早く
    }

    animId = requestAnimationFrame(gameLoop);
  }
  animId = requestAnimationFrame(gameLoop);

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (animId) cancelAnimationFrame(animId);
      knifeCounter.remove();
      acidBar.remove();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
