// === Canvas 初期化 ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// === ゲーム状態 ===
let mode = "shooting"; // "shooting" or "runner"
let gameRunning = false;
let isGameOver = false;
let score = 0;
let miss = 0;

// === プレイヤー ===
let playerText = "";
let playerX = width / 2;
let playerY = height - 120;
let nameRaw = "";
let nameIndex = 0;
let bullets = [];
let sushiList = [];
let effects = [];
let movingLeft = false;
let movingRight = false;

// === ランナー用 ===
let runnerY = height - 130;
let runnerVY = 0;
let isJumping = false;
const gravity = 0.6;
let runnerObstacles = [];
let runnerBgOffset = 0;

// === バグ・特殊モード ===
let bugMode = false;
let bugTimer = 0;
let tanukiMode = false;

// === デコ文字 ===
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

  if (inputText.toUpperCase() === "TANU") tanukiMode = true;

  nameRaw = inputText.toUpperCase();
  playerText = toFancyDeco(inputText);

  document.getElementById('startScreen').classList.add('hidden');
  canvas.style.display = 'block';
  document.getElementById('controls').classList.remove('hidden');
  gameRunning = true;
  mode = "shooting";
  gameLoop();
  spawnSushi();
}

// === 操作（SHOOT反応改善）===
function shootAction() {
  if (mode === "shooting") shootBullet();
  else if (mode === "runner") jumpRunner();
}

// クリック・タッチ両対応
document.getElementById('btnShoot').addEventListener('click', shootAction);
document.getElementById('btnShoot').addEventListener('touchstart', (e) => {
  e.preventDefault();
  shootAction();
}, { passive: false });

// キーボード
document.addEventListener('keydown', (e) => {
  if (e.key === ' ') shootAction();
});

// === 左右移動ボタン（タッチ＆マウス両対応）===
// タッチ
document.getElementById('btnLeft').addEventListener('touchstart', (e) => {
  e.preventDefault();
  movingLeft = true;
}, { passive: false });
document.getElementById('btnLeft').addEventListener('touchend', (e) => {
  e.preventDefault();
  movingLeft = false;
}, { passive: false });

document.getElementById('btnRight').addEventListener('touchstart', (e) => {
  e.preventDefault();
  movingRight = true;
}, { passive: false });
document.getElementById('btnRight').addEventListener('touchend', (e) => {
  e.preventDefault();
  movingRight = false;
}, { passive: false });

// マウス
document.getElementById('btnLeft').addEventListener('mousedown', () => {
  movingLeft = true;
});
document.getElementById('btnLeft').addEventListener('mouseup', () => {
  movingLeft = false;
});
document.getElementById('btnRight').addEventListener('mousedown', () => {
  movingRight = true;
});
document.getElementById('btnRight').addEventListener('mouseup', () => {
  movingRight = false;
});

// === 弾発射 ===
function shootBullet() {
  if (!nameRaw) return;
  const char = bugMode ? sushiEmoji : nameRaw[nameIndex % nameRaw.length];
  bullets.push({ x: playerX, y: playerY - 20, char: char });
  nameIndex++;
}

// === 寿司生成 ===
function spawnSushi() {
  if (!gameRunning || mode !== "shooting") return;
  const isSushi = Math.random() < 0.7;

  let giantType = 0;
  const r = Math.random();
  if (r < 0.15) giantType = 1;   // 中サイズ（反転）
  else if (r < 0.25) giantType = 2; // 大サイズ（ランナー）

  sushiList.push({
    x: Math.random() * (width - 50),
    y: -30,
    emoji: tanukiMode ? "🦝" : (isSushi ? sushiEmoji : chickEmoji),
    type: isSushi ? 'sushi' : 'chick',
    giant: giantType
  });
  setTimeout(spawnSushi, 1000);
}

// === スコア表示 ===
function updateScoreBoard() {
  document.getElementById('scoreBoard').innerText =
    tanukiMode ? `たぬ: ${score} | Miss: ${miss}` : `Score: ${score} | Miss: ${miss}`;
}

// === プレイヤー移動 ===
function updatePlayerPosition() {
  if (movingLeft) playerX -= 5;
  if (movingRight) playerX += 5;
  if (playerX < 20) playerX = 20;
  if (playerX > width - 20) playerX = width - 20;
}

// === バグ発動（上下反転）===
function activateBugMode() {
  bugMode = true;
  bugTimer = 300; // 5秒
}

// === ランナーモード発動 ===
function activateRunnerMode() {
  mode = "runner";
  runnerObstacles = [];
  runnerBgOffset = 0;
  runnerY = height - 130;
  runnerVY = 0;
  isJumping = false;

  // 10秒後に戻す
  setTimeout(() => {
    mode = "shooting";
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#000";
    ctx.font = "24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SYSTEM RESTORED", width / 2, height / 2);
    ctx.restore();
  }, 10000);

  spawnRunnerObstacle();
}

// === ランナー・ジャンプ ===
function jumpRunner() {
  if (!isJumping) {
    runnerVY = -12;
    isJumping = true;
  }
}

// === ランナー用障害物生成 ===
function spawnRunnerObstacle() {
  if (mode !== "runner") return;
  const isSushi = Math.random() < 0.7;
  runnerObstacles.push({
    x: width,
    y: height - 150,
    emoji: isSushi ? sushiEmoji : chickEmoji,
    type: isSushi ? 'sushi' : 'chick'
  });
  setTimeout(spawnRunnerObstacle, 1200);
}

// === メインループ ===
function gameLoop() {
  if (!gameRunning && !isGameOver) return;
  ctx.clearRect(0, 0, width, height);

  if (bugMode) {
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(1, -1);
    ctx.translate(-width / 2, -height / 2);
  }

  if (mode === "shooting") drawShooting();
  else if (mode === "runner") drawRunner();

  if (bugMode) ctx.restore();

  if (bugMode) {
    bugTimer--;
    if (bugTimer <= 0) bugMode = false;
  }

  requestAnimationFrame(gameLoop);
}

// === シューティング描画 ===
function drawShooting() {
  updatePlayerPosition();

  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(playerText, playerX, playerY);

  // マーカー
  ctx.beginPath();
  ctx.moveTo(playerX, playerY - 50);
  ctx.lineTo(playerX - 6, playerY - 40);
  ctx.lineTo(playerX + 6, playerY - 40);
  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.fill();

  // 弾
  bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    ctx.font = "24px sans-serif";
    ctx.fillText(bullet.char, bullet.x, bullet.y);
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // 寿司
  sushiList.forEach((sushi, i) => {
    sushi.y += 3;
    ctx.font = sushi.giant === 2 ? "64px sans-serif"
      : sushi.giant === 1 ? "48px sans-serif"
      : "24px sans-serif";
    ctx.fillStyle = sushi.giant ? "blue" : "#000";
    ctx.fillText(sushi.emoji, sushi.x, sushi.y);

    bullets.forEach((bullet, j) => {
      const hitRange = sushi.giant === 2 ? 40 : sushi.giant === 1 ? 35 : 25;
      if (Math.abs(bullet.x - sushi.x) < hitRange &&
          Math.abs(bullet.y - sushi.y) < hitRange) {

        if (sushi.giant === 1 && sushi.type === 'sushi') activateBugMode();
        if (sushi.giant === 2 && sushi.type === 'sushi') activateRunnerMode();

        if (sushi.type === 'sushi') {
          score++;
        } else {
          miss++;
          if (miss >= 3) endGame();
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

  updateScoreBoard();
}

// === ランナー描画 ===
function drawRunner() {
  runnerBgOffset -= 2;
  if (runnerBgOffset < -50) runnerBgOffset = 0;
  ctx.font = "20px sans-serif";
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 20; i++) {
    ctx.fillText(sushiEmoji, (i * 50) + runnerBgOffset, height - 30);
  }
  ctx.globalAlpha = 1;

  runnerY += runnerVY;
  runnerVY += gravity;
  if (runnerY > height - 130) {
    runnerY = height - 130;
    isJumping = false;
  }

  drawStickFigure(playerX, runnerY);

  runnerObstacles.forEach((obs, i) => {
    obs.x -= 5;
    ctx.font = "32px sans-serif";
    ctx.fillText(obs.emoji, obs.x, obs.y);

    if (Math.abs(playerX - obs.x) < 20 && Math.abs(runnerY - obs.y) < 30) {
      if (obs.type === 'sushi') score++;
      else miss++;
      runnerObstacles.splice(i, 1);
    }
  });
}

// === 棒人間描画 ===
function drawStickFigure(x, y) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 30, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x - 10, y - 10);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x + 10, y - 10);
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10, y + 15);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 10, y + 15);
  ctx.stroke();
}

// === ゲーム終了 ===
function endGame() {
  gameRunning = false;
  isGameOver = true;
  document.getElementById('gameOver').classList.remove('hidden');
  document.getElementById('finalScore').innerText = `Your Score: ${score}`;
  saveScore(playerText, score);
}

// === ランキング保存・表示 ===
function saveScore(name, score) {
  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec", {
    method: "POST",
    body: JSON.stringify({ name: name, score: score })
  }).then(() => loadHighScores());
}

function loadHighScores() {
  const container = document.getElementById("highScores");
  container.innerHTML = `
    <div style="text-align:center;">
      <h3 style="margin:0 0 8px 0;">Your Score</h3>
      <p style="font-size:20px; margin:0 0 16px 0;">${score}</p>
      <h3 style="margin:0; animation: blink 1s infinite;">Ranking...</h3>
      <style>
        @keyframes blink {0%,50%,100%{opacity:1;}25%,75%{opacity:0;}}
      </style>
    </div>`;

  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec")
    .then(res => res.json())
    .then(data => {
      let html = `<div style="text-align:center;">
        <h3 style="margin:0 0 8px 0;">
          ${tanukiMode ? "High Tanus" : "High Scores"}
        </h3><ul style='list-style:none; padding:0; margin:0; max-width:90%; margin:auto;'>`;
      data.forEach((item, index) => {
        let rankColor = "#444";
        if (index === 0) rankColor = "#FFD700";
        else if (index === 1) rankColor = "#C0C0C0";
        else if (index === 2) rankColor = "#CD7F32";
        html += `<li style="display:flex;justify-content:space-between;font-size:16px;border-bottom:1px solid #ddd;padding:8px 0;opacity:0;transform:translateY(10px);transition:all 0.5s ${index*0.3}s;">
          <span style="color:${rankColor};font-weight:bold;min-width:40px;">${index+1}位</span>
          <span style="flex:1;text-align:center;white-space:normal;word-break:break-word;max-width:200px;">${item[0]}</span>
          <span style="font-weight:bold;min-width:40px;text-align:right;">${item[1]}</span>
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

// === ダブルタップズーム防止 & 長押しコピー防止 ===
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) event.preventDefault();
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});
