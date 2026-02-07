// w2-flying.js - W2ステージ3: 空飛びうんちフライト

import { DIALOGUES } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW2Flying(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let animId = null;
  let playerY = 50;
  let velocity = 0;
  const gravity = 0.15;
  const flapForce = -4;
  let scrollX = 0;
  let distance = 0;
  const GOAL = 800;
  let obstacles = [];
  let poops = [];
  let poopTimer = 0;
  let pressing = false;
  let score = 0;
  let finished = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w2-flying';

  // 空背景
  const sky = document.createElement('div');
  sky.className = 'sky-bg';
  wrap.appendChild(sky);

  // 雲を配置
  for (let i = 0; i < 8; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    cloud.textContent = '☁️';
    cloud.dataset.x = Math.random() * 120;
    cloud.style.top = (10 + Math.random() * 40) + '%';
    cloud.style.fontSize = (30 + Math.random() * 30) + 'px';
    cloud.style.opacity = 0.5 + Math.random() * 0.5;
    wrap.appendChild(cloud);
    obstacles.push({ el: cloud, type: 'cloud' });
  }

  // プレイヤー
  const player = document.createElement('div');
  player.className = 'fly-player';
  player.textContent = '👧🕊️';
  wrap.appendChild(player);

  // 距離表示
  const distEl = document.createElement('div');
  distEl.className = 'dist-display';
  distEl.textContent = '✈️ 0m';
  wrap.appendChild(distEl);

  // スコア
  const scoreEl = document.createElement('div');
  scoreEl.className = 'score-display';
  scoreEl.textContent = '💩ボーナス: 0';
  wrap.appendChild(scoreEl);

  initCoinUI(wrap);
  showMessage(wrap, d.flyIntro, 3000);
  startBGM('w2fly');
  setForm('flying');

  container.appendChild(wrap);

  // 操作
  function startPress(e) {
    e.preventDefault();
    if (cleaned) return;
    pressing = true;
  }
  function endPress(e) {
    pressing = false;
  }
  wrap.addEventListener('mousedown', startPress);
  wrap.addEventListener('touchstart', startPress, { passive: false });
  wrap.addEventListener('mouseup', endPress);
  wrap.addEventListener('touchend', endPress);

  // 障害物生成
  let spawnTimer = 0;
  function spawnObstacle() {
    const types = ['🐦', '✈️', '🪁'];
    const obs = document.createElement('div');
    obs.className = 'fly-obstacle';
    obs.textContent = types[Math.floor(Math.random() * types.length)];
    obs.dataset.x = 105;
    obs.dataset.y = 10 + Math.random() * 70;
    wrap.appendChild(obs);
    obstacles.push({ el: obs, type: 'obstacle', x: 105, y: parseFloat(obs.dataset.y) });
  }

  // 地面の敵
  function spawnGroundEnemy() {
    const enemies = ['👾', '🐛', '🦂'];
    const en = document.createElement('div');
    en.className = 'ground-enemy';
    en.textContent = enemies[Math.floor(Math.random() * enemies.length)];
    en.dataset.x = 105;
    wrap.appendChild(en);
    obstacles.push({ el: en, type: 'ground', x: 105 });
  }

  function gameLoop() {
    if (cleaned) return;

    // 物理
    if (pressing) {
      velocity += flapForce * 0.1;
      if (velocity < -3) velocity = -3;
    }
    velocity += gravity;
    playerY += velocity;
    if (playerY < 5) { playerY = 5; velocity = 0; }
    if (playerY > 85) { playerY = 85; velocity = 0; }

    player.style.top = playerY + '%';
    player.style.left = '15%';
    player.style.transform = `rotate(${velocity * 3}deg)`;

    // スクロール
    scrollX += 2;
    distance += 0.5;
    distEl.textContent = `✈️ ${Math.floor(distance)}m`;

    // うんち自動ドロップ
    poopTimer++;
    if (poopTimer >= 60) {
      poopTimer = 0;
      dropPoop();
    }

    // 障害物更新
    spawnTimer++;
    if (spawnTimer % 80 === 0) spawnObstacle();
    if (spawnTimer % 120 === 0) spawnGroundEnemy();

    obstacles = obstacles.filter(o => {
      if (o.type === 'cloud') {
        let cx = parseFloat(o.el.dataset.x) - 0.3;
        if (cx < -20) cx = 120;
        o.el.dataset.x = cx;
        o.el.style.left = cx + '%';
        return true;
      }
      if (o.type === 'obstacle') {
        o.x -= 2;
        o.el.style.left = o.x + '%';
        o.el.style.top = o.y + '%';
        // 当たり判定
        if (Math.abs(o.x - 15) < 5 && Math.abs(o.y - playerY) < 8) {
          showMessage(wrap, '💥 ぶつかった！', 600);
          playSound('hit');
          distance = Math.max(0, distance - 15);
        }
        if (o.x < -10) {
          if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
          return false;
        }
        return true;
      }
      if (o.type === 'ground') {
        o.x -= 2;
        o.el.style.left = o.x + '%';
        if (o.x < -10) {
          if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
          return false;
        }
        return true;
      }
      return true;
    });

    // うんち更新
    poops = poops.filter(p => {
      p.y += 2;
      p.x -= 0.5;
      p.el.style.left = p.x + '%';
      p.el.style.top = p.y + '%';
      p.el.style.transform = `rotate(${p.y * 5}deg)`;

      // 地面の敵に当たったかチェック
      obstacles.forEach(o => {
        if (o.type === 'ground' && Math.abs(o.x - p.x) < 5 && p.y > 82) {
          score++;
          scoreEl.textContent = `💩ボーナス: ${score}`;
          addCoins(3);
          showMessage(wrap, '💩命中！+3', 600);
          playSound('coin');
          if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
          o.x = -999;
        }
      });

      if (p.y > 95) {
        if (p.el.parentNode) p.el.parentNode.removeChild(p.el);
        return false;
      }
      return true;
    });

    // ゴール
    if (distance >= GOAL) {
      finishFlight();
      return;
    }

    animId = requestAnimationFrame(gameLoop);
  }

  function dropPoop() {
    const p = document.createElement('div');
    p.className = 'dropped-poop';
    p.textContent = '💩';
    const obj = { el: p, x: 15, y: playerY + 5 };
    wrap.appendChild(p);
    poops.push(obj);
    playSound('poop');
  }

  function finishFlight() {
    if (cleaned || finished) return;
    finished = true;
    stopBGM();
    showBigMessage(wrap, d.flyComplete, 2500);
    playSound('clear');
    addCoins(15);
    setTimeout(() => {
      showBigMessage(wrap, d.w2Clear, 3000);
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3500);
    }, 3000);
  }

  animId = requestAnimationFrame(gameLoop);

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (animId) cancelAnimationFrame(animId);
      poops.forEach(p => { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); });
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
