// main.js - ゲーム初期化・ワールド管理（3Dポリゴン版）

import { initEngine } from './engine3d.js';
import { initTitle, initWorldSelect, initEnding } from './scenes.js';
import { initW1Poop } from './w1-poop.js';
import { initW1Toilet } from './w1-toilet.js';
import { initW1Belly } from './w1-belly.js';
import { initW1Escape } from './w1-escape.js';
import { initW2School } from './w2-school.js';
import { initW2Ghost } from './w2-ghost.js';
import { initW2Flying } from './w2-flying.js';
import { initW3Dolls } from './w3-dolls.js';
import { initW3Magic } from './w3-magic.js';
import { initW3TV } from './w3-tv.js';
import { initSecretBoss } from './secret-boss.js';
import { resumeAudio, stopBGM } from './audio.js';
import { resetCoins } from './economy.js';
import { removeCoinUI } from './ui.js';
import { resetForm } from './hikari.js';

const container = document.getElementById('game-container');

// ローディング画面を消す
function hideLoading() {
  const el = document.getElementById('loading');
  if (el) el.remove();
}

// エラー表示
function showError(msg) {
  const el = document.getElementById('loading');
  if (el) {
    el.textContent = 'エラー: ' + msg;
  } else {
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;color:red;background:#111;z-index:99999;';
    d.textContent = 'エラー: ' + msg;
    document.body.appendChild(d);
  }
}

try {
  // 3Dエンジン初期化（キャンバス＋オーバーレイ作成）
  initEngine(container);
} catch (e) {
  showError('3Dエンジン初期化失敗: ' + e.message);
  throw e;
}

const gameState = {
  worldsCompleted: [false, false, false],
  secretCompleted: false,
  tvEscaped: false,
};

let currentCleanup = null;

// ステージ進行マップ
const stageFlow = {
  'w1-1': { init: initW1Poop, next: 'w1-2' },
  'w1-2': { init: initW1Toilet, next: 'w1-3' },
  'w1-3': { init: initW1Belly, next: 'w1-4' },
  'w1-4': { init: initW1Escape, next: 'w1-clear' },
  'w2-1': { init: initW2School, next: 'w2-2' },
  'w2-2': { init: initW2Ghost, next: 'w2-3' },
  'w2-3': { init: initW2Flying, next: 'w2-clear' },
  'w3-1': { init: initW3Dolls, next: 'w3-2' },
  'w3-2': { init: initW3Magic, next: 'w3-3' },
  'w3-3': { init: initW3TV, next: 'w3-clear' },
  'secret': { init: initSecretBoss, next: 'secret-clear' },
};

function cleanupCurrent() {
  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }
  removeCoinUI();
}

function loadScene(sceneId) {
  cleanupCurrent();
  resumeAudio();

  switch (sceneId) {
    case 'title':
      loadTitle();
      break;
    case 'worldSelect':
      loadWorldSelect();
      break;
    case 'w1-clear':
      gameState.worldsCompleted[0] = true;
      loadWorldSelect();
      break;
    case 'w2-clear':
      gameState.worldsCompleted[1] = true;
      loadWorldSelect();
      break;
    case 'w3-clear':
      gameState.worldsCompleted[2] = true;
      loadNormalEnding();
      break;
    case 'secret-clear':
      gameState.secretCompleted = true;
      loadEnding();
      break;
    case 'ending':
      loadEnding();
      break;
    default:
      if (stageFlow[sceneId]) {
        loadStage(sceneId);
      } else {
        loadTitle();
      }
  }
}

function loadTitle() {
  try {
    const scene = initTitle(container, gameState, () => {
      loadScene('worldSelect');
    });
    currentCleanup = scene.cleanup;
  } catch (e) {
    showError('タイトル読み込み失敗: ' + e.message);
  }
}

function loadWorldSelect() {
  try {
    const scene = initWorldSelect(container, gameState, (stageId) => {
      loadScene(stageId);
    });
    currentCleanup = scene.cleanup;
  } catch (e) {
    showError('ワールド選択読み込み失敗: ' + e.message);
  }
}

function loadStage(stageId) {
  const stage = stageFlow[stageId];
  if (!stage) return;

  try {
    const result = stage.init(container, gameState, () => {
      stopBGM();
      loadScene(stage.next);
    });
    currentCleanup = result.cleanup;
  } catch (e) {
    showError(`ステージ${stageId}読み込み失敗: ` + e.message);
  }
}

function loadNormalEnding() {
  const scene = initEnding(container, gameState, () => {
    loadScene('worldSelect');
  });
  currentCleanup = scene.cleanup;
}

function loadEnding() {
  const scene = initEnding(container, gameState, () => {
    gameState.worldsCompleted = [false, false, false];
    gameState.secretCompleted = false;
    gameState.tvEscaped = false;
    resetCoins();
    resetForm();
    loadScene('title');
  });
  currentCleanup = scene.cleanup;
}

// 最初のオーディオ解除（ユーザー操作時）
document.addEventListener('click', () => resumeAudio(), { once: true });
document.addEventListener('touchstart', () => resumeAudio(), { once: true });

// ゲーム開始
hideLoading();
loadScene('title');
