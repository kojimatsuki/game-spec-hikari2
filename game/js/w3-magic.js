// w3-magic.js - W3ステージ2: 魔法使い変身＆猫変身

import { DIALOGUES, HIKARI_FORMS, ANIMALS_FOR_TRANSFORM } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins, getCoins, spendCoins } from './economy.js';
import { showMessage, showBigMessage, createButton, initCoinUI } from './ui.js';
import { setForm, getEmoji, getFormCost } from './hikari.js';

export function initW3Magic(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false;
  let momEventDone = false;
  let coinCollectPhase = false;

  const wrap = document.createElement('div');
  wrap.className = 'stage-w3-magic';

  const sceneArea = document.createElement('div');
  sceneArea.className = 'magic-scene';
  wrap.appendChild(sceneArea);

  initCoinUI(wrap);
  startBGM('w3');
  setForm('magician');

  container.appendChild(wrap);

  renderTransformMenu();

  function renderTransformMenu() {
    if (cleaned) return;
    sceneArea.innerHTML = '';

    // ひかりちゃん表示
    const hikariDisplay = document.createElement('div');
    hikariDisplay.className = 'hikari-big';
    hikariDisplay.textContent = getEmoji();
    sceneArea.appendChild(hikariDisplay);

    const title = document.createElement('div');
    title.className = 'magic-title';
    title.textContent = '🪄 変身メニュー 🪄';
    sceneArea.appendChild(title);

    // 動物ボタン
    const btnGrid = document.createElement('div');
    btnGrid.className = 'transform-grid';

    ANIMALS_FOR_TRANSFORM.forEach(formKey => {
      const form = HIKARI_FORMS[formKey];
      const cost = form.cost || 0;
      const btn = document.createElement('button');
      btn.className = 'transform-btn';
      btn.innerHTML = `<span class="tf-emoji">${form.emoji}</span><span class="tf-name">${form.label}</span><span class="tf-cost">💰${cost}</span>`;

      const doTransform = (e) => {
        e.preventDefault();
        if (cleaned) return;
        if (getCoins() < cost) {
          showMessage(wrap, `コインが足りない！💰${cost}必要`, 1500);
          playSound('poop');
          return;
        }
        spendCoins(cost);
        setForm(formKey);
        playSound('transform');
        hikariDisplay.textContent = form.emoji;
        showMessage(wrap, `${form.label}に変身！${form.emoji}`, 1500);

        // 変身エフェクト
        hikariDisplay.classList.add('transforming');
        setTimeout(() => hikariDisplay.classList.remove('transforming'), 800);
      };
      btn.addEventListener('click', doTransform);
      btn.addEventListener('touchstart', doTransform, { passive: false });
      btnGrid.appendChild(btn);
    });

    sceneArea.appendChild(btnGrid);

    // お母さんイベントボタン（まだの場合）
    if (!momEventDone) {
      const momBtn = createButton('👩 お母さんに会う', () => {
        startMomEvent();
      }, 'action-btn mom-btn');
      sceneArea.appendChild(momBtn);
    } else {
      const nextBtn = createButton('次のステージへ ▶', () => {
        if (!cleaned) onComplete();
      }, 'action-btn next-btn');
      sceneArea.appendChild(nextBtn);
    }
  }

  function startMomEvent() {
    if (cleaned) return;
    sceneArea.innerHTML = '';

    // お母さん登場
    const momScene = document.createElement('div');
    momScene.className = 'mom-scene';

    const mom = document.createElement('div');
    mom.className = 'mom-char';
    mom.textContent = '👩';
    momScene.appendChild(mom);

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = d.momWant;
    momScene.appendChild(bubble);

    sceneArea.appendChild(momScene);
    playSound('chime');

    // コイン集めフェーズ
    setTimeout(() => {
      if (cleaned) return;
      showMessage(wrap, '猫に変身するにはコイン💰30枚必要！集めよう！', 2500);
      coinCollectPhase = true;
      showCoinCollect();
    }, 2500);
  }

  function showCoinCollect() {
    if (cleaned) return;
    sceneArea.innerHTML = '';

    const collectArea = document.createElement('div');
    collectArea.className = 'coin-collect-area';

    // ばらまかれたコイン
    for (let i = 0; i < 20; i++) {
      const coin = document.createElement('div');
      coin.className = 'scatter-coin';
      coin.textContent = '💰';
      coin.style.left = (5 + Math.random() * 85) + '%';
      coin.style.top = (10 + Math.random() * 70) + '%';
      coin.style.animationDelay = (Math.random() * 0.5) + 's';

      const collectCoin = (e) => {
        e.preventDefault();
        if (cleaned || coin.dataset.collected === 'true') return;
        coin.dataset.collected = 'true';
        coin.classList.add('collected');
        addCoins(3);
        playSound('coin');
        showMessage(wrap, 'モグモグ💰', 400);
        setTimeout(() => { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 300);
      };
      coin.addEventListener('click', collectCoin);
      coin.addEventListener('touchstart', collectCoin, { passive: false });
      collectArea.appendChild(coin);
    }

    sceneArea.appendChild(collectArea);

    // 猫変身ボタン
    const catBtn = createButton('🐱 猫に変身！(💰30)', () => {
      if (getCoins() < 30) {
        showMessage(wrap, 'コインが足りない！もっと集めよう！', 1500);
        return;
      }
      spendCoins(30);
      transformToCat();
    }, 'action-btn cat-btn');
    sceneArea.appendChild(catBtn);

    // コインリスポーン
    const respawn = setInterval(() => {
      if (cleaned || momEventDone) { clearInterval(respawn); return; }
      const remaining = collectArea.querySelectorAll('.scatter-coin:not(.collected)');
      if (remaining.length < 5) {
        for (let i = 0; i < 8; i++) {
          const coin = document.createElement('div');
          coin.className = 'scatter-coin';
          coin.textContent = '💰';
          coin.style.left = (5 + Math.random() * 85) + '%';
          coin.style.top = (10 + Math.random() * 70) + '%';
          const collectCoin = (e) => {
            e.preventDefault();
            if (cleaned || coin.dataset.collected === 'true') return;
            coin.dataset.collected = 'true';
            coin.classList.add('collected');
            addCoins(3);
            playSound('coin');
            setTimeout(() => { if (coin.parentNode) coin.parentNode.removeChild(coin); }, 300);
          };
          coin.addEventListener('click', collectCoin);
          coin.addEventListener('touchstart', collectCoin, { passive: false });
          collectArea.appendChild(coin);
        }
      }
    }, 3000);
  }

  function transformToCat() {
    if (cleaned) return;
    setForm('cat');
    playSound('transform');
    sceneArea.innerHTML = '';

    // 変身演出
    const catScene = document.createElement('div');
    catScene.className = 'cat-transform-scene';

    const cat = document.createElement('div');
    cat.className = 'big-cat';
    cat.textContent = '🐱✨';
    catScene.appendChild(cat);

    // お母さんの反応
    const mom = document.createElement('div');
    mom.className = 'mom-char';
    mom.textContent = '👩';
    catScene.appendChild(mom);

    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = d.momThanks;
    catScene.appendChild(bubble);

    const secret = document.createElement('div');
    secret.className = 'secret-text';
    secret.textContent = '（実はひかりちゃんだとバレない…笑）';
    catScene.appendChild(secret);

    sceneArea.appendChild(catScene);
    playSound('clear');

    momEventDone = true;

    setTimeout(() => {
      if (cleaned) return;
      setForm('magician');
      renderTransformMenu();
    }, 4000);
  }

  return {
    cleanup() {
      cleaned = true;
      stopBGM();
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}
