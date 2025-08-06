const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let playerText = "";
let playerX = width / 2;
let playerY = height - 120;
let bullets = [];
let sushiList = [];
let effects = [];
let score = 0;
let miss = 0;
let gameRunning = false;

let movingLeft = false;
let movingRight = false;

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
  return text
    .toLowerCase()
    .split("")
    .map(ch => {
      if (ch === " ") return " ";
      const base = smallCapsMap[ch] || ch;
      return addDecoration(base);
    })
    .join("");
}

const sushiEmoji = "🍣";
const chickEmoji = "🐣";

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('retryBtn').addEventListener('click', () => location.reload());

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

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

document.getElementById('btnLeft').addEventListener('mousedown', () => movingLeft = true);
document.getElementById('btnLeft').addEventListener('touchstart', () => movingLeft = true);
document.getElementById('btnLeft').addEventListener('mouseup', () => movingLeft = false);
document.getElementById('btnLeft').addEventListener('touchend', () => movingLeft = false);

document.getElementById('btnRight').addEventListener('mousedown', () => movingRight = true);
document.getElementById('btnRight').addEventListener('touchstart', () => movingRight = true);
document.getElementById('btnRight').addEventListener('mouseup', () => movingRight = false);
document.getElementById('btnRight').addEventListener('touchend', () => movingRight = false);

document.getElementById('btnShoot').addEventListener('click', () => { if(gameRunning) shootBullet(); });

function startGame() {
  const inputText = document.getElementById('textInput').value.trim();
  if (!inputText) return;
  playerText = toFancyDeco(inputText);
  document.getElementById('startScreen').classList.add('hidden');
  canvas.style.display = 'block';
  document.getElementById('controls').classList.remove('hidden');
  gameRunning = true;
  gameLoop();
  spawnSushi();
}

function shootBullet() {
  bullets.push({ x: playerX, y: playerY - 20 });
}

function spawnSushi() {
  if (!gameRunning) return;

  const isSushi = Math.random() < 0.7;
  sushiList.push({
    x: Math.random() * (width - 50),
    y: -30,
    emoji: isSushi ? sushiEmoji : chickEmoji,
    type: isSushi ? 'sushi' : 'chick'
  });

  setTimeout(spawnSushi, 1000);
}

function updatePlayerPosition() {
  if (movingLeft) playerX -= 5;
  if (movingRight) playerX += 5;
  if (playerX < 20) playerX = 20;
  if (playerX > width - 20) playerX = width - 20;
}

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, width, height);

  updatePlayerPosition();

  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(playerText, playerX, playerY);

  ctx.fillStyle = "#000";
  bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    ctx.font = "28px sans-serif";
    ctx.fillText("●", bullet.x, bullet.y);
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  sushiList.forEach((sushi, i) => {
    sushi.y += 3;
    ctx.font = "24px sans-serif";
    ctx.fillText(sushi.emoji, sushi.x, sushi.y);

    bullets.forEach((bullet, j) => {
      if (Math.abs(bullet.x - sushi.x) < 25 && Math.abs(bullet.y - sushi.y) < 25) {
        effects.push({ type: 'explosion', x: sushi.x, y: sushi.y, life: 20 });
        if (sushi.type === 'sushi') {
          score++;
          effects.push({ type: 'score', x: sushi.x, y: sushi.y, life: 30, text: '+1', color: 'green' });
        } else {
          score--;
          effects.push({ type: 'score', x: sushi.x, y: sushi.y, life: 30, text: '-1', color: 'red' });
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

  effects.forEach((effect, i) => {
    if (effect.type === 'explosion') {
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("💥", effect.x, effect.y);
    } else if (effect.type === 'score') {
      ctx.font = "16px sans-serif";
      ctx.fillStyle = effect.color;
      ctx.fillText(effect.text, effect.x, effect.y - (30 - effect.life));
    }
    effect.life--;
    if (effect.life <= 0) effects.splice(i, 1);
  });

  document.getElementById('scoreBoard').innerText = `Score: ${score} | Miss: ${miss}`;

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  document.getElementById('finalScore').innerText = `Your Score: ${score}`;
  document.getElementById('gameOver').classList.remove('hidden');

  saveScore(playerText, score);
  loadHighScores();
}

function saveScore(name, score) {
  console.log("saveScore called", name, score);
  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec", {
    method: "POST",
    body: JSON.stringify({ name: name, score: score })
  })
  .then(res => res.text())
  .then(text => console.log("Response:", text))
  .catch(err => console.error("Fetch error:", err));
}



function loadHighScores() {
  fetch("https://script.google.com/macros/s/AKfycbzCaNiqJK9G4sLr9p9-5yfRCdnbLulolHBbSrJaPX08b2G2ldjm-73P2i-M7U4ACWP7nQ/exec")
    .then(res => res.json())
    .then(data => {
      let html = "<h3>High Scores</h3><ol>";
      data.forEach(item => {
        html += `<li>${item[1]} - ${item[0]}</li>`;
      });
      html += "</ol>";
      document.getElementById("highScores").innerHTML = html;
    });
}
