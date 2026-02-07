// w2-school.js - W2ステージ1: 学校＆友達集め（3Dポリゴン版）
// フェーズ: home → walking → school → goHome のループ
// ランドセルを拾って学校へ行き、5人の友達を集めるステージ

import { DIALOGUES, FRIENDS } from './data.js';
import { playSound, startBGM, stopBGM } from './audio.js';
import { addCoins } from './economy.js';
import { showMessage, showBigMessage } from './ui.js';
import * as E from './engine3d.js';
const THREE = E.THREE;

export function initW2School(container, gameState, onComplete) {
  const d = DIALOGUES.w2;
  let cleaned = false;
  let t = 0;
  let hasRandoseru = false;
  let phase = 'home'; // home, walking, school, goHome
  let friendsFound = [];
  let visits = 0;
  let walkTimer = 0;

  // === シーン作成（朝の空） ===
  const scene = E.createScene(0x87ceeb);
  const camera = E.createCamera(55);
  camera.position.set(0, 8, 14);
  camera.lookAt(0, 2, 0);
  E.setScene(scene, camera);

  // 太陽光
  const sunLight = new THREE.PointLight(0xffee88, 0.8, 50);
  sunLight.position.set(10, 15, 5);
  scene.add(sunLight);

  // 地面（緑の芝生）
  const ground = E.createGround(60, 0x4a7c59);
  scene.add(ground);

  // === 3Dオブジェクト群（フェーズで表示/非表示）===
  const homeGroup = new THREE.Group();
  const schoolGroup = new THREE.Group();
  const walkGroup = new THREE.Group();

  // --- 家の構築 ---
  const house = E.createBuilding(5, 4, 4, 0xdd8844);
  house.position.set(0, 0, -3);
  homeGroup.add(house);

  // 屋根（三角プリズム風のボックス）
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 2, 4),
    new THREE.MeshLambertMaterial({ color: 0xcc3333 })
  );
  roof.position.set(0, 5.5, -3);
  roof.rotation.y = Math.PI / 4;
  homeGroup.add(roof);

  // ドア
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x664422 })
  );
  door.position.set(0, 1, -0.97);
  homeGroup.add(door);

  // ラベル
  const homeLabel = E.createTextSprite('ひかりちゃんの家', { fontSize: 36, color: '#ffffff' });
  homeLabel.position.set(0, 7.5, -3);
  homeGroup.add(homeLabel);

  // ランドセル（赤い小さなボックス）
  let randoseruMesh = null;
  function createRandoseru() {
    const r = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.7, 0.3),
      new THREE.MeshLambertMaterial({ color: 0xcc0000 })
    );
    body.position.y = 0.5;
    r.add(body);
    // フタ
    const flap = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.15, 0.32),
      new THREE.MeshLambertMaterial({ color: 0xaa0000 })
    );
    flap.position.set(0, 0.9, 0);
    r.add(flap);
    // 金具
    const buckle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.05),
      new THREE.MeshLambertMaterial({ color: 0xffcc00 })
    );
    buckle.position.set(0, 0.85, 0.17);
    r.add(buckle);
    return r;
  }

  // ひかりちゃん（家フェーズ用）
  const hikariHome = E.createHikari();
  hikariHome.position.set(2, 0, 2);
  homeGroup.add(hikariHome);

  scene.add(homeGroup);

  // --- 学校の構築 ---
  const schoolBuilding = E.createBuilding(10, 8, 5, 0xeeeecc);
  schoolBuilding.position.set(0, 0, -5);
  schoolGroup.add(schoolBuilding);

  // 学校の屋根
  const schoolRoof = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.5, 6),
    new THREE.MeshLambertMaterial({ color: 0x556677 })
  );
  schoolRoof.position.set(0, 8.5, -5);
  schoolGroup.add(schoolRoof);

  // 時計（球で簡易表現）
  const clock = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 12),
    new THREE.MeshLambertMaterial({ color: 0xffffff })
  );
  clock.position.set(0, 7.5, -2.45);
  schoolGroup.add(clock);

  const schoolLabel = E.createTextSprite('学校', { fontSize: 48, color: '#333333' });
  schoolLabel.position.set(0, 10.5, -5);
  schoolGroup.add(schoolLabel);

  // 友達NPC（5色のブロックキャラ）
  const friendColors = [0x4488ff, 0xff8844, 0x44cc44, 0xcc44cc, 0xffcc00];
  const friendHeadColors = [0xffdbac, 0xffe0bd, 0xffd5a5, 0xffccbb, 0xffddcc];
  const friendMeshes = [];

  FRIENDS.forEach((f, i) => {
    const npc = E.createBlockChar(friendColors[i], friendHeadColors[i], 0.8);
    const angle = ((i - 2) / 5) * Math.PI * 0.6;
    npc.position.set(Math.sin(angle) * 6, 0, Math.cos(angle) * 2);
    npc.userData.name = f.name;
    npc.userData.index = i;
    npc.userData.bobOffset = Math.random() * Math.PI * 2;
    npc.visible = false;

    // 名前ラベル
    const nameLabel = E.createTextSprite(f.name, { fontSize: 40, color: '#ffff00' });
    nameLabel.position.set(0, 3.5, 0);
    npc.add(nameLabel);

    schoolGroup.add(npc);
    friendMeshes.push(npc);

    // 友達クリック
    E.registerClick(npc, () => {
      if (cleaned || !npc.visible) return;
      if (friendsFound.includes(f.name)) return;
      friendsFound.push(f.name);
      playSound('friend');
      showMessage(overlay, `${f.name}がなかまになった！`, 1500);
      addCoins(3);
      updateCounter();

      // 友達が飛び上がって消えるアニメ
      npc.userData.flyAway = true;
      npc.userData.flyStart = t;

      checkProgress();
    });
  });

  scene.add(schoolGroup);
  schoolGroup.visible = false;

  // --- 歩行シーン ---
  const hikariWalk = E.createHikari();
  hikariWalk.position.set(-8, 0, 0);
  walkGroup.add(hikariWalk);

  // 道（灰色の長いボックス）
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(30, 0.1, 3),
    new THREE.MeshLambertMaterial({ color: 0x888888 })
  );
  road.position.set(0, 0.01, 0);
  walkGroup.add(road);

  // 街路樹
  for (let i = 0; i < 5; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x8B4513 })
    );
    trunk.position.set(-10 + i * 5, 0.75, 2.5);
    walkGroup.add(trunk);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0x228B22 })
    );
    leaves.position.set(-10 + i * 5, 2, 2.5);
    walkGroup.add(leaves);
  }

  const walkLabel = E.createTextSprite('学校へ向かっています...', { fontSize: 36, color: '#ffffff' });
  walkLabel.position.set(0, 5, 0);
  walkGroup.add(walkLabel);

  scene.add(walkGroup);
  walkGroup.visible = false;

  // === UI（オーバーレイ）===
  const overlay = E.getOverlay();
  overlay.innerHTML = '';

  // カウンター
  const counterEl = document.createElement('div');
  counterEl.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);font-size:28px;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;';
  counterEl.textContent = '👫 0/5';
  overlay.appendChild(counterEl);

  function updateCounter() {
    counterEl.textContent = `👫 ${friendsFound.length}/5`;
  }

  // ボタンコンテナ
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'position:absolute;bottom:12%;left:50%;transform:translateX(-50%);z-index:10;display:flex;gap:16px;';
  overlay.appendChild(btnContainer);

  startBGM('w2day');
  showMessage(overlay, d.morningIntro, 3000);

  // === フェーズ切替 ===
  function switchPhase(newPhase) {
    phase = newPhase;
    homeGroup.visible = false;
    schoolGroup.visible = false;
    walkGroup.visible = false;
    btnContainer.innerHTML = '';

    switch (phase) {
      case 'home': setupHome(); break;
      case 'walking': setupWalking(); break;
      case 'school': setupSchool(); break;
      case 'goHome': setupGoHome(); break;
    }
  }

  function setupHome() {
    homeGroup.visible = true;
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 2, 0);

    // ランドセル配置（まだ拾っていない場合）
    if (!hasRandoseru && !randoseruMesh) {
      randoseruMesh = createRandoseru();
      randoseruMesh.position.set(-2, 0, 1);
      homeGroup.add(randoseruMesh);

      E.registerClick(randoseruMesh, () => {
        if (cleaned || hasRandoseru) return;
        hasRandoseru = true;
        playSound('coin');
        showMessage(overlay, 'ランドセル装備！🎒', 1500);
        // ランドセルが飛び上がって消える
        randoseruMesh.userData.collected = true;
        randoseruMesh.userData.collectTime = t;
      });
    }

    // 学校へ行くボタン
    const goBtn = document.createElement('button');
    goBtn.className = 'game-btn';
    goBtn.textContent = '学校へ行く 🏫';
    goBtn.style.cssText = 'font-size:20px;padding:12px 30px;';
    const goAction = (e) => {
      e.preventDefault();
      if (cleaned) return;
      if (!hasRandoseru) {
        showMessage(overlay, d.forgotBag, 2000);
        playSound('poop');
        return;
      }
      switchPhase('walking');
    };
    goBtn.addEventListener('click', goAction);
    goBtn.addEventListener('touchstart', goAction, { passive: false });
    btnContainer.appendChild(goBtn);
  }

  function setupWalking() {
    walkGroup.visible = true;
    hikariWalk.position.set(-8, 0, 0);
    walkTimer = 0;
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 2, 0);
    playSound('chime');
  }

  function setupSchool() {
    schoolGroup.visible = true;
    visits++;
    camera.position.set(0, 8, 16);
    camera.lookAt(0, 3, 0);

    // 未発見の友達を表示
    const available = FRIENDS.filter(f => !friendsFound.includes(f.name));
    const showCount = Math.min(available.length, visits <= 1 ? 3 : available.length);

    friendMeshes.forEach(m => {
      m.visible = false;
      m.userData.flyAway = false;
    });

    for (let i = 0; i < showCount; i++) {
      const friendName = available[i].name;
      const mesh = friendMeshes.find(m => m.userData.name === friendName);
      if (mesh) {
        mesh.visible = true;
        mesh.scale.setScalar(0.8);
        mesh.position.y = 0;
      }
    }

    // 帰るボタン
    if (friendsFound.length < 5) {
      const homeBtn = document.createElement('button');
      homeBtn.className = 'game-btn';
      homeBtn.textContent = '家に帰る 🏠';
      homeBtn.style.cssText = 'font-size:20px;padding:12px 30px;';
      const homeAction = (e) => {
        e.preventDefault();
        if (cleaned) return;
        switchPhase('goHome');
      };
      homeBtn.addEventListener('click', homeAction);
      homeBtn.addEventListener('touchstart', homeAction, { passive: false });
      btnContainer.appendChild(homeBtn);
    }
  }

  function setupGoHome() {
    walkGroup.visible = true;
    hikariWalk.position.set(8, 0, 0);
    walkTimer = 0;
    camera.position.set(0, 6, 12);
    camera.lookAt(0, 2, 0);
    // 歩きラベルを変更
    walkLabel.material.map.dispose();
    const c2 = document.createElement('canvas');
    const ctx2 = c2.getContext('2d');
    c2.width = 512; c2.height = 128;
    ctx2.font = 'bold 36px sans-serif';
    ctx2.fillStyle = '#ffffff';
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText('家に帰ります...', 256, 64);
    walkLabel.material.map = new THREE.CanvasTexture(c2);
    walkLabel.material.needsUpdate = true;
  }

  // === 進捗チェック ===
  function checkProgress() {
    if (friendsFound.length >= 5) {
      btnContainer.innerHTML = '';
      showBigMessage(overlay, '友達全員集合！🎉 次のステージへ！', 2500);
      playSound('clear');

      // お祝いパーティクル
      const particles = E.createParticles(60, 0xffff00, 0.25);
      scene.add(particles);

      setTimeout(() => {
        if (!cleaned) onComplete();
      }, 3000);
    }
  }

  // === 初期フェーズ設定 ===
  switchPhase('home');

  // === メインループ ===
  E.startLoop(() => {
    if (cleaned) return;
    t += 0.016;

    // ひかりちゃん（家）のアイドルアニメ
    if (phase === 'home') {
      hikariHome.position.y = Math.sin(t * 2) * 0.1;
      hikariHome.rotation.y = Math.sin(t * 0.5) * 0.3;

      // ランドセル回転＋浮遊
      if (randoseruMesh && !hasRandoseru) {
        randoseruMesh.position.y = 0.5 + Math.sin(t * 3) * 0.2;
        randoseruMesh.rotation.y += 0.03;
      }
      // ランドセル収集アニメ
      if (randoseruMesh && randoseruMesh.userData.collected) {
        const elapsed = t - randoseruMesh.userData.collectTime;
        randoseruMesh.position.y += 0.2;
        randoseruMesh.scale.setScalar(Math.max(0, 1 - elapsed * 3));
        if (elapsed > 0.5) {
          homeGroup.remove(randoseruMesh);
          E.unregisterClick(randoseruMesh);
          randoseruMesh = null;
        }
      }
    }

    // 歩行アニメ
    if (phase === 'walking' || phase === 'goHome') {
      walkTimer += 0.016;
      const dir = phase === 'walking' ? 1 : -1;
      hikariWalk.position.x += dir * 0.08;
      hikariWalk.position.y = Math.abs(Math.sin(t * 10)) * 0.15;
      hikariWalk.rotation.y = dir > 0 ? 0 : Math.PI;

      // 歩行完了（2秒後にフェーズ切替）
      if (walkTimer > 2.0) {
        if (phase === 'walking') {
          switchPhase('school');
        } else {
          // ラベルを元に戻す
          walkLabel.material.map.dispose();
          const c3 = document.createElement('canvas');
          const ctx3 = c3.getContext('2d');
          c3.width = 512; c3.height = 128;
          ctx3.font = 'bold 36px sans-serif';
          ctx3.fillStyle = '#ffffff';
          ctx3.textAlign = 'center';
          ctx3.textBaseline = 'middle';
          ctx3.fillText('学校へ向かっています...', 256, 64);
          walkLabel.material.map = new THREE.CanvasTexture(c3);
          walkLabel.material.needsUpdate = true;
          switchPhase('home');
        }
      }
    }

    // 学校フェーズ：友達のアニメーション
    if (phase === 'school') {
      friendMeshes.forEach(m => {
        if (!m.visible) return;

        // 飛んで消えるアニメ
        if (m.userData.flyAway) {
          const elapsed = t - m.userData.flyStart;
          m.position.y += 0.15;
          m.rotation.y += 0.2;
          m.scale.setScalar(Math.max(0, 0.8 - elapsed * 1.5));
          if (elapsed > 0.8) {
            m.visible = false;
          }
          return;
        }

        // アイドルアニメ（上下揺れ）
        m.position.y = Math.sin(t * 2 + m.userData.bobOffset) * 0.15;
        m.rotation.y = Math.sin(t * 0.8 + m.userData.bobOffset) * 0.3;
      });
    }

    // 太陽光パルス
    sunLight.intensity = 0.8 + Math.sin(t) * 0.1;

    // カメラの軽い揺れ
    if (phase === 'home' || phase === 'school') {
      camera.position.x = Math.sin(t * 0.3) * 0.5;
    }
  });

  // === クリーンアップ ===
  function cleanup() {
    cleaned = true;
    stopBGM();
    E.stopLoop();
    E.clearClicks();
    E.disposeScene(scene);
    overlay.innerHTML = '';
  }

  return { cleanup };
}
