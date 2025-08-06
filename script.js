const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

// Player and game variables
let playerText = "";
let playerX = width / 2;
let playerY = height - 80;
let bullets = [];
let sushiList = [];
let effects = []; // For explosions and score effects
let score = 0;
let miss = 0;
let gameRunning = false;

// Unicode small caps map
const smallCapsMap = {
  a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
  k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ',
  u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
};

// Diacritics for decoration
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

// Sushi emojis (including gunkan and ikura variants)
const sushiEmojis = ["🍣", "🍤", "🍥", "🍙", "🧡"];

// Event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('retryBtn').addEventListener('click', () => location.reload());

document.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  if (e.key === 'ArrowLeft') playerX -= 20;
  if (e.key === 'ArrowRight') playerX += 20;
  if (e.key === ' ') shootBullet();
});

canvas.addEventListener('click', (e) => {
  if (!gameRunning) return;
  const x = e.clientX;
  if (x < width / 3) playerX -= 20;
  else if (x > (width / 3) * 2) playerX += 20;
  else shootBullet();
});

function startGame() {
  const inputText = document.getElementById('textInput').value.trim();
  if (!inputText) return;
  playerText = toFancyDeco(inputText);
  document.getElementById('startScreen').classList.add('hidden');
  canvas.style.display = 'block';
  gameRunning = true;
  gameLoop();
  spawnSushi();
}

function shootBullet() {
  bullets.push({ x: playerX, y: playerY - 20 });
}

function spawnSushi() {
  if (!gameRunning) return;
  sushiList.push({
    x: Math.random() * (width - 50),
    y: -30,
    emoji: sushiEmojis[Math.floor(Math.random() * sushiEmojis.length)]
  });
  setTimeout(spawnSushi, 1000);
}

function gameLoop() {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, width, height);

  // Draw player
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.fillText(playerText, playerX, playerY);

  // Draw bullets
  ctx.fillStyle = "#000";
  bullets.forEach((bullet, i) => {
    bullet.y -= 10;
    ctx.fillText("•", bullet.x, bullet.y);
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  // Draw sushi and handle collisions
  sushiList.forEach((sushi, i) => {
    sushi.y += 3;
    ctx.fillText(sushi.emoji, sushi.x, sushi.y);

    bullets.forEach((bullet, j) => {
      if (Math.abs(bullet.x - sushi.x) < 20 && Math.abs(bullet.y - sushi.y) < 20) {
        // Add explosion and score effect
        effects.push({ type: 'explosion', x: sushi.x, y: sushi.y, life: 20 });
        effects.push({ type: 'score', x: sushi.x, y: sushi.y, life: 30 });
        sushiList.splice(i, 1);
        bullets.splice(j, 1);
        score++;
      }
    });

    // Missed sushi
    if (sushi.y > height) {
      sushiList.splice(i, 1);
      miss++;
      if (miss >= 3) endGame();
    }
  });

  // Draw effects
  effects.forEach((effect, i) => {
    if (effect.type === 'explosion') {
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "red";
      ctx.fillText("💥", effect.x, effect.y);
    } else if (effect.type === 'score') {
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "green";
      ctx.fillText("+1", effect.x, effect.y - (30 - effect.life));
    }
    effect.life--;
    if (effect.life <= 0) effects.splice(i, 1);
  });

  // Scoreboard
  document.getElementById('scoreBoard').innerText = `Score: ${score} | Miss: ${miss}`;

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  document.getElementById('finalScore').innerText = `Your Score: ${score}`;
  document.getElementById('gameOver').classList.remove('hidden');
}
