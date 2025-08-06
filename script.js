// 背景星屑
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) * 0.5,
    dy: (Math.random() - 0.5) * 0.5,
  });
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
    ctx.fill();
    star.x += star.dx;
    star.y += star.dy;
    if (star.x < 0 || star.x > canvas.width) star.dx *= -1;
    if (star.y < 0 || star.y > canvas.height) star.dy *= -1;
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// 小文字デコ化用マップ
const smallCapsMap = {
  a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
  k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ',
  u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
};

// 装飾マーク
const diacritics = [
  '͛','͝','͞','̷','̋','͡','͘','͒','͠'
];

// ランダムで2〜4個の装飾マークを付与
function addDecoration(baseChar) {
  let decorated = baseChar;
  const count = Math.floor(Math.random() * 3) + 2; // 2〜4個
  for (let i = 0; i < count; i++) {
    decorated += diacritics[Math.floor(Math.random() * diacritics.length)];
  }
  return decorated;
}

// 入力文字をデコ変換
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

// タイピングアニメーション
function typeAnimation(element, text) {
  element.textContent = "";
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.textContent += text[i];
      i++;
      setTimeout(typing, 80);
    }
  }
  typing();
}

// イベント
const textInput = document.getElementById("textInput");
const generateBtn = document.getElementById("generateBtn");
const output = document.getElementById("output");

generateBtn.addEventListener("click", () => {
  const text = textInput.value.trim();
  if (text) {
    const fancyText = toFancyDeco(text);
    typeAnimation(output, fancyText);
    spawnEmojis();
  }
});

// 寿司絵文字
const emojis = ["🍣", "🍤", "🥢", "🍱", "🍥"];

function spawnEmojis() {
  for (let i = 0; i < 6; i++) {
    const emoji = document.createElement("div");
    emoji.classList.add("emoji");
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${Math.random() * 100}%`;
    emoji.style.top = `${50 + Math.random() * 20}%`;
    document.body.appendChild(emoji);

    setTimeout(() => {
      emoji.remove();
    }, 6000);
  }
}
