// w2-school.js - W2ステージ1: 学校＆友達集め

import { DIALOGUES, FRIENDS } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, createCounter, createButton, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW2School(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let hasRandoseru = false;
  let phase = 'home'; // home, toSchool, school, goHome
  let friendsFound = [];
  let visits = 0;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w2-school';

  const sceneArea = document.createElement('div');
  sceneArea.className = 'school-scene';
  wrap.appendChild(sceneArea);

  const friendCounter = createCounter(wrap, '👫', 0, 5);
  initCoinUI(wrap);
  showMessage(wrap, d.morningIntro, 3000);
  startBGM('w2day');
  setForm('normal');

  container.appendChild(wrap);

  renderPhase();

  function renderPhase() {
    if (cleaned) return;
    sceneArea.innerHTML = '';

    switch (phase) {
      case 'home': renderHome(); break;
      case 'toSchool': renderWalking(); break;
      case 'school': renderSchool(); break;
      case 'goHome': renderGoHome(); break;
    }
  }

  function renderHome() {
    const house = document.createElement('div');
    house.className = 'school-building';
    house.innerHTML = '<div class="building-emoji">🏠</div><div class="building-label">ひかりちゃんの家</div>';
    sceneArea.appendChild(house);

    // ランドセル
    if (!hasRandoseru) {
      const bag = document.createElement('div');
      bag.className = 'item-pickup randoseru';
      bag.textContent = '🎒';
      const pickBag = (e) => {
        e.preventDefault();
        if (cleaned) return;
        hasRandoseru = true;
        bag.classList.add('collected');
        setForm('school');
        playSound('coin');
        showMessage(wrap, 'ランドセル装備！🎒', 1500);
        setTimeout(() => { if (bag.parentNode) bag.parentNode.removeChild(bag); }, 300);
      };
      bag.addEventListener('click', pickBag);
      bag.addEventListener('touchstart', pickBag, { passive: false });
      sceneArea.appendChild(bag);
    }

    // ひかりちゃん
    const hikari = document.createElement('div');
    hikari.className = 'hikari-standing';
    hikari.textContent = hasRandoseru ? '👧🎒' : '👧';
    sceneArea.appendChild(hikari);

    // 出発ボタン
    const goBtn = createButton('学校へ行く 🏫', () => {
      if (!hasRandoseru) {
        showMessage(wrap, d.forgotBag, 2000);
        playSound('poop');
        return;
      }
      phase = 'toSchool';
      renderPhase();
    }, 'action-btn');
    sceneArea.appendChild(goBtn);
  }

  function renderWalking() {
    const walkScene = document.createElement('div');
    walkScene.className = 'walking-scene';
    walkScene.innerHTML = '<div class="walk-emoji">👧🎒 🚶‍♀️...</div><div class="walk-text">学校へ向かっています...</div>';
    sceneArea.appendChild(walkScene);

    playSound('chime');
    setTimeout(() => {
      if (cleaned) return;
      phase = 'school';
      visits++;
      renderPhase();
    }, 2000);
  }

  function renderSchool() {
    const school = document.createElement('div');
    school.className = 'school-building';
    school.innerHTML = '<div class="building-emoji">🏫</div><div class="building-label">学校</div>';
    sceneArea.appendChild(school);

    // 友達を表示（まだ見つけていないもの）
    const available = FRIENDS.filter(f => !friendsFound.includes(f.name));
    const showCount = Math.min(available.length, visits <= 1 ? 3 : available.length);

    for (let i = 0; i < showCount; i++) {
      const f = available[i];
      const friendEl = document.createElement('div');
      friendEl.className = 'friend-npc';
      friendEl.textContent = f.emoji;
      friendEl.style.left = (15 + i * 18) + '%';
      friendEl.style.top = (40 + (i % 2) * 20) + '%';

      const nameTag = document.createElement('div');
      nameTag.className = 'friend-name';
      nameTag.textContent = f.name;
      friendEl.appendChild(nameTag);

      const talkToFriend = (e) => {
        e.preventDefault();
        if (cleaned || friendsFound.includes(f.name)) return;
        friendsFound.push(f.name);
        friendEl.classList.add('friend-joined');
        playSound('friend');
        showMessage(wrap, `${f.name}が${d.friendJoin} ${f.emoji}`, 1500);
        friendCounter.update(friendsFound.length);
        addCoins(3);

        setTimeout(() => {
          if (friendEl.parentNode) friendEl.parentNode.removeChild(friendEl);
          checkProgress();
        }, 800);
      };
      friendEl.addEventListener('click', talkToFriend);
      friendEl.addEventListener('touchstart', talkToFriend, { passive: false });
      sceneArea.appendChild(friendEl);
    }

    // 帰るボタン
    if (friendsFound.length < 5) {
      const homeBtn = createButton('家に帰る 🏠', () => {
        phase = 'goHome';
        renderPhase();
      }, 'action-btn');
      sceneArea.appendChild(homeBtn);
    }
  }

  function renderGoHome() {
    const walkScene = document.createElement('div');
    walkScene.className = 'walking-scene';
    walkScene.innerHTML = '<div class="walk-emoji">👧🎒 🚶‍♀️... 🏠</div><div class="walk-text">家に帰ります...</div>';
    sceneArea.appendChild(walkScene);

    setTimeout(() => {
      if (cleaned) return;
      phase = 'home';
      hasRandoseru = true; // 2回目以降は持ってる
      renderPhase();
    }, 1500);
  }

  function checkProgress() {
    if (friendsFound.length >= 5) {
      showBigMessage(wrap, '友達全員集合！🎉 次のステージへ！', 2500);
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
      friendCounter.remove();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
