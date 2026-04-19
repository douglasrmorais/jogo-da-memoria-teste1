const grid = document.getElementById("grid");
const timeText = document.getElementById("time");
const scoreText = document.getElementById("score");
const ai = document.getElementById("ai");
const cursor = document.getElementById("cursor");

let level = 1;
let cards = [];

const levelConfig = [
  4,6,8,10,12,14,16,18,20,22
];

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

// loading
window.onload = () => {
  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
    generateGame();
    startTimer();
    loadBestTime();
  }, 1500);
};

// menu
function startGame() {
  document.getElementById("menu").style.display = "none";

  level = 1;
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

// lógica
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

    document.body.style.background =
      `hsl(${score * 30}, 70%, 15%)`;

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

    document.getElementById("winScreen").style.display = "flex";

    explosion();
    createConfetti();

    aiComment();
    saveScore(time);
  }
}

// 🚀 PRÓXIMO NÍVEL
function nextLevel() {

  if (level >= 10) {
    alert("🏆 Você zerou o jogo!");
    location.reload();
    return;
  }

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
}

// 💾 RECORDE POR NÍVEL
function saveScore(time) {
  const key = "bestTime_level_" + level;

  let best = localStorage.getItem(key);

  if (!best || time < best) {
    localStorage.setItem(key, time);
    document.getElementById("best").textContent = "Novo recorde!";
  } else {
    let minutes = Math.floor(best / 60);
    let seconds = best % 60;

    let formatted =
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");

    document.getElementById("best").textContent =
      "Recorde: " + formatted;
  }
}

// 📊 CARREGAR RECORDE
function loadBestTime() {
  const key = "bestTime_level_" + level;
  let best = localStorage.getItem(key);

  if (best) {
    let minutes = Math.floor(best / 60);
    let seconds = best % 60;

    let formatted =
      String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0");

    document.getElementById("best").textContent =
      "Recorde: " + formatted;
  } else {
    document.getElementById("best").textContent =
      "Sem recorde ainda";
  }
}

// efeitos
function explosion() {
  const colors = ["cyan","blue","purple","white","lime"];
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 60; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * 200 + 50;

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    particle.style.left = centerX + "px";
    particle.style.top = centerY + "px";
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];

    particle.style.setProperty("--x", x + "px");
    particle.style.setProperty("--y", y + "px");

    document.body.appendChild(particle);

    setTimeout(() => particle.remove(), 1000);
  }
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