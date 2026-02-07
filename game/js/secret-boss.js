// secret-boss.js - 隠しステージ: お化け連打バトル（3Dポリゴン版）
// Phase1: 50体のお化けウェーブ → Phase2: 巨大ボスお化け
import { DIALOGUES } from './data.js';
import { playSound, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initSecretBoss(container, gameState, onComplete) {
  const d = DIALOGUES.secret;
  let cleaned = false, t = 0, ghostsDefeated = 0, combo = 0;
  const TOTAL = 50;
  let phase = 'swarm', bossHP = 100, bossExploded = false;
  const timers = [], ghosts = [];
  let boss = null, bossEyes = [];

  // === シーン（真っ黒）===
  const scene = E.createScene(0x000000);
  scene.fog = new THREE.Fog(0x000000, 20, 60);
  const camera = E.createCamera(60);
  camera.position.set(0, 12, 18); camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);
  scene.children.forEach(c => { if(c.isAmbientLight)c.intensity=0.15; if(c.isDirectionalLight)c.intensity=0.2; });
  const redLight = new THREE.PointLight(0xff2222, 0.6, 30); redLight.position.set(0,8,0); scene.add(redLight);
  const blueLight = new THREE.PointLight(0x2244ff, 0.4, 25); blueLight.position.set(-5,5,5); scene.add(blueLight);
  scene.add(E.createGround(50, 0x0a0a0a));

  // === UI ===
  const overlay = E.getOverlay(); overlay.innerHTML = '';
  const comboEl = document.createElement('div');
  comboEl.style.cssText = 'position:absolute;top:60px;left:50%;transform:translateX(-50%);font-size:24px;color:#ff6600;text-shadow:2px 2px 4px #000;z-index:10;transition:all 0.15s;';
  comboEl.textContent = '0 コンボ！'; overlay.appendChild(comboEl);
  const progressEl = document.createElement('div');
  progressEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  progressEl.textContent = `👻 0/${TOTAL}`; overlay.appendChild(progressEl);
  showMessage(overlay, d.intro, 3000);

  // === お化けスポーン ===
  function spawnGhost() {
    if (cleaned || ghostsDefeated >= TOTAL) return;
    const ghost = E.createGhost(0.6 + Math.random() * 0.5);
    const a = Math.random()*Math.PI*2, r = 3+Math.random()*12;
    ghost.position.set(Math.cos(a)*r, 1+Math.random()*4, Math.sin(a)*r-2);
    ghost.userData.alive = true;
    ghost.userData.dx = (Math.random()-0.5)*0.12;
    ghost.userData.dy = (Math.random()-0.5)*0.05;
    ghost.userData.dz = (Math.random()-0.5)*0.12;
    ghost.userData.bobOffset = Math.random()*Math.PI*2;
    ghost.userData.pulsePhase = Math.random()*Math.PI*2;
    scene.add(ghost); ghosts.push(ghost);

    E.registerClick(ghost, () => {
      if (cleaned || !ghost.userData.alive || phase !== 'swarm') return;
      ghost.userData.alive = false; ghost.userData.defeatTime = t;
      ghostsDefeated++; combo++; playSound('hit');
      comboEl.textContent = `${combo} コンボ！`;
      if (combo % 10 === 0) {
        comboEl.style.fontSize = '36px'; comboEl.style.color = '#ffcc00';
        showMessage(overlay, `🔥 ${combo}コンボ！`, 800);
        timers.push(setTimeout(() => { comboEl.style.fontSize='24px'; comboEl.style.color='#ff6600'; }, 300));
      }
      progressEl.textContent = `👻 ${ghostsDefeated}/${TOTAL}`; addCoins(1);
      const alive = ghosts.filter(g => g.userData.alive).length;
      if (ghostsDefeated < TOTAL && alive < 8) {
        const n = Math.min(5, TOTAL - ghostsDefeated - alive);
        for (let i = 0; i < n; i++) spawnGhost();
      }
      if (ghostsDefeated >= TOTAL) startBossPhase();
    });
  }
  // 初期15体
  for (let i = 0; i < Math.min(15, TOTAL); i++) spawnGhost();

  // === ボスフェーズ ===
  function startBossPhase() {
    phase = 'boss'; showBigMessage(overlay, d.bossAppear, 2500); playSound('brainrot');
    ghosts.forEach(g => { scene.remove(g); E.unregisterClick(g); });
    timers.push(setTimeout(() => { if (!cleaned) spawnBoss(); }, 2500));
  }

  function spawnBoss() {
    boss = E.createGhost(3); boss.position.set(0, 2, 0); scene.add(boss);
    boss.traverse(child => {
      if (child.isMesh && child.geometry?.type === 'SphereGeometry') {
        const p = child.geometry.parameters;
        if (p && p.radius < 0.5) bossEyes.push(child);
      }
    });
    progressEl.textContent = `BOSS HP: ${bossHP}%`;
    // HPバー
    const hw = document.createElement('div'); hw.id = 'boss-hp-wrap';
    hw.style.cssText = 'position:absolute;top:95px;left:50%;transform:translateX(-50%);width:250px;z-index:10;';
    const bg = document.createElement('div');
    bg.style.cssText = 'width:100%;height:16px;background:#333;border-radius:8px;overflow:hidden;border:2px solid #666;';
    const fill = document.createElement('div'); fill.id = 'boss-hp-fill';
    fill.style.cssText = 'width:100%;height:100%;background:linear-gradient(90deg,#ff0000,#ff6600);transition:width 0.1s;';
    bg.appendChild(fill); hw.appendChild(bg); overlay.appendChild(hw);

    E.registerClick(boss, () => {
      if (cleaned || bossHP <= 0) return;
      bossHP -= 2; combo++; playSound('hit');
      comboEl.textContent = `${combo} コンボ！`;
      if (combo % 20 === 0) showMessage(overlay, `🔥🔥 ${combo}コンボ！！`, 800);
      const fl = document.getElementById('boss-hp-fill');
      if (fl) fl.style.width = Math.max(0, bossHP) + '%';
      progressEl.textContent = `BOSS HP: ${Math.max(0, bossHP)}%`;
      // ヒットフラッシュ
      boss.traverse(c => {
        if (c.isMesh && c.material?.opacity !== undefined && c.material.opacity < 1) {
          c.material.color.setHex(0xff4444);
          setTimeout(() => { if (!cleaned && c.material) c.material.color.setHex(0xffffff); }, 80);
        }
      });
      // シーン明るく
      const br = (100 - bossHP) / 100;
      scene.children.forEach(c => { if (c.isAmbientLight) c.intensity = 0.15 + br * 0.6; });
      const v = Math.floor(br * 40);
      scene.background = new THREE.Color(`rgb(${v},${v},${v + 10})`);
      if (bossHP <= 0) bossExplode();
    });
  }

  // === ボス大爆発 ===
  function bossExplode() {
    if (cleaned || bossExploded) return; bossExploded = true;
    playSound('bigExplode'); showBigMessage(overlay, d.explosion, 3000);
    scene.background = new THREE.Color(0xffffff);
    timers.push(setTimeout(() => { if (!cleaned) scene.background = new THREE.Color(0x222244); }, 800));
    if (boss) { scene.remove(boss); E.unregisterClick(boss); }
    // 虹色パーティクル
    [0xff0000,0xff8800,0xffff00,0x00ff00,0x0088ff,0x8800ff,0xff00ff].forEach(c => scene.add(E.createParticles(30,c,0.3)));
    const hw = document.getElementById('boss-hp-wrap'); if (hw) hw.remove();
    scene.children.forEach(c => { if(c.isAmbientLight)c.intensity=0.8; if(c.isDirectionalLight)c.intensity=1.0; });

    timers.push(setTimeout(() => {
      if (cleaned) return;
      showBigMessage(overlay, d.allClear, 4000); playSound('clear'); addCoins(100);
      const txt = E.createTextSprite('伝説のプレイヤー！', {fontSize:36,color:'#ffd700'});
      txt.position.set(0,5,0); scene.add(txt);
      const hk = E.createHikari(); hk.position.set(0,0,0); hk.scale.setScalar(1.5); scene.add(hk);
      timers.push(setTimeout(() => { if (!cleaned) onComplete(); }, 5000));
    }, 3000));
  }

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return; t += 0.016;
    if (phase === 'swarm') {
      ghosts.forEach(g => {
        if (!g.userData.alive) {
          if (g.userData.defeatTime !== undefined) {
            const e = t - g.userData.defeatTime;
            g.position.y += 0.2; g.rotation.z += 0.15;
            g.scale.setScalar(Math.max(0, 1 - e * 2.5));
            if (e > 0.6) { scene.remove(g); E.unregisterClick(g); g.userData.defeatTime = undefined; }
          }
          return;
        }
        g.position.x += g.userData.dx; g.position.y += g.userData.dy; g.position.z += g.userData.dz;
        g.position.y += Math.sin(t*2+g.userData.bobOffset)*0.005;
        g.scale.setScalar(1 + Math.sin(t*3+g.userData.pulsePhase)*0.3);
        if (g.position.x<-18||g.position.x>18) g.userData.dx*=-1;
        if (g.position.y<0.5||g.position.y>6) g.userData.dy*=-1;
        if (g.position.z<-12||g.position.z>12) g.userData.dz*=-1;
        if (Math.random()<0.01) g.userData.dx=(Math.random()-0.5)*0.12;
        if (Math.random()<0.01) g.userData.dz=(Math.random()-0.5)*0.12;
        g.rotation.y = Math.sin(t*1.5+g.userData.bobOffset)*0.5;
      });
    }
    if (phase === 'boss' && boss && !bossExploded) {
      boss.position.y = 2 + Math.sin(t*0.8)*0.5; boss.rotation.y = Math.sin(t*0.5)*0.3;
      bossEyes.forEach(eye => { eye.position.x+=Math.sin(t*2)*0.002; eye.position.y+=Math.cos(t*1.5)*0.001; });
      boss.scale.setScalar(1 + Math.sin(t*2)*0.08);
    }
    redLight.intensity = 0.6+Math.sin(t*3)*0.3; blueLight.intensity = 0.4+Math.sin(t*2+1)*0.2;
    redLight.position.x = Math.sin(t*0.7)*5; blueLight.position.z = Math.cos(t*0.5)*5;
    camera.position.x = Math.sin(t*0.4)*1; camera.lookAt(0,2,0);
  });

  function cleanup() { cleaned=true; stopBGM(); timers.forEach(id=>{clearTimeout(id);clearInterval(id);});
    E.stopLoop(); E.clearClicks(); E.disposeScene(scene); overlay.innerHTML=''; }
  return { cleanup };
}
