// w3-tv.js - W3ステージ3: テレビ脱出（3Dポリゴン版・最終ステージ）
// Phase1: 吸い込まれ → Phase2: スタジオ探索 → Phase3: パスワード入力
import { DIALOGUES, TV_CLUES, TV_PASSWORD } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import { setForm } from './hikari.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW3TV(container, gameState, onComplete) {
  const d = DIALOGUES.w3;
  let cleaned = false, t = 0, phase = 'sucked', resultShown = false;
  let cluesFound = [], timeLeft = 120, timerInterval = null;
  const timers = [];
  let studioObjects = [];

  const scene = E.createScene(0x111122);
  scene.fog = new THREE.Fog(0x111122, 20, 60);
  const camera = E.createCamera(55);
  camera.position.set(0, 5, 10); camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);
  const overlay = E.getOverlay(); overlay.innerHTML = '';
  setForm('caster');

  // === Phase 1: 吸い込まれ ===
  const ground0 = E.createGround(30, 0x111111); scene.add(ground0);
  const tv = E.createTV(); tv.position.set(0,0,-2); tv.scale.setScalar(1.5); scene.add(tv);
  const hikariSuck = E.createHikari(); hikariSuck.position.set(0,0,4); scene.add(hikariSuck);
  const tvLight = new THREE.PointLight(0x4488ff, 1.5, 10); tvLight.position.set(0,2,-1); scene.add(tvLight);
  playSound('brainrot'); showBigMessage(overlay, d.tvSuck, 2500);

  let suckT = 0;
  const suckLoop = () => {
    if (cleaned) return;
    suckT += 0.016;
    hikariSuck.position.z -= 0.06;
    hikariSuck.scale.setScalar(Math.max(0.05, 1 - suckT * 0.3));
    hikariSuck.rotation.y += 0.15;
    tvLight.intensity = 1.5 + suckT * 2;
    if (suckT > 3.5) {
      scene.remove(hikariSuck); scene.remove(tv); scene.remove(tvLight); scene.remove(ground0);
      timers.push(setTimeout(() => { if (!cleaned) buildStudio(); }, 500));
      return;
    }
    requestAnimationFrame(suckLoop);
  };
  requestAnimationFrame(suckLoop);

  // === Phase 2: スタジオ ===
  function buildStudio() {
    phase = 'studio';
    scene.background = new THREE.Color(0x1a1a33); scene.fog = new THREE.Fog(0x1a1a33, 20, 50);
    scene.children.forEach(c => { if(c.isAmbientLight)c.intensity=0.6; if(c.isDirectionalLight)c.intensity=0.7; });
    scene.add(E.createGround(20, 0x222244));
    // デスク
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4,1,1.5), new THREE.MeshLambertMaterial({color:0x664422}));
    desk.position.set(0,0.5,0); desk.castShadow=true; scene.add(desk);
    // モニター
    const mon = new THREE.Mesh(new THREE.BoxGeometry(3,2,0.15), new THREE.MeshLambertMaterial({color:0x333333}));
    mon.position.set(0,2.5,-3); scene.add(mon);
    const scr = new THREE.Mesh(new THREE.BoxGeometry(2.7,1.7,0.05), new THREE.MeshBasicMaterial({color:0x3366ff}));
    scr.position.set(0,2.5,-2.9); scene.add(scr);
    // ひかりちゃん
    const hk = E.createHikari(); hk.position.set(0,0,0.5); scene.add(hk);
    camera.position.set(0,6,10); camera.lookAt(0,2,0);
    // 照明
    const spot = new THREE.PointLight(0xffffcc,0.8,15); spot.position.set(0,6,2); scene.add(spot);

    // 手がかり4つ
    const cPos = [{x:-5,y:1.5,z:-1},{x:4,y:1,z:2},{x:-3,y:1,z:3},{x:5,y:1,z:-3}];
    const cCol = [0x666666, 0xeeeecc, 0x335588, 0x444444];
    TV_CLUES.forEach((clue, i) => {
      const geo = i===0?new THREE.BoxGeometry(0.8,0.6,1.2):i===1?new THREE.BoxGeometry(0.6,0.02,0.8):
                  i===2?new THREE.BoxGeometry(0.8,0.6,0.1):new THREE.CylinderGeometry(0.08,0.08,0.8,8);
      const mat = new THREE.MeshLambertMaterial({color:cCol[i]});
      const obj = new THREE.Mesh(geo, mat);
      obj.position.set(cPos[i].x,cPos[i].y,cPos[i].z); obj.castShadow=true;
      obj.userData.found=false; obj.userData.bobOffset=Math.random()*Math.PI*2;
      scene.add(obj); studioObjects.push(obj);
      const lbl = E.createTextSprite(clue.item,{fontSize:48,color:'#ffffff'});
      lbl.position.set(cPos[i].x,cPos[i].y+1.2,cPos[i].z); lbl.scale.set(2,0.5,1);
      scene.add(lbl); studioObjects.push(lbl);
      E.registerClick(obj, () => {
        if(cleaned||obj.userData.found)return;
        obj.userData.found=true; cluesFound.push(clue);
        playSound('coin'); showMessage(overlay,`${clue.name}を調べた！ ${clue.clue}`,2500);
        updateClues(); mat.color.setHex(0xffcc00); mat.emissive=new THREE.Color(0x443300);
        if(cluesFound.length>=TV_CLUES.length) timers.push(setTimeout(()=>{if(!cleaned)showPassword();},1500));
      });
    });

    // ニュースバー
    const bar = document.createElement('div');
    bar.style.cssText = 'position:absolute;bottom:0;left:0;right:0;height:36px;background:rgba(200,0,0,0.85);color:#fff;font-size:14px;line-height:36px;padding:0 10px;white-space:nowrap;z-index:10;';
    bar.textContent = `📺 速報 | ${d.newsFlash}`; overlay.appendChild(bar);
    // 手がかり
    const ca = document.createElement('div'); ca.id='clue-area';
    ca.style.cssText='position:absolute;top:50px;left:50%;transform:translateX(-50%);font-size:18px;color:#ffcc00;text-shadow:1px 1px 3px #000;z-index:10;';
    ca.textContent='🔍 手がかり: '; overlay.appendChild(ca);
    // タイマー
    const te = document.createElement('div'); te.id='tv-timer';
    te.style.cssText='position:absolute;top:15px;left:50%;transform:translateX(-50%);font-size:26px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
    overlay.appendChild(te);
    startBGM('tv'); playSound('news');
    timerInterval = setInterval(()=>{
      if(cleaned)return; timeLeft--;
      const td=document.getElementById('tv-timer');
      if(td){td.textContent=`⏰ ${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,'0')}`;
        if(timeLeft<=30)td.style.color='#ff4444';}
      if(timeLeft<=0){clearInterval(timerInterval);showResult(false);}
    },1000);
  }

  function updateClues(){const a=document.getElementById('clue-area');if(a)a.textContent='🔍 手がかり: '+cluesFound.map(c=>c.digit).join(' ');}

  // === Phase 3: パスワード ===
  function showPassword() {
    if(cleaned)return; phase='password';
    const box=document.createElement('div');
    box.style.cssText='position:absolute;top:35%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);padding:20px 30px;border-radius:12px;border:2px solid #ffcc00;text-align:center;z-index:20;';
    const lb=document.createElement('div');lb.style.cssText='font-size:20px;color:#ffcc00;margin-bottom:12px;';
    lb.textContent='🔐 パスワードを入力！'; box.appendChild(lb);
    const iw=document.createElement('div');iw.style.cssText='display:flex;gap:8px;justify-content:center;margin-bottom:12px;';
    const digits=[];
    for(let i=0;i<4;i++){const inp=document.createElement('input');
      inp.type='number';inp.inputMode='numeric';inp.maxLength=1;inp.min=0;inp.max=9;
      inp.style.cssText='width:45px;height:55px;font-size:28px;text-align:center;border:2px solid #ffcc00;border-radius:8px;background:#222;color:#fff;';
      inp.addEventListener('input',e=>{if(e.target.value.length>=1){e.target.value=e.target.value.slice(-1);if(i<3)digits[i+1].focus();}});
      iw.appendChild(inp);digits.push(inp);}
    box.appendChild(iw);
    const sb=document.createElement('button');sb.className='game-btn';sb.style.cssText='font-size:18px;padding:10px 30px;';
    sb.textContent='🔓 解除！';
    const doSub=e=>{e.preventDefault();if(cleaned)return;const code=digits.map(d=>d.value).join('');
      if(code===TV_PASSWORD){clearInterval(timerInterval);box.remove();showResult(true);}
      else{showMessage(overlay,'パスワードが違う！',1500);playSound('poop');digits.forEach(d=>{d.value='';});digits[0].focus();}};
    sb.addEventListener('click',doSub);sb.addEventListener('touchstart',doSub,{passive:false});
    box.appendChild(sb);overlay.appendChild(box);digits[0].focus();
  }

  // === 結果 ===
  function showResult(success) {
    if(cleaned||resultShown)return; resultShown=true; phase='result';
    stopBGM(); clearInterval(timerInterval); overlay.innerHTML='';
    if(success){
      playSound('explode'); scene.background=new THREE.Color(0xffffff);
      timers.push(setTimeout(()=>{if(!cleaned)scene.background=new THREE.Color(0x87ceeb);},500));
      scene.add(E.createParticles(100,0xffff00,0.3)); scene.add(E.createParticles(60,0xff6600,0.25));
      studioObjects.forEach(o=>scene.remove(o));
      const h=E.createHikari();h.position.set(0,0,0);h.scale.setScalar(1.5);scene.add(h);
      const tx=E.createTextSprite('脱出成功！',{fontSize:44,color:'#ffcc00'});tx.position.set(0,5,0);scene.add(tx);
      timers.push(setTimeout(()=>{if(!cleaned){showBigMessage(overlay,d.escapeSuccess,3000);playSound('clear');addCoins(30);}},1500));
    } else {
      playSound('news');
      const ft=E.createTextSprite('脱出失敗…',{fontSize:44,color:'#ff4444'});ft.position.set(0,5,0);scene.add(ft);
      showBigMessage(overlay,d.escapeFail,3000);
    }
    timers.push(setTimeout(()=>{if(cleaned)return; showBigMessage(overlay,d.w3Clear,3000);playSound('clear');
      gameState.tvEscaped=success; timers.push(setTimeout(()=>{if(!cleaned)onComplete();},3500));},4000));
  }

  // === メインループ ===
  E.startLoop(()=>{
    if(cleaned)return; t+=0.016;
    if(phase==='studio') studioObjects.forEach(obj=>{
      if(obj.isMesh&&obj.userData.bobOffset!==undefined){
        obj.position.y+=Math.sin(t*2+obj.userData.bobOffset)*0.002;
        if(!obj.userData.found){const p=1+Math.sin(t*4+obj.userData.bobOffset)*0.1;obj.scale.setScalar(p);}}});
    if(phase==='studio'||phase==='password'){camera.position.x=Math.sin(t*0.4)*0.5;camera.lookAt(0,2,0);}
  });

  function cleanup(){cleaned=true;stopBGM();if(timerInterval)clearInterval(timerInterval);
    timers.forEach(id=>{clearTimeout(id);clearInterval(id);});
    E.stopLoop();E.clearClicks();E.disposeScene(scene);overlay.innerHTML='';}
  return { cleanup };
}
