const grid = document.getElementById("grid");
const timeText = document.getElementById("time");
const scoreText = document.getElementById("score");
const ai = document.getElementById("ai");
const cursor = document.getElementById("cursor");

let level = 1;
let cards = [];

const levelConfig = [4, 6, 8];

const baseSymbols = [
  "⚡","🚀","🧠","💻","👾","🔮","🛰️","🤖","🔥","🌙",
  "☄️","🧬","🔋","🧿","🎯","🕹️","💡","📡","🧊","⚙️","🪐","🌐"
];

let first = null;
let second = null;
let lock = false;
let score = 0;
let time = 0;
let timer;

let currentUser = null;

// =========================
// 🔐 SISTEMA DE LOGIN (via login.html)
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
    // Sem sessão — redireciona para a página de login separada
    window.location.href = "login.html";
    return;
  }

  currentUser = savedUser;

  // Carrega o nível salvo do usuário
  const savedLevel = localStorage.getItem("memoryrace_level_" + currentUser);
  level = savedLevel ? parseInt(savedLevel) : 1;

  showMenu();
}

function showMenu() {
  document.getElementById("menu").style.display = "flex";

  const userWelcome = document.getElementById("userWelcome");
  const savedLevel = localStorage.getItem("memoryrace_level_" + currentUser);

  if (savedLevel && parseInt(savedLevel) > 1) {
    userWelcome.textContent = `Bem-vindo de volta, ${currentUser}! Você está no nível ${savedLevel}`;
  } else {
    userWelcome.textContent = `Bem-vindo, ${currentUser}!`;
  }
}

// Logout — limpa sessão e redireciona para login.html
function logout() {
  clearInterval(timer);
  currentUser = null;
  localStorage.removeItem("memoryrace_user");
  window.location.href = "login.html";
}

// =========================
// 🎮 MENU E INÍCIO DO JOGO
// =========================

function startGame() {
  document.getElementById("menu").style.display = "none";

  const savedLevel = localStorage.getItem("memoryrace_level_" + currentUser);
  level = savedLevel ? parseInt(savedLevel) : 1;

  score = 0;
  time = 0;

  timeText.textContent = "Tempo: 00:00";
  scoreText.textContent = "Pontos: 0";

  generateGame();
  startTimer();
  loadBestTime();
}

// cursor
document.addEventListener("mousemove", e => {
  cursor.style.left = e.clientX + "px";
  cursor.style.top = e.clientY + "px";
});

// ⏱️ TIMER MM:SS
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    time++;

    let minutes = Math.floor(time / 60);
    let seconds = time % 60;

    let formatted =
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");

    timeText.textContent = "Tempo: " + formatted;
  }, 1000);
}

// 🎮 GRID DINÂMICO
function generateGame() {
  grid.innerHTML = "";

  const pairCount = levelConfig[level - 1];
  let selected = baseSymbols.slice(0, pairCount);

  cards = [...selected, ...selected];
  cards.sort(() => Math.random() - 0.5);

  const totalCards = cards.length;
  const columns = Math.ceil(Math.sqrt(totalCards));

  if (window.innerWidth > 768) {
    grid.style.gridTemplateColumns = `repeat(${columns}, 100px)`;
  } else {
    grid.style.gridTemplateColumns = "";
  }

  cards.forEach(symbol => {
    const card = document.createElement("div");
    card.classList.add("card");

    if (level === 3) {
      card.classList.add("golden");
    }

    card.innerHTML = `
      <div class="inner">
        <div class="front"></div>
        <div class="back">${symbol}</div>
      </div>
    `;

    card.onclick = () => flip(card, symbol);
    grid.appendChild(card);
  });
}

// lógica de flip
function flip(card, symbol) {
  if (lock || card.classList.contains("flip")) return;

  card.classList.add("flip");

  if (!first) {
    first = {card, symbol};
    return;
  }

  second = {card, symbol};
  lock = true;

  if (first.symbol === second.symbol) {
    score++;
    scoreText.textContent = "Pontos: " + score;

    if (level === 3) {
      document.body.style.background = `hsl(${score * 40 + 30}, 70%, 15%)`;
    } else {
      document.body.style.background = `hsl(${score * 30}, 70%, 15%)`;
    }

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
  first = null;
  second = null;
  lock = false;
}

// IA
function aiComment() {
  if (time < 10) {
    ai.textContent = "⚡ Você é muito rápido!";
  } else if (time < 20) {
    ai.textContent = "🧠 Bom desempenho!";
  } else {
    ai.textContent = "🐢 Dá pra melhorar...";
  }
}

// vitória
function checkWin() {
  const totalPairs = cards.length / 2;

  if (score === totalPairs) {
    lock = true;
    clearInterval(timer);

    const winTitle = document.querySelector("#winScreen h2");
    const nextBtn = document.getElementById("nextBtn");
    const restartBtn = document.getElementById("restartBtn");

    if (level === 3) {
      showCompleteScreen();
    } else {
      // Mostrar tempo desta partida na winScreen
      let minutes = Math.floor(time / 60);
      let seconds = time % 60;
      let formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
      document.getElementById("finalTime").textContent = "Seu tempo: " + formatted;

      winTitle.textContent = "🏆 Você venceu!";
      nextBtn.style.display = "block";
      restartBtn.style.display = "none";
      explosion();
      document.getElementById("winScreen").style.display = "flex";
    }

    createConfetti();
    aiComment();
    if (level < 3) {
      saveScore(time);
      saveProgress();
    }
  }
}

// 🏆 TELA COMPLETA - NÍVEL OURO
function showCompleteScreen() {
  document.getElementById("completeScreen").style.display = "flex";
  finalGoldExplosion();
  createGoldConfetti();

  // Mostrar tempo desta partida
  let minutes = Math.floor(time / 60);
  let seconds = time % 60;
  let formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
  document.getElementById("completeFinalTime").textContent = "Seu tempo: " + formatted;

  // Verificar e mostrar recorde do nível 3
  const key = "bestTime_" + (currentUser || "guest") + "_level_3";
  const best = localStorage.getItem(key);

  if (!best || time < parseInt(best)) {
    localStorage.setItem(key, time);
    document.getElementById("completeBest").textContent = "🥇 Novo recorde!";
  } else {
    let bMin = Math.floor(best / 60);
    let bSec = best % 60;
    let bFormatted = String(bMin).padStart(2, "0") + ":" + String(bSec).padStart(2, "0");
    document.getElementById("completeBest").textContent = "Recorde: " + bFormatted;
  }

  if (currentUser) {
    localStorage.removeItem("memoryrace_level_" + currentUser);
  }
}

// 🚀 PRÓXIMO NÍVEL
function nextLevel() {
  if (level >= 3) return;

  level++;
  score = 0;
  time = 0;

  timeText.textContent = "Tempo: 00:00";
  scoreText.textContent = "Pontos: 0";

  first = null;
  second = null;
  lock = false;

  document.body.style.background = "#000";
  document.getElementById("winScreen").style.display = "none";

  generateGame();
  startTimer();
  loadBestTime();
  saveProgress();
}

// 🔄 JOGAR NOVAMENTE — limpa sessão e volta para login.html
function restartGame() {
  clearInterval(timer);
  localStorage.removeItem("memoryrace_user");
  currentUser = null;
  window.location.href = "login.html";
}

// 💾 SALVAR PROGRESSO
function saveProgress() {
  if (currentUser) {
    localStorage.setItem("memoryrace_level_" + currentUser, level);
  }
}

// 💾 RECORDE POR USUÁRIO E NÍVEL
function saveScore(time) {
  const key = "bestTime_" + (currentUser || "guest") + "_level_" + level;
  let best = localStorage.getItem(key);

  if (!best || time < parseInt(best)) {
    localStorage.setItem(key, time);
    document.getElementById("best").textContent = "Novo recorde!";
  } else {
    let minutes = Math.floor(best / 60);
    let seconds = best % 60;
    let formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    document.getElementById("best").textContent = "Recorde: " + formatted;
  }
}

// 📊 CARREGAR RECORDE
function loadBestTime() {
  const key = "bestTime_" + (currentUser || "guest") + "_level_" + level;
  let best = localStorage.getItem(key);

  if (best) {
    let minutes = Math.floor(best / 60);
    let seconds = best % 60;
    let formatted = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    document.getElementById("best").textContent = "Recorde: " + formatted;
  } else {
    document.getElementById("best").textContent = "Sem recorde ainda";
  }
}

// ✨ EFEITOS
function explosion() {
  const colors = ["cyan","blue","purple","white","lime"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 60; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 200 + 50;

    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.setProperty("--x", Math.cos(angle) * distance + "px");
    particle.style.setProperty("--y", Math.sin(angle) * distance + "px");

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1000);
  }
}

function finalGoldExplosion() {
  const colors = ["#FFD700", "#FFA500", "#FFEC8B", "#FFF8DC", "#DAA520", "#F0E68C"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const spawnWave = (count, maxDist, delay, duration) => {
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle");

        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * maxDist + 80;

        particle.style.left = centerX + "px";
        particle.style.top = centerY + "px";
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.width = Math.random() * 10 + 5 + "px";
        particle.style.height = particle.style.width;
        particle.style.boxShadow = `0 0 10px ${colors[Math.floor(Math.random() * colors.length)]}`;
        particle.style.setProperty("--x", Math.cos(angle) * distance + "px");
        particle.style.setProperty("--y", Math.sin(angle) * distance + "px");

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), duration);
      }
    }, delay);
  };

  spawnWave(150, 400, 0, 2000);
  spawnWave(100, 350, 300, 2000);
}

function createConfetti() {
  const colors = ["cyan","blue","purple","white","lime"];

  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");

    confetti.style.left = Math.random() * window.innerWidth + "px";
    confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDuration = (Math.random() * 3 + 2) + "s";
    confetti.style.width = Math.random() * 6 + 4 + "px";
    confetti.style.height = confetti.style.width;

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
  }
}

function createGoldConfetti() {
  const colors = ["#FFD700", "#FFA500", "#FFEC8B", "#FFF8DC", "#DAA520", "#F0E68C", "#FFE4B5"];

  const spawnConfetti = (count, delay, duration) => {
    setTimeout(() => {
      for (let i = 0; i < count; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");

        confetti.style.left = Math.random() * window.innerWidth + "px";
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 4 + 3) + "s";
        confetti.style.width = Math.random() * 10 + 6 + "px";
        confetti.style.height = confetti.style.width;
        confetti.style.boxShadow = `0 0 8px ${colors[Math.floor(Math.random() * colors.length)]}`;
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), duration);
      }
    }, delay);
  };

  spawnConfetti(150, 0, 7000);
  spawnConfetti(100, 500, 6000);
}