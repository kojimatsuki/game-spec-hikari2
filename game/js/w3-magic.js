// w3-magic.js - W3ステージ2: 魔法使い変身＆猫変身（3Dポリゴン版）
import { DIALOGUES, HIKARI_FORMS, ANIMALS_FOR_TRANSFORM } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins, getCoins, spendCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import { setForm, getEmoji, getFormCost } from './hikari.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW3Magic(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false, t = 0, momEventDone = false;
  const timers = [], scatterCoins = [];
  const animalColors = { cat:0xff9944, dog:0x996633, bird:0x44aaff, fish:0x4488ff, sheep:0xeeeeee, lion:0xddaa33 };

  // === シーン（ファンタジー紫） ===
  const scene = E.createScene(0x2a0044);
  scene.fog = new THREE.Fog(0x2a0044, 20, 60);
  const camera = E.createCamera(55);
  camera.position.set(0, 6, 10); camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);
  scene.children.forEach(c => { if (c.isAmbientLight) c.intensity = 0.5; });
  const purpleLight = new THREE.PointLight(0xaa44ff, 1.0, 30);
  purpleLight.position.set(0, 8, 0); scene.add(purpleLight);
  const pinkLight = new THREE.PointLight(0xff44aa, 0.5, 20);
  pinkLight.position.set(-5, 3, 5); scene.add(pinkLight);

  scene.add(E.createGridGround(30, 0x330066, 0x5500aa));
  const hikari = E.createHikari();
  hikari.position.set(0, 0, 0); hikari.scale.setScalar(1.5); scene.add(hikari);

  // 星の装飾
  for (let i = 0; i < 20; i++) {
    const star = E.createStar(0.15 + Math.random() * 0.2);
    const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 10;
    star.position.set(Math.cos(a)*r, 2+Math.random()*6, Math.sin(a)*r);
    scene.add(star);
  }
  const magicParticles = E.createParticles(40, 0xaa66ff, 0.15);
  scene.add(magicParticles);

  const overlay = E.getOverlay(); overlay.innerHTML = '';
  startBGM('w3'); setForm('magician');
  buildTransformMenu();

  // === 変身メニュー ===
  function buildTransformMenu() {
    if (cleaned) return;
    overlay.innerHTML = '';
    addCoinUI();
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);font-size:22px;color:#ffcc00;text-shadow:1px 1px 3px #000;z-index:10;';
    titleEl.textContent = '🪄 変身メニュー 🪄'; overlay.appendChild(titleEl);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:absolute;bottom:15%;left:50%;transform:translateX(-50%);display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:360px;z-index:10;';
    ANIMALS_FOR_TRANSFORM.forEach(key => {
      const form = HIKARI_FORMS[key], cost = form.cost||0;
      const btn = document.createElement('button'); btn.className = 'game-btn';
      btn.style.cssText = 'font-size:14px;padding:8px 12px;min-width:100px;';
      btn.textContent = `${form.emoji} ${form.label} 💰${cost}`;
      const act = e => { e.preventDefault(); if(cleaned)return;
        if(getCoins()<cost){showMessage(overlay,`コインが足りない！💰${cost}必要`,1500);playSound('poop');return;}
        spendCoins(cost); setForm(key); playSound('transform');
        showMessage(overlay,`${form.label}に変身！${form.emoji}`,1500);
        hikari.traverse(c=>{if(c.isMesh&&c.position.y>0.8&&c.position.y<1.5)c.material.color.setHex(animalColors[key]||0xff69b4);});
        hikari.scale.setScalar(2.0); setTimeout(()=>{if(!cleaned)hikari.scale.setScalar(1.5);},300);
        updateCoinUI();
      };
      btn.addEventListener('click',act); btn.addEventListener('touchstart',e=>{e.preventDefault();act(e);},{passive:false});
      wrap.appendChild(btn);
    });
    overlay.appendChild(wrap);

    if (!momEventDone) {
      addBtn('👩 お母さんに会う','#ff88cc','bottom:5%',e=>{e.preventDefault();if(!cleaned)startMomEvent();});
    } else {
      addBtn('次のステージへ ▶','#44cc44','bottom:5%',e=>{e.preventDefault();if(!cleaned)onComplete();});
    }
  }

  function addBtn(text,bg,pos,cb) {
    const b = document.createElement('button'); b.className='game-btn';
    b.style.cssText = `position:absolute;${pos};left:50%;transform:translateX(-50%);font-size:18px;padding:12px 24px;background:${bg};z-index:10;`;
    b.textContent = text; b.addEventListener('click',cb); b.addEventListener('touchstart',cb,{passive:false});
    overlay.appendChild(b);
  }
  function addCoinUI() {
    const el = document.createElement('div'); el.id='magic-coins';
    el.style.cssText='position:absolute;top:10px;right:15px;font-size:22px;color:#ffd700;text-shadow:1px 1px 3px #000;z-index:10;';
    el.textContent=`💰 ${getCoins()}`; overlay.appendChild(el);
  }
  function updateCoinUI() { const el=document.getElementById('magic-coins'); if(el)el.textContent=`💰 ${getCoins()}`; }

  // === お母さんイベント ===
  function startMomEvent() {
    overlay.innerHTML = '';
    const mom = E.createBlockChar(0xff88cc, 0xffdbac, 1.2); mom.position.set(3,0,2); scene.add(mom);
    const bubble = E.createTextSprite(d.momWant,{fontSize:32,color:'#fff',bg:'rgba(0,0,0,0.6)'});
    bubble.position.set(3,4.5,2); scene.add(bubble);
    playSound('chime'); showMessage(overlay,'猫に変身するにはコイン💰30枚必要！集めよう！',2500);
    camera.position.set(2,7,12); camera.lookAt(1.5,2,1);

    const tid = setTimeout(()=>{
      if(cleaned)return;
      // コインばらまき
      for(let i=0;i<20;i++) spawnCoin3D();
      const resp = setInterval(()=>{
        if(cleaned||momEventDone){clearInterval(resp);return;}
        if(scatterCoins.filter(c=>c.userData.alive).length<5) for(let j=0;j<8;j++) spawnCoin3D();
      },3000);
      timers.push(resp);
      addCoinUI();
      addBtn('🐱 猫に変身！(💰30)','#ff9944','bottom:8%',e=>{
        e.preventDefault(); if(cleaned)return;
        if(getCoins()<30){showMessage(overlay,'コインが足りない！もっと集めよう！',1500);return;}
        spendCoins(30); transformToCat(mom,bubble);
      });
    },2500);
    timers.push(tid);
  }

  function spawnCoin3D() {
    const coin = E.createCoin();
    const a=Math.random()*Math.PI*2, r=2+Math.random()*8;
    coin.position.set(Math.cos(a)*r,0.3+Math.random()*0.5,Math.sin(a)*r);
    coin.userData.alive=true; coin.userData.bobOffset=Math.random()*Math.PI*2;
    scene.add(coin); scatterCoins.push(coin);
    E.registerClick(coin,()=>{ if(cleaned||!coin.userData.alive)return;
      coin.userData.alive=false; coin.userData.collectTime=t;
      addCoins(3); playSound('coin'); updateCoinUI();
    });
  }

  function transformToCat(mom,bubble) {
    setForm('cat'); playSound('transform');
    hikari.traverse(c=>{if(c.isMesh&&c.position.y>0.8&&c.position.y<1.5)c.material.color.setHex(0xff9944);});
    hikari.scale.setScalar(2.0); setTimeout(()=>{if(!cleaned)hikari.scale.setScalar(1.5);},400);
    scene.remove(bubble);
    const tb = E.createTextSprite(d.momThanks,{fontSize:28,color:'#fff',bg:'rgba(0,0,0,0.6)'});
    tb.position.set(3,4.5,2); scene.add(tb);
    showBigMessage(overlay,d.momThanks,2500); playSound('clear');
    const sec=document.createElement('div');
    sec.style.cssText='position:absolute;top:40%;left:50%;transform:translateX(-50%);font-size:16px;color:#aaa;text-shadow:1px 1px 2px #000;z-index:10;font-style:italic;';
    sec.textContent='(実はひかりちゃんだとバレない…笑)'; overlay.appendChild(sec);
    momEventDone=true; scene.add(E.createParticles(50,0xff9944,0.2));
    const tid=setTimeout(()=>{if(cleaned)return; setForm('magician'); scene.remove(mom); scene.remove(tb);
      camera.position.set(0,6,10); camera.lookAt(0,2,0);
      scatterCoins.forEach(c=>{scene.remove(c);E.unregisterClick(c);}); buildTransformMenu();
    },4000); timers.push(tid);
  }

  // === メインループ ===
  E.startLoop(()=>{
    if(cleaned)return; t+=0.016;
    hikari.position.y=Math.sin(t*1.5)*0.15; hikari.rotation.y=Math.sin(t*0.5)*0.2;
    purpleLight.intensity=1+Math.sin(t*2)*0.3; pinkLight.intensity=0.5+Math.sin(t*1.5+1)*0.2;
    E.updateParticles(magicParticles);
    scatterCoins.forEach(coin=>{
      if(!coin.userData.alive){
        if(coin.userData.collectTime!==undefined){const e=t-coin.userData.collectTime;
          coin.position.y+=0.15; coin.scale.setScalar(Math.max(0,1-e*3));
          if(e>0.5){scene.remove(coin);E.unregisterClick(coin);coin.userData.collectTime=undefined;}}
        return;}
      coin.position.y=0.3+Math.sin(t*2+coin.userData.bobOffset)*0.1; coin.rotation.z+=0.03;
    });
  });

  function cleanup() { cleaned=true; stopBGM(); timers.forEach(id=>{clearTimeout(id);clearInterval(id);});
    E.stopLoop(); E.clearClicks(); E.disposeScene(scene); overlay.innerHTML=''; }
  return { cleanup };
}
