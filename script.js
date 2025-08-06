// === Canvas 初期化 ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// === 変数 ===
let playerText = "";
let playerX = width / 2;
let playerY = height - 120;
let bullets = [];
let sushiList = [];
let effects = [];
let score = 0;
let miss = 0;
let gameRunning = false;
let isGameOver = false;
let scoreSent = false;
let movingLeft = false;
let movingRight = false;

// === 名前データ ===
let nameRaw = "";       // 入力した名前（アルファベット用）
let nameIndex = 0;      // 弾に使用する文字のインデックス

// === バグモード ===
let bugMode = false;
let bugTimer = 0;

// === デコ文字（プレイヤー表示用） ===
const smallCapsMap = {
  a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
  k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ',
  u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
};
const diacritics = ['͛','͝','͞','̷','̋','͡','͘','͒','͠'];

function addDecoration(baseChar) {
  let decorated = baseChar;
  const count = Math.floor(Math.random() * 3) + 2;
  for (let i = 0; i < count; i++) {
    decorated += diacritics[Math.floor(Math.random() * diacritics.length)];
  }
  return decorated;
}
function toFancyDeco(text) {
  return text.toLowerCase().split("").map(ch => {
    if (ch === " ") return " ";
    const base = smallCapsMap[ch] || ch;
    return addDecoration(base);
  }).join("");
}

// === 絵文字 ===
const sushiEmoji = "🍣";
const chickEmoji = "🐣";

// === ゲーム開始 ===
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('retryBtn').addEventListener('click', () => location.reload());

function startGame() {
  const inputText = document.getElementById('textInput').value.trim();
  if (!inputText) return;

  nameRaw = inputText.toUpperCase(); // 弾用（大文字）
  playerText = toFancyDeco(inputText); // プレイヤー表示用デコ文字

  document.getElementById('startScreen').classList.add('hidden');
  canvas.style.display = 'block';
  document.getElementById('controls').classList.remove('hidden');
  gameRunning = true;
  gameLoop();
  spawnSushi();
}

// === 操作イベント ===

// キーボード操作
document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  if (e.key === 'ArrowLeft') movingLeft = true;
  if (e.key === 'ArrowRight') movingRight = true;
  if (e.key === ' ') shootBullet();
});
document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') movingLeft = false;
  if (e.key === 'ArrowRight') movingRight = false;
});

// タッチ・ボタン操作
['btnLeft','btnRight','btnShoot'].forEach(id=>{
  const btn = document.getElementById(id);

  btn.addEventListener('mousedown', () => {
    if(id==='btnLeft') movingLeft = true;
    if(id==='btnRight') movingRight = true;
  });
  btn.addEventListener('mouseup', () => {
    if(id==='btnLeft') movingLeft = false;
    if(id==='btnRight') movingRight = false;
  });

  btn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // 長押しコピー防止
    if(id==='btnLeft') movingLeft = true;
    if(id==='btnRight') movingRight = true;
    if(id==='btnShoot' && gameRunning) shootBullet();
  }, { passive:false });

  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    if(id==='btnLeft') movingLeft = false;
    if(id==='btnRight') movingRight = false;
  }, { passive:false });
});

// === ダブルタップズーム防止 ===
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

// === 弾発射（アルファベット仕様） ===
function shootBullet() {
  if (!nameRaw) return;
  const char = nameRaw[nameIndex % nameRaw.length]; // 名前の文字を順番に使用
  bullets.push({ x: playerX, y: playerY - 20, char: char });
  nameIndex++;
}

// === 寿司生成 ===
function spawnSushi() {
  if (!gameRunning) return;
  const isSushi = Math.random() < 0.7;
  const isGiant = Math.random() < 0.1; // 10%で巨大寿司
  sushiList.push({
    x: Math.random() * (width - 50),
    y: -30,
    emoji: isSushi ? sushiEmoji : chickEmoji,
    type: isSushi ? 'sushi' : 'chick',
    giant: isGiant
  });
  setTimeout(spawnSushi, 1000);
}

// === プレイヤー移動 ===
function updatePlayerPosition() {
  if (movingLeft) playerX -= 5;
  if (movingRight) playerX += 5;
  if (playerX < 20) playerX = 20;
  if (playerX > width - 20) playerX = width - 20;
}

// === バグモード発動 ===
function activateBugMode() {
  bugMode = true;
  bugTimer = 180; // 約3秒
}

// === ファミコン風ドットグリッチ描画 ===
function renderBugEffect() {
  if (!bugMode) return;

  // 軽い画面揺れ
  ctx.save();
  ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);

  // レトロカラーパレット（白・黒・赤）
  const colors = ['#ffffff', '#ff0000', '#000000'];

  // ランダムドット
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const w = (Math.random() * 3) + 2;
    const h = (Math.random() * 3) + 2;
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(x, y, w, h);
  }

  // 横ラインノイズ
  for (let j = 0; j < 2; j++) {
    const y = Math.random() * height;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(0, y, width, 2);
  }

  ctx.restore();

  // スコアボードをグリッチ風に
  const glitchText = [
    `S//C0RΞ=${score}`,
    `§§CORE ${score}!`,
    `S⟟⟟◎RΞ: ${score}`
  ];
  document.getElementById('scoreBoard').innerText =
    `${glitchText[Math.floor(Math.random() * glitchText.length)]} | M!SS: ${miss}`;

  // タイマー管理
  bugTimer--;
  if (bugTimer <= 0) {
    bugMode = false;
  }
}

// === メインループ ===
function gameLoop() {
  if (!gameRunning && !isGameOver) return;
  ctx.clearRect(0, 0, width, height);

  updatePlayerPosition();

  // プレイヤー描画
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(playerText, playerX, playerY);

  // 弾描画（アルファベット）
  bullets.forEach((bullet, i) => {
    bullet.y -= bugMode ? 15 : 10; // バグ中は加速
    ctx.font = "24px sans-serif";
    ctx.fillText(bullet.char, bullet.x, bullet.y);
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // 寿司描画＆判定
  sushiList.forEach((sushi, i) => {
    sushi.y += bugMode ? 5 : 3; // バグ中は加速
    ctx.font = sushi.giant ? "48px sans-serif" : "24px sans-serif";
    ctx.fillStyle = sushi.giant && sushi.type === 'sushi' ? "blue" : "#000";
    ctx.fillText(sushi.emoji, sushi.x, sushi.y);

    bullets.forEach((bullet, j) => {
      if (Math.abs(bullet.x - sushi.x) < (sushi.giant ? 40 : 25) &&
          Math.abs(bullet.y - sushi.y) < (sushi.giant ? 40 : 25)) {

        // 巨大寿司ならバグ発動
        if (sushi.giant && sushi.type === 'sushi') {
          activateBugMode();
        }

        // 命中時にアルファベット花火
        createLetterExplosion(bullet.char, sushi.x, sushi.y, sushi.type === 'sushi' ? 'green' : 'red');

        if (sushi.type === 'sushi') {
          score++;
        } else {
          score--;
        }
        sushiList.splice(i, 1);
        bullets.splice(j, 1);
      }
    });

    if (sushi.y > height) {
      sushiList.splice(i, 1);
      if (sushi.type === 'sushi') {
        miss++;
        if (miss >= 3) endGame();
      }
    }
  });

  // エフェクト描画（花火）
  effects.forEach((effect, i) => {
    ctx.font = "16px sans-serif";
    ctx.fillStyle = effect.color;
    ctx.fillText(effect.char, effect.x, effect.y);
    effect.x += effect.vx;
    effect.y += effect.vy;
    effect.life--;
    if (effect.life <= 0) effects.splice(i, 1);
  });

  // バグ演出
  renderBugEffect();

  // スコア表示（通常時のみ）
  if (!bugMode) {
    document.getElementById('scoreBoard').innerText = `Score: ${score} | Miss: ${miss}`;
  }

  requestAnimationFrame(gameLoop);
}

// === アルファベット花火エフェクト ===
function createLetterExplosion(char, x, y, color) {
  for (let i = 0; i < 6; i++) {
    effects.push({
      char: char,
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      color: color,
      life: 30
    });
  }
}

// === ゲーム終了・ランキング処理（既存仕様） ===
function endGame() {
  gameRunning = false;
  isGameOver = true;
  document.getElementById('gameOver').classList.remove('hidden');
  document.getElementById('finalScore').innerText = `Your Score: ${score}`;
  if (!scoreSent) {
    saveScore(playerText, score);
    scoreSent = true;
  }
}

function saveScore(name, score) {
  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec", {
    method: "POST",
    body: JSON.stringify({ name: name, score: score })
  })
  .then(res => res.text())
  .then(() => { loadHighScores(); })
  .catch(err => console.error("Fetch error:", err));
}

function loadHighScores() {
  const container = document.getElementById("highScores");
  container.innerHTML = `
    <div style="text-align:center;">
      <h3 style="margin:0 0 8px 0;">Your Score</h3>
      <p style="font-size:20px; margin:0 0 16px 0;">${score}</p>
      <h3 style="margin:0; animation: blink 1s infinite;">Ranking...</h3>
      <style>
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0; }
        }
      </style>
    </div>
  `;

  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec")
    .then(res => res.json())
    .then(data => {
      let html = `<div style="text-align:center;"><h3 style="margin:0 0 8px 0;">High Scores</h3><ul style='list-style:none; padding:0; margin:0; max-width:90%; margin:auto;'>`;
      data.forEach((item, index) => {
        let rankColor = "#444";
        if (index === 0) rankColor = "#FFD700";
        else if (index === 1) rankColor = "#C0C0C0";
        else if (index === 2) rankColor = "#CD7F32";

        html += `
          <li style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            font-size:16px;
            border-bottom:1px solid #ddd;
            padding:8px 0;
            opacity:0;
            transform:translateY(10px);
            transition:all 0.5s ${index * 0.3}s;
            word-break: break-word;">
            <span style="color:${rankColor}; font-weight:bold; min-width:40px;">${index + 1}位</span>
            <span style="flex:1; text-align:center; white-space:normal; word-break:break-word; max-width:200px;">${item[0]}</span>
            <span style="font-weight:bold; min-width:40px; text-align:right;">${item[1]}</span>
          </li>`;
      });
      html += `</ul></div>`;
      container.innerHTML = html;

      setTimeout(() => {
        container.querySelectorAll('li').forEach(li => {
          li.style.opacity = 1;
          li.style.transform = 'translateY(0)';
        });
      }, 100);
    });
}
