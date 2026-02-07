// scenes.js - シーン遷移（タイトル/ワールド選択/エンディング）

import { GAME_TITLE, WORLDS, DIALOGUES } from './data.js';
import { playSound } from './audio.js';
import { createButton, showBigMessage } from './ui.js';
import { getCoins, resetCoins } from './economy.js';

export function initTitle(container, gameState, onStartGame) {
  let cleaned = false;
  const wrap = document.createElement('div');
  wrap.className = 'scene-title';

  // タイトル
  const titleEl = document.createElement('h1');
  titleEl.className = 'title-text';
  titleEl.textContent = GAME_TITLE;
  wrap.appendChild(titleEl);

  // 変身アニメーション
  const hikariAnim = document.createElement('div');
  hikariAnim.className = 'title-hikari';
  const forms = ['👧✨', '🏍️👧', '🧙‍♀️✨', '🐱', '📺👧🎤'];
  let formIdx = 0;
  hikariAnim.textContent = forms[0];
  wrap.appendChild(hikariAnim);

  const formInterval = setInterval(() => {
    if (cleaned) return;
    formIdx = (formIdx + 1) % forms.length;
    hikariAnim.classList.add('form-change');
    setTimeout(() => {
      hikariAnim.textContent = forms[formIdx];
      hikariAnim.classList.remove('form-change');
    }, 300);
  }, 1500);

  // ブレインロットが背景にチラッと
  const brainrot = document.createElement('div');
  brainrot.className = 'title-brainrot';
  brainrot.textContent = '👾';
  wrap.appendChild(brainrot);

  // 飛んでくるうんこ
  const poopInterval = setInterval(() => {
    if (cleaned) return;
    const poop = document.createElement('div');
    poop.className = 'title-poop';
    poop.textContent = '💩';
    poop.style.left = (Math.random() * 80 + 10) + '%';
    wrap.appendChild(poop);
    setTimeout(() => { if (poop.parentNode) poop.parentNode.removeChild(poop); }, 2000);
  }, 2000);

  // はじめるボタン
  const startBtn = createButton('🎮 はじめる', () => {
    playSound('clear');
    cleanup();
    onStartGame();
  }, 'start-btn');
  wrap.appendChild(startBtn);

  container.appendChild(wrap);

  function cleanup() {
    cleaned = true;
    clearInterval(formInterval);
    clearInterval(poopInterval);
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  return { cleanup };
}

export function initWorldSelect(container, gameState, onSelectStage) {
  let cleaned = false;
  const wrap = document.createElement('div');
  wrap.className = 'scene-world-select';

  const title = document.createElement('h2');
  title.className = 'select-title';
  title.textContent = '🗺️ ワールドを選ぼう！';
  wrap.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'world-grid';

  WORLDS.forEach((world, idx) => {
    const card = document.createElement('div');
    card.className = 'world-card';
    const unlocked = idx === 0 || gameState.worldsCompleted[idx - 1];

    if (unlocked) {
      card.classList.add('unlocked');
      const completed = gameState.worldsCompleted[idx];
      card.innerHTML = `
        <div class="world-icon">${world.icon}</div>
        <div class="world-name">ワールド${world.id}</div>
        <div class="world-desc">${world.name}</div>
        ${completed ? '<div class="world-clear">✅ クリア</div>' : ''}
      `;
      const selectWorld = (e) => {
        e.preventDefault();
        playSound('tap');
        cleanup();
        onSelectStage(world.stages[0].id);
      };
      card.addEventListener('click', selectWorld);
      card.addEventListener('touchstart', selectWorld, { passive: false });
    } else {
      card.classList.add('locked');
      card.innerHTML = `
        <div class="world-icon">🔒</div>
        <div class="world-name">ワールド${world.id}</div>
        <div class="world-desc">???</div>
      `;
    }
    grid.appendChild(card);
  });

  // 隠しステージ
  const secretCard = document.createElement('div');
  secretCard.className = 'world-card';
  const allClear = gameState.worldsCompleted.every(w => w);
  if (allClear) {
    secretCard.classList.add('unlocked', 'secret');
    secretCard.innerHTML = `
      <div class="world-icon">💀</div>
      <div class="world-name">隠しステージ</div>
      <div class="world-desc">お化け連打バトル</div>
      ${gameState.secretCompleted ? '<div class="world-clear">🏆 伝説</div>' : ''}
    `;
    const selectSecret = (e) => {
      e.preventDefault();
      playSound('tap');
      cleanup();
      onSelectStage('secret');
    };
    secretCard.addEventListener('click', selectSecret);
    secretCard.addEventListener('touchstart', selectSecret, { passive: false });
  } else {
    secretCard.classList.add('locked');
    secretCard.innerHTML = `
      <div class="world-icon">🔒</div>
      <div class="world-name">???</div>
      <div class="world-desc">全ワールドクリアで解放</div>
    `;
  }
  grid.appendChild(secretCard);

  wrap.appendChild(grid);

  // コイン表示
  const coinInfo = document.createElement('div');
  coinInfo.className = 'coin-info';
  coinInfo.textContent = `💰 ${getCoins()} コイン`;
  wrap.appendChild(coinInfo);

  container.appendChild(wrap);

  function cleanup() {
    cleaned = true;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  return { cleanup };
}

export function initEnding(container, gameState, onRestart) {
  let cleaned = false;
  const wrap = document.createElement('div');
  wrap.className = 'scene-ending';

  const isSecret = gameState.secretCompleted;
  const lines = isSecret ? DIALOGUES.ending.secret : DIALOGUES.ending.normal;

  // エンディングタイトル
  const endTitle = document.createElement('h1');
  endTitle.className = 'ending-title';
  endTitle.textContent = isSecret ? '🏆 真のエンディング 🏆' : '🎬 エンディング';
  wrap.appendChild(endTitle);

  // ダイジェスト
  const digest = document.createElement('div');
  digest.className = 'ending-digest';

  if (isSecret) {
    // 全キャラ集合
    const chars = document.createElement('div');
    chars.className = 'all-chars';
    chars.textContent = '👧✨ 👾 👦👧👩‍🦰🧒👱 🧸 👩 🐱 📺';
    digest.appendChild(chars);
  }

  lines.forEach((line, i) => {
    const p = document.createElement('p');
    p.className = 'ending-line';
    p.textContent = line;
    p.style.animationDelay = (i * 2) + 's';
    digest.appendChild(p);
  });

  wrap.appendChild(digest);

  // スタッフロール
  const credits = document.createElement('div');
  credits.className = 'credits';
  credits.innerHTML = `
    <p>🎮 ひかりちゃん大冒険</p>
    <p>〜イタリアンブレインロットからの脱出〜</p>
    <p>&nbsp;</p>
    <p>原案: ひかりちゃん</p>
    <p>プログラム: Claude Code</p>
    <p>&nbsp;</p>
    <p>ありがとうございました！</p>
    <p>💰 合計 ${getCoins()} コイン集めました！</p>
  `;
  wrap.appendChild(credits);

  // ボタン（シークレットクリア後は「もう一度」、通常は「つぎへ」）
  const btnText = isSecret ? '🔄 もう一度あそぶ' : '▶ つぎへ（隠しステージ解放！）';
  const restartBtn = createButton(btnText, () => {
    playSound('tap');
    cleanup();
    onRestart();
  }, 'restart-btn');
  restartBtn.style.animationDelay = '6s';
  wrap.appendChild(restartBtn);

  container.appendChild(wrap);
  playSound('clear');

  function cleanup() {
    cleaned = true;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
  }

  return { cleanup };
}
