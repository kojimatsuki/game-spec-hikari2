// w1-poop.js - W1ステージ1: うんこ3回

import { DIALOGUES } from './data.js';
import { playSound } from './audio.js';
import { showMessage, showBigMessage, createButton } from './ui.js';
import { setForm } from './hikari.js';

export function initW1Poop(container, gameState, onComplete) {
  const d = DIALOGUES.w1;
  let count = 0;
  let cleaned = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w1-poop';

  const instruction = document.createElement('div');
  instruction.className = 'instruction-text';
  instruction.textContent = d.poopIntro;
  wrap.appendChild(instruction);

  const counterEl = document.createElement('div');
  counterEl.className = 'poop-counter';
  counterEl.textContent = '💩 0/3';
  wrap.appendChild(counterEl);

  const poopBtn = document.createElement('div');
  poopBtn.className = 'poop-btn';
  poopBtn.textContent = '💩';

  const handleTap = (e) => {
    e.preventDefault();
    if (cleaned) return;
    count++;
    playSound('poop');
    counterEl.textContent = `💩 ${count}/3`;

    poopBtn.classList.add('poop-bounce');
    setTimeout(() => poopBtn.classList.remove('poop-bounce'), 300);

    // 画面にうんこを散らす
    const poop = document.createElement('div');
    poop.className = 'flying-poop';
    poop.textContent = '💩';
    poop.style.left = Math.random() * 80 + 10 + '%';
    poop.style.top = Math.random() * 60 + 10 + '%';
    poop.style.fontSize = (20 + Math.random() * 30) + 'px';
    wrap.appendChild(poop);
    setTimeout(() => { if (poop.parentNode) poop.parentNode.removeChild(poop); }, 1500);

    if (count >= 3) {
      poopBtn.style.pointerEvents = 'none';
      showBigMessage(wrap, d.evolved, 2000);
      setTimeout(() => evolveTransition(), 2500);
    }
  };

  poopBtn.addEventListener('click', handleTap);
  poopBtn.addEventListener('touchstart', handleTap, { passive: false });
  wrap.appendChild(poopBtn);

  container.appendChild(wrap);

  function evolveTransition() {
    if (cleaned) return;
    wrap.classList.add('evolve-flash');
    setForm('roblox');

    // Roblox風変化演出
    const blocks = document.createElement('div');
    blocks.className = 'roblox-transition';
    for (let i = 0; i < 20; i++) {
      const block = document.createElement('div');
      block.className = 'roblox-block';
      block.style.left = Math.random() * 100 + '%';
      block.style.top = Math.random() * 100 + '%';
      block.style.animationDelay = Math.random() * 0.5 + 's';
      blocks.appendChild(block);
    }
    wrap.appendChild(blocks);

    playSound('clear');
    setTimeout(() => {
      if (!cleaned) onComplete();
    }, 2000);
  }

  return {
    cleanup() {
      cleaned = true;
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
