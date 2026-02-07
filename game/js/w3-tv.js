// w3-tv.js - W3ステージ3: テレビ脱出（最終ステージ）

import { DIALOGUES, TV_CLUES, TV_PASSWORD } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage, createButton, initCoinUI } from './ui.js';
import { setForm } from './hikari.js';

export function initW3TV(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false;
  let cluesFound = [];
  let timeLeft = 120; // 2分
  let timerInterval = null;
  let phase = 'sucked'; // sucked, studio, password, result
  let resultShown = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w3-tv';

  initCoinUI(wrap);
  setForm('caster');

  container.appendChild(wrap);

  // 吸い込まれ演出
  showSuckedIn();

  function showSuckedIn() {
    const suckScene = document.createElement('div');
    suckScene.className = 'tv-suck-scene';

    const tv = document.createElement('div');
    tv.className = 'big-tv';
    tv.textContent = '📺';
    suckScene.appendChild(tv);

    const hikari = document.createElement('div');
    hikari.className = 'hikari-sucked';
    hikari.textContent = '👧🌀';
    suckScene.appendChild(hikari);

    wrap.appendChild(suckScene);
    playSound('brainrot');
    showBigMessage(wrap, d.tvSuck, 2500);

    setTimeout(() => {
      if (cleaned) return;
      hikari.classList.add('sucking');
      setTimeout(() => {
        if (cleaned) return;
        if (suckScene.parentNode) suckScene.parentNode.removeChild(suckScene);
        showNewsFlash();
      }, 2000);
    }, 2500);
  }

  function showNewsFlash() {
    phase = 'studio';
    const newsScene = document.createElement('div');
    newsScene.className = 'news-scene';

    // ニュースバー
    const newsBar = document.createElement('div');
    newsBar.className = 'news-bar';
    newsBar.textContent = `📺 速報 | ${d.newsFlash}`;
    newsScene.appendChild(newsBar);

    // スタジオ
    const studio = document.createElement('div');
    studio.className = 'studio';

    // ひかりちゃん（キャスター席）
    const caster = document.createElement('div');
    caster.className = 'caster-hikari';
    caster.textContent = '👧🎤';
    studio.appendChild(caster);

    // 調査可能アイテム
    TV_CLUES.forEach((clue, i) => {
      const item = document.createElement('div');
      item.className = 'studio-item';
      item.textContent = clue.item;
      item.dataset.found = 'false';
      const positions = [
        { left: '15%', top: '30%' },
        { left: '75%', top: '25%' },
        { left: '45%', top: '65%' },
        { left: '85%', top: '60%' },
      ];
      item.style.left = positions[i].left;
      item.style.top = positions[i].top;

      const investigate = (e) => {
        e.preventDefault();
        if (cleaned || item.dataset.found === 'true') return;
        item.dataset.found = 'true';
        item.classList.add('investigated');
        cluesFound.push(clue);
        playSound('coin');
        showMessage(wrap, `${clue.name}を調べた！ ${clue.clue}`, 2500);
        updateClueDisplay();

        if (cluesFound.length >= TV_CLUES.length) {
          setTimeout(() => showPasswordInput(), 1500);
        }
      };
      item.addEventListener('click', investigate);
      item.addEventListener('touchstart', investigate, { passive: false });
      studio.appendChild(item);
    });

    newsScene.appendChild(studio);

    // 手がかり表示エリア
    const clueArea = document.createElement('div');
    clueArea.className = 'clue-area';
    clueArea.id = 'clue-area';
    clueArea.textContent = '🔍 手がかり: ';
    newsScene.appendChild(clueArea);

    // タイマー
    const timerEl = document.createElement('div');
    timerEl.className = 'timer-display';
    timerEl.id = 'timer';
    newsScene.appendChild(timerEl);

    wrap.appendChild(newsScene);
    startBGM('tv');
    playSound('news');

    // タイマー開始
    timerInterval = setInterval(() => {
      if (cleaned) return;
      timeLeft--;
      const timerDisp = document.getElementById('timer');
      if (timerDisp) {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerDisp.textContent = `⏰ ${m}:${s.toString().padStart(2, '0')}`;
        if (timeLeft <= 30) timerDisp.classList.add('timer-urgent');
      }
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        showResult(false);
      }
    }, 1000);
  }

  function updateClueDisplay() {
    const area = document.getElementById('clue-area');
    if (area) {
      area.textContent = '🔍 手がかり: ' + cluesFound.map(c => c.digit).join(' ');
    }
  }

  function showPasswordInput() {
    if (cleaned) return;
    phase = 'password';

    const inputArea = document.createElement('div');
    inputArea.className = 'password-area';

    const label = document.createElement('div');
    label.className = 'password-label';
    label.textContent = '🔐 パスワードを入力！';
    inputArea.appendChild(label);

    const inputWrap = document.createElement('div');
    inputWrap.className = 'password-input-wrap';

    const digits = [];
    for (let i = 0; i < 4; i++) {
      const digitInput = document.createElement('input');
      digitInput.className = 'password-digit';
      digitInput.type = 'number';
      digitInput.maxLength = 1;
      digitInput.min = 0;
      digitInput.max = 9;
      digitInput.inputMode = 'numeric';
      digitInput.addEventListener('input', (e) => {
        if (e.target.value.length >= 1) {
          e.target.value = e.target.value.slice(-1);
          if (i < 3) digits[i + 1].focus();
        }
      });
      inputWrap.appendChild(digitInput);
      digits.push(digitInput);
    }
    inputArea.appendChild(inputWrap);

    const submitBtn = createButton('🔓 解除！', () => {
      const code = digits.map(d => d.value).join('');
      if (code === TV_PASSWORD) {
        clearInterval(timerInterval);
        showResult(true);
      } else {
        showMessage(wrap, 'パスワードが違う！❌', 1500);
        playSound('poop');
        digits.forEach(d => { d.value = ''; });
        digits[0].focus();
      }
    }, 'submit-btn');
    inputArea.appendChild(submitBtn);

    wrap.appendChild(inputArea);
    digits[0].focus();
  }

  function showResult(success) {
    if (cleaned || resultShown) return;
    resultShown = true;
    phase = 'result';
    stopBGM();
    clearInterval(timerInterval);

    const resultScene = document.createElement('div');
    resultScene.className = 'result-scene';

    if (success) {
      // 脱出成功
      playSound('explode');

      const tvBreak = document.createElement('div');
      tvBreak.className = 'tv-break';
      tvBreak.textContent = '📺💥';
      resultScene.appendChild(tvBreak);

      setTimeout(() => {
        if (cleaned) return;
        showBigMessage(wrap, d.escapeSuccess, 3000);
        playSound('clear');
        addCoins(30);

        const flash = document.createElement('div');
        flash.className = 'white-flash';
        wrap.appendChild(flash);

        const hikari = document.createElement('div');
        hikari.className = 'hikari-free';
        hikari.textContent = '👧✨🎉';
        resultScene.appendChild(hikari);
      }, 1500);
    } else {
      // 脱出失敗
      showBigMessage(wrap, d.escapeFail, 3000);
      playSound('news');

      const newsEnd = document.createElement('div');
      newsEnd.className = 'news-end';
      newsEnd.textContent = '📺👧🎤';
      resultScene.appendChild(newsEnd);

      const txt = document.createElement('div');
      txt.className = 'fail-text';
      txt.textContent = 'ひかりちゃんは今日もニュースに出ています…';
      resultScene.appendChild(txt);
    }

    wrap.appendChild(resultScene);

    setTimeout(() => {
      showBigMessage(wrap, d.w3Clear, 3000);
      playSound('clear');
      gameState.tvEscaped = success;
      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3500);
    }, 4000);
  }

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (timerInterval) clearInterval(timerInterval);
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
