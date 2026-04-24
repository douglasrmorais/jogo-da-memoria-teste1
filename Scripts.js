const grid      = document.getElementById("grid");
const timeText  = document.getElementById("time");
const scoreText = document.getElementById("score");
const bestText  = document.getElementById("best");
const aiEl      = document.getElementById("ai");
const cursor    = document.getElementById("cursor");
const gameArea  = document.getElementById("gameArea");

let level = 1;
let cards = [];

const levelConfig = [4, 6, 8];

const baseSymbols = [
  "⚡","🚀","🧠","💻","👾","🔮","🛰️","🤖","🔥","🌙",
  "☄️","🧬","🔋","🧿","🎯","🕹️","💡","📡","🧊","⚙️","🪐","🌐"
];

let first  = null;
let second = null;
let lock   = false;
let score  = 0;
let time   = 0;
let timer;

let currentUser = null;

// =========================
// 🖱️ CURSOR — só aparece se o usuário usa mouse
// =========================
let mouseUsed = false;
document.addEventListener("mousemove", e => {
  if (!mouseUsed) {
    mouseUsed = true;
    cursor.style.display = "block";
  }
  cursor.style.left = e.clientX + "px";
  cursor.style.top  = e.clientY + "px";
}, { passive: true });

document.addEventListener("touchstart", () => {
  cursor.style.display = "none";
  mouseUsed = false;
}, { passive: true });

// =========================
// 🔐 SISTEMA DE LOGIN
// =========================
window.onload = () => {
  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
    checkLogin();
  }, 1500);
};

function checkLogin() {
  const savedUser = localStorage.getItem("memoryrace_user");

  if (!savedUser) {
    window.location.href = "login.html";
    return;
  }

  currentUser = savedUser;

  const savedLevel = localStorage.getItem("memoryrace_level_" + currentUser);
  level = savedLevel ? parseInt(savedLevel) : 1;

  showMenu();
}

function showMenu() {
  gameArea.style.display = "none";
  document.getElementById("menu").style.display = "flex";

  const userWelcome = document.getElementById("userWelcome");
  const savedLevel  = localStorage.getItem("memoryrace_level_" + currentUser);

  if (savedLevel && parseInt(savedLevel) > 1) {
    userWelcome.textContent = `Bem-vindo de volta, ${currentUser}! Você está no nível ${savedLevel}`;
  } else {
    userWelcome.textContent = `Bem-vindo, ${currentUser}!`;
  }
}

function logout() {
  clearInterval(timer);
  currentUser = null;
  localStorage.removeItem("memoryrace_user");
  window.location.href = "login.html";
}

// =========================
// 🎮 INÍCIO DO JOGO
// =========================
function startGame() {
  document.getElementById("menu").style.display = "none";
  gameArea.style.display = "flex";

  const savedLevel = localStorage.getItem("memoryrace_level_" + currentUser);
  level = savedLevel ? parseInt(savedLevel) : 1;

  score = 0;
  time  = 0;

  timeText.textContent  = "Tempo: 00:00";
  scoreText.textContent = "Pontos: 0";

  generateGame();
  startTimer();
  loadBestTime();
}

// =========================
// ⏱️ TIMER MM:SS
// =========================
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    time++;
    const m = String(Math.floor(time / 60)).padStart(2, "0");
    const s = String(time % 60).padStart(2, "0");
    timeText.textContent = `Tempo: ${m}:${s}`;
  }, 1000);
}

// =========================
// 🎮 GRID DINÂMICO
// =========================
function generateGame() {
  grid.innerHTML = "";

  const pairCount = levelConfig[level - 1];
  let selected = baseSymbols.slice(0, pairCount);
  cards = [...selected, ...selected];
  cards.sort(() => Math.random() - 0.5);

  const totalCards = cards.length;
  const columns    = Math.ceil(Math.sqrt(totalCards));

  // Define colunas fixas apenas no desktop
  if (window.innerWidth > 768) {
    grid.style.gridTemplateColumns = `repeat(${columns}, var(--card-size, 100px))`;
  } else {
    grid.style.gridTemplateColumns = "";
  }

  cards.forEach(symbol => {
    const card = document.createElement("div");
    card.classList.add("card");
    if (level === 3) card.classList.add("golden");

    card.innerHTML = `
      <div class="inner">
        <div class="front"></div>
        <div class="back">${symbol}</div>
      </div>
    `;

    card.addEventListener("click", () => flip(card, symbol));
    grid.appendChild(card);
  });
}

// =========================
// 🃏 LÓGICA DE FLIP
// =========================
function flip(card, symbol) {
  if (lock || card.classList.contains("flip")) return;

  card.classList.add("flip");

  if (!first) {
    first = { card, symbol };
    return;
  }

  second = { card, symbol };
  lock   = true;

  if (first.symbol === second.symbol) {
    score++;
    scoreText.textContent = "Pontos: " + score;

    const hue = level === 3 ? score * 40 + 30 : score * 30;
    document.body.style.background = `hsl(${hue}, 70%, 15%)`;

    reset();
    checkWin();
  } else {
    document.body.style.background = "#300";
    setTimeout(() => {
      first.card.classList.remove("flip");
      second.card.classList.remove("flip");
      reset();
    }, 800);
  }
}

function reset() {
  first  = null;
  second = null;
  lock   = false;
}

// =========================
// 🤖 IA
// =========================
function aiComment() {
  if (time < 10)      aiEl.textContent = "⚡ Você é muito rápido!";
  else if (time < 20) aiEl.textContent = "🧠 Bom desempenho!";
  else                aiEl.textContent = "🐢 Dá pra melhorar...";
}

// =========================
// 🏆 VERIFICAR VITÓRIA
// =========================
function checkWin() {
  if (score !== cards.length / 2) return;

  lock = true;
  clearInterval(timer);

  if (level === 3) {
    showCompleteScreen();
  } else {
    const m = String(Math.floor(time / 60)).padStart(2, "0");
    const s = String(time % 60).padStart(2, "0");
    document.getElementById("finalTime").textContent = `Seu tempo: ${m}:${s}`;

    document.querySelector("#winScreen h2").textContent = "🏆 Você venceu!";
    document.getElementById("nextBtn").style.display    = "block";
    document.getElementById("restartBtn").style.display = "none";

    explosion();
    document.getElementById("winScreen").style.display = "flex";

    saveScore(time);
    saveProgress();
  }

  createConfetti();
  aiComment();
}

// =========================
// 🥇 TELA COMPLETA — OURO
// =========================
function showCompleteScreen() {
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  document.getElementById("completeFinalTime").textContent = `Seu tempo: ${m}:${s}`;

  const key  = "bestTime_" + (currentUser || "guest") + "_level_3";
  const best = localStorage.getItem(key);

  if (!best || time < parseInt(best)) {
    localStorage.setItem(key, time);
    document.getElementById("completeBest").textContent = "🥇 Novo recorde!";
  } else {
    const bm = String(Math.floor(best / 60)).padStart(2, "0");
    const bs = String(best % 60).padStart(2, "0");
    document.getElementById("completeBest").textContent = `Recorde: ${bm}:${bs}`;
  }

  if (currentUser) localStorage.removeItem("memoryrace_level_" + currentUser);

  document.getElementById("completeScreen").style.display = "flex";
  finalGoldExplosion();
  createGoldConfetti();
}

// =========================
// ➜ PRÓXIMO NÍVEL
// =========================
function nextLevel() {
  if (level >= 3) return;

  level++;
  score = 0;
  time  = 0;

  timeText.textContent  = "Tempo: 00:00";
  scoreText.textContent = "Pontos: 0";
  first = second = null;
  lock  = false;

  document.body.style.background = "#000";
  document.getElementById("winScreen").style.display = "none";

  generateGame();
  startTimer();
  loadBestTime();
  saveProgress();
}

// =========================
// 🔄 REINICIAR
// =========================
function restartGame() {
  clearInterval(timer);
  localStorage.removeItem("memoryrace_user");
  currentUser = null;
  window.location.href = "login.html";
}

// =========================
// 💾 PROGRESSO E RECORDE
// =========================
function saveProgress() {
  if (currentUser) localStorage.setItem("memoryrace_level_" + currentUser, level);
}

function saveScore(t) {
  const key  = "bestTime_" + (currentUser || "guest") + "_level_" + level;
  const best = localStorage.getItem(key);

  if (!best || t < parseInt(best)) {
    localStorage.setItem(key, t);
    bestText.textContent = "Novo recorde!";
  } else {
    const bm = String(Math.floor(best / 60)).padStart(2, "0");
    const bs = String(best % 60).padStart(2, "0");
    bestText.textContent = `Recorde: ${bm}:${bs}`;
  }
}

function loadBestTime() {
  const key  = "bestTime_" + (currentUser || "guest") + "_level_" + level;
  const best = localStorage.getItem(key);

  if (best) {
    const bm = String(Math.floor(best / 60)).padStart(2, "0");
    const bs = String(best % 60).padStart(2, "0");
    bestText.textContent = `Recorde: ${bm}:${bs}`;
  } else {
    bestText.textContent = "Sem recorde ainda";
  }
}

// =========================
// ✨ EFEITOS VISUAIS
// =========================
function explosion() {
  const colors  = ["cyan","blue","purple","white","lime"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 60; i++) {
    const p     = document.createElement("div");
    p.classList.add("particle");
    const angle = Math.random() * 2 * Math.PI;
    const dist  = Math.random() * 200 + 50;
    p.style.left       = centerX + "px";
    p.style.top        = centerY + "px";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty("--x", Math.cos(angle) * dist + "px");
    p.style.setProperty("--y", Math.sin(angle) * dist + "px");
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

function finalGoldExplosion() {
  const colors  = ["#FFD700","#FFA500","#FFEC8B","#FFF8DC","#DAA520","#F0E68C"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const spawnWave = (count, maxDist, delay, duration) => {
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const p     = document.createElement("div");
        p.classList.add("particle");
        const angle = Math.random() * 2 * Math.PI;
        const dist  = Math.random() * maxDist + 80;
        p.style.left       = centerX + "px";
        p.style.top        = centerY + "px";
        p.style.background = colors[Math.floor(Math.random() * colors.length)];
        p.style.width      = (Math.random() * 10 + 5) + "px";
        p.style.height     = p.style.width;
        p.style.setProperty("--x", Math.cos(angle) * dist + "px");
        p.style.setProperty("--y", Math.sin(angle) * dist + "px");
        document.body.appendChild(p);
        setTimeout(() => p.remove(), duration);
      }
    }, delay);
  };

  spawnWave(150, 400, 0,   2000);
  spawnWave(100, 350, 300, 2000);
}

function createConfetti() {
  const colors = ["cyan","blue","purple","white","lime"];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement("div");
    c.classList.add("confetti");
    c.style.left              = Math.random() * window.innerWidth + "px";
    c.style.background        = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDuration = (Math.random() * 3 + 2) + "s";
    c.style.width             = (Math.random() * 6 + 4) + "px";
    c.style.height            = c.style.width;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 5000);
  }
}

function createGoldConfetti() {
  const colors = ["#FFD700","#FFA500","#FFEC8B","#FFF8DC","#DAA520","#F0E68C","#FFE4B5"];

  const spawn = (count, delay, duration) => {
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const c = document.createElement("div");
        c.classList.add("confetti");
        c.style.left              = Math.random() * window.innerWidth + "px";
        c.style.background        = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDuration = (Math.random() * 4 + 3) + "s";
        c.style.width             = (Math.random() * 10 + 6) + "px";
        c.style.height            = c.style.width;
        c.style.borderRadius      = Math.random() > 0.5 ? "50%" : "2px";
        document.body.appendChild(c);
        setTimeout(() => c.remove(), duration);
      }
    }, delay);
  };

  spawn(150, 0,   7000);
  spawn(100, 500, 6000);
}