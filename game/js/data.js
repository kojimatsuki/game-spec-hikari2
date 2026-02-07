// data.js - 全ステージの設定データ・セリフ

export const GAME_TITLE = 'ひかりちゃん大冒険 〜イタリアンブレインロットからの脱出〜';

export const WORLDS = [
  {
    id: 1, name: 'イタリアンブレインロットの世界', icon: '🚽',
    stages: [
      { id: 'w1-1', name: 'うんこ3回', icon: '💩' },
      { id: 'w1-2', name: 'トイレ食べ', icon: '🚽' },
      { id: 'w1-3', name: 'お腹の中', icon: '🔪' },
      { id: 'w1-4', name: 'バイク脱出', icon: '🏍️' },
    ]
  },
  {
    id: 2, name: '学校と夜のお化け', icon: '🏫',
    stages: [
      { id: 'w2-1', name: '学校＆友達集め', icon: '🎒' },
      { id: 'w2-2', name: '夜のお化け', icon: '👻' },
      { id: 'w2-3', name: '空飛びうんちフライト', icon: '💩✈️' },
    ]
  },
  {
    id: 3, name: '魔法使いひかりちゃん', icon: '🧙‍♀️',
    stages: [
      { id: 'w3-1', name: '人形食べ＆光集め', icon: '🧸' },
      { id: 'w3-2', name: '魔法使い変身', icon: '🪄' },
      { id: 'w3-3', name: 'テレビ脱出', icon: '📺' },
    ]
  }
];

export const HIKARI_FORMS = {
  normal: { emoji: '👧', label: 'ひかりちゃん' },
  roblox: { emoji: '🧱', label: 'ブロックひかり' },
  school: { emoji: '🎒', label: 'ランドセルひかり' },
  scared: { emoji: '😨', label: 'こわがりひかり' },
  flying: { emoji: '🕊️', label: 'そらとびひかり' },
  magician: { emoji: '🧙‍♀️', label: '魔法使いひかり' },
  cat: { emoji: '🐱', label: 'ねこひかり', cost: 30 },
  dog: { emoji: '🐕', label: 'いぬひかり', cost: 20 },
  bird: { emoji: '🐦', label: 'とりひかり', cost: 25 },
  fish: { emoji: '🐟', label: 'さかなひかり', cost: 20 },
  sheep: { emoji: '🐑', label: 'ひつじひかり', cost: 15 },
  lion: { emoji: '🦁', label: 'ライオンひかり', cost: 50 },
  caster: { emoji: '🎤', label: 'キャスターひかり' },
};

export const BRAINROT_FORMS = [
  { emoji: '👾', name: '第1形態', speed: 2, size: 60 },
  { emoji: '👿', name: '第2形態（翼）', speed: 3.5, size: 75 },
  { emoji: '💀', name: '第3形態（巨大）', speed: 4, size: 120 },
];

export const FRIENDS = [
  { emoji: '👦', name: 'たけし' },
  { emoji: '👧', name: 'さくら' },
  { emoji: '👩‍🦰', name: 'みき' },
  { emoji: '🧒', name: 'けんた' },
  { emoji: '👱', name: 'ゆうき' },
];

export const ANIMALS_FOR_TRANSFORM = ['cat','dog','bird','fish','sheep','lion'];

export const DIALOGUES = {
  w1: {
    poopIntro: 'うんこを3回タップしよう！💩',
    evolved: 'ゲームが進化した！🎮',
    toiletIntro: 'トイレを食べよう！🚽 10個食べるとイベント発生！',
    brainrotAppear: 'イタリアンブレインロット登場！👾',
    brainrotEat: 'ぱくっ！😱 食べられちゃった！',
    bellyIntro: 'お腹の中だ！コイン💰と包丁🔪を集めよう！',
    cutReady: '包丁が6本揃った！切るボタンで脱出だ！🔪',
    cutting: 'ビリビリビリ！✂️',
    escaped: '脱出成功！バイクを発見！🏍️',
    bikeIntro: 'バイクで逃げろ！障害物を避けて！',
    brainrotEvolve: 'ブレインロットが進化した！',
    brainrotDeath: 'ブ…ブレイン…ロッ…ト…💀',
    w1Clear: 'ワールド1 クリア！🎉',
  },
  w2: {
    morningIntro: 'ランドセル🎒を忘れずに学校へ行こう！',
    forgotBag: 'あ！ランドセル忘れた！🎒',
    friendJoin: 'なかまになった！',
    nightIntro: '夜になった…お化けが出るぞ！👻',
    ghostTip: '一発なんで大丈夫！タップで倒そう！',
    flyIntro: '空を飛ぼう！タップで上昇！💩が自動で落ちるよ！',
    flyComplete: 'うんちフライト完了！💩✈️',
    w2Clear: 'ワールド2 クリア！🎉',
  },
  w3: {
    dollIntro: '人形を食べて光を集めよう！✨ 50個で魔法使いに！',
    magicAwaken: 'ひかりちゃんが魔法使いに覚醒！🧙‍♀️✨',
    momWant: '猫が欲しいな〜🐱',
    momThanks: 'かわいい〜！ありがとう😊',
    tvSuck: 'きゃー！テレビに吸い込まれる！🌀',
    newsFlash: '速報です！ひかりちゃんがテレビの中に閉じ込められました！',
    escapeSuccess: 'ひかりちゃんは無事帰ってきました！🎉',
    escapeFail: 'ひかりちゃんは今もニュースに出ています…📺',
    w3Clear: 'ワールド3 クリア！🎉',
  },
  secret: {
    intro: '隠しステージ！お化けを連打で倒せ！👻',
    bossAppear: '最後の巨大お化けだ！連打連打連打！',
    explosion: '💥💥💥 大・爆・発 💥💥💥',
    allClear: '全面全クリ！！！🏆✨ 伝説のプレイヤー！',
  },
  ending: {
    normal: [
      'イタリアンブレインロット、友達、魔法…すごい冒険だったね',
      'でもまた吸い込まれそう…📺',
    ],
    secret: [
      'ひかりちゃんはゲームの世界と現実を自由に行き来できるようになりました',
      'ひかりちゃんは伝説のプレイヤーになりました✨',
    ],
  },
};

export const TV_CLUES = [
  { item: '📹', name: 'テレビカメラ', clue: 'カメラの裏に数字「3」', digit: '3' },
  { item: '📄', name: '原稿', clue: '原稿の端に数字「7」', digit: '7' },
  { item: '🖥️', name: 'モニター', clue: 'モニターに数字「1」', digit: '1' },
  { item: '🎙️', name: 'マイク', clue: 'マイクの底に数字「9」', digit: '9' },
];

export const TV_PASSWORD = '3719';
