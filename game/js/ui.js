// ui.js - 共通UI（スコア/コイン/メッセージ）

import { getCoins, onCoinsChange } from './economy.js';

let coinDisplay = null;
let unsubCoins = null;

export function initCoinUI(container) {
  removeCoinUI();
  coinDisplay = document.createElement('div');
  coinDisplay.className = 'coin-display';
  coinDisplay.textContent = `💰 ${getCoins()}`;
  container.appendChild(coinDisplay);
  unsubCoins = onCoinsChange(c => {
    if (coinDisplay) coinDisplay.textContent = `💰 ${c}`;
  });
}

export function removeCoinUI() {
  if (coinDisplay && coinDisplay.parentNode) coinDisplay.parentNode.removeChild(coinDisplay);
  coinDisplay = null;
  if (unsubCoins) { unsubCoins(); unsubCoins = null; }
}

export function showMessage(container, text, duration = 2000) {
  const msg = document.createElement('div');
  msg.className = 'floating-message';
  msg.textContent = text;
  container.appendChild(msg);
  requestAnimationFrame(() => msg.classList.add('show'));
  setTimeout(() => {
    msg.classList.remove('show');
    msg.classList.add('hide');
    setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 500);
  }, duration);
}

export function showBigMessage(container, text, duration = 3000) {
  const msg = document.createElement('div');
  msg.className = 'big-message';
  msg.textContent = text;
  container.appendChild(msg);
  requestAnimationFrame(() => msg.classList.add('show'));
  setTimeout(() => {
    msg.classList.remove('show');
    msg.classList.add('hide');
    setTimeout(() => { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 500);
  }, duration);
}

export function createCounter(container, emoji, current, total) {
  const el = document.createElement('div');
  el.className = 'counter-display';
  el.textContent = `${emoji} ${current}/${total}`;
  container.appendChild(el);
  return {
    update(c) { el.textContent = `${emoji} ${c}/${total}`; },
    remove() { if (el.parentNode) el.parentNode.removeChild(el); }
  };
}

export function createButton(text, onClick, className = '') {
  const btn = document.createElement('button');
  btn.className = `game-btn ${className}`.trim();
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); onClick(e); }, { passive: false });
  return btn;
}

export function createStageHeader(container, title) {
  const h = document.createElement('div');
  h.className = 'stage-header';
  h.textContent = title;
  container.appendChild(h);
  return h;
}

export function showClearScreen(container, text, onNext) {
  const overlay = document.createElement('div');
  overlay.className = 'clear-overlay';
  const msg = document.createElement('div');
  msg.className = 'clear-text';
  msg.textContent = text;
  overlay.appendChild(msg);
  const btn = createButton('つぎへ ▶', () => {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    onNext();
  }, 'clear-btn');
  overlay.appendChild(btn);
  container.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
}

export function createProgressBar(container, label) {
  const wrap = document.createElement('div');
  wrap.className = 'progress-wrap';
  const lbl = document.createElement('span');
  lbl.className = 'progress-label';
  lbl.textContent = label;
  const bar = document.createElement('div');
  bar.className = 'progress-bar';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  bar.appendChild(fill);
  wrap.appendChild(lbl);
  wrap.appendChild(bar);
  container.appendChild(wrap);
  return {
    update(pct) { fill.style.width = Math.min(100, Math.max(0, pct)) + '%'; },
    remove() { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }
  };
}
