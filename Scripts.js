const grid      = document.getElementById("grid");
const timeText  = document.getElementById("time");
const scoreText = document.getElementById("score");
const bestText  = document.getElementById("best");
const aiEl      = document.getElementById("ai");
const cursor    = document.getElementById("cursor");
const gameArea  = document.getElementById("gameArea");

let level = 1;
let cards = [];

// ✅ Apenas 3 fases existem — isso garante que nunca passe disso
const TOTAL_LEVELS = 3;
const levelConfig  = [4, 6, 8];

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

// ✅ Cada sessão agora tem um nome (exibição) e um sessionId único
// Isso resolve o problema de dois usuários com o mesmo nome compartilharem dados
let currentUser      = null;  // nome para exibição
let currentSessionId = null;  // chave única de armazenamento

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
// 🔐 SISTEMA DE SESSÃO
// =========================
window.onload = () => {
  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
    checkLogin();
  }, 1500);
};

function checkLogin() {
  // ✅ Lê a sessão atual (objeto com nome + sessionId único)
  const sessaoRaw = localStorage.getItem("memoryrace_sessao_atual");

  if (!sessaoRaw) {
    window.location.href = "login.html";
    return;
  }

  let sessao;
  try {
    sessao = JSON.parse(sessaoRaw);
  } catch (e) {
    // Dado corrompido — manda pro login
    localStorage.removeItem("memoryrace_sessao_atual");
    window.location.href = "login.html";
    return;
  }

  // Valida estrutura da sessão
  if (!sessao.nome || !sessao.sessionId) {
    localStorage.removeItem("memoryrace_sessao_atual");
    window.location.href = "login.html";
    return;
  }

  currentUser      = sessao.nome;
  currentSessionId = sessao.sessionId;

  // ✅ Nível lido pela sessionId única — nunca vai pegar dados de outra pessoa
  const savedLevel = localStorage.getItem("memoryrace_level_" + currentSessionId);
  level = savedLevel ? Math.min(parseInt(savedLevel), TOTAL_LEVELS) : 1;

  // ✅ Garante que o nível nunca ultrapasse o máximo existente
  if (level < 1 || isNaN(level)) level = 1;

  showMenu();
}

function showMenu() {
  gameArea.style.display = "none";
  document.getElementById("menu").style.display = "flex";

  const userWelcome = document.getElementById("userWelcome");
  const savedLevel  = localStorage.getItem("memoryrace_level_" + currentSessionId);
  const lvl         = savedLevel ? Math.min(parseInt(savedLevel), TOTAL_LEVELS) : 1;

  if (lvl > 1) {
    userWelcome.textContent = `Bem-vindo de volta, ${currentUser}! Você está no nível ${lvl}`;
  } else {
    userWelcome.textContent = `Bem-vindo, ${currentUser}!`;
  }
}

function logout() {
  clearInterval(timer);

  // ✅ Remove apenas a sessão atual — não afeta dados de outras sessões
  localStorage.removeItem("memoryrace_sessao_atual");

  currentUser      = null;
  currentSessionId = null;

  window.location.href = "login.html";
}

// =========================
// 🎮 INÍCIO DO JOGO
// =========================
function startGame() {
  document.getElementById("menu").style.display = "none";
  gameArea.style.display = "flex";

  // ✅ Usa sessionId único para ler o nível salvo
  const savedLevel = localStorage.getItem("memoryrace_level_" + currentSessionId);
  level = savedLevel ? Math.min(parseInt(savedLevel), TOTAL_LEVELS) : 1;

  // ✅ Proteção extra: nunca deixa o nível ser inválido
  if (level < 1 || isNaN(level)) level = 1;

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

  // ✅ Garante que o nível nunca saia do intervalo válido (1–3)
  const safeLevel = Math.max(1, Math.min(level, TOTAL_LEVELS));
  const pairCount = levelConfig[safeLevel - 1];

  let selected = baseSymbols.slice(0, pairCount);
  cards = [...selected, ...selected];
  cards.sort(() => Math.random() - 0.5);

  const totalCards = cards.length;
  const columns    = Math.ceil(Math.sqrt(totalCards));

  if (window.innerWidth > 768) {
    grid.style.gridTemplateColumns = `repeat(${columns}, var(--card-size, 100px))`;
  } else {
    grid.style.gridTemplateColumns = "";
  }

  cards.forEach(symbol => {
    const card = document.createElement("div");
    card.classList.add("card");
    if (safeLevel === 3) card.classList.add("golden");

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

  if (level === TOTAL_LEVELS) {
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
// 🥇 TELA COMPLETA — ÚLTIMA FASE
// =========================
function showCompleteScreen() {
  const m = String(Math.floor(time / 60)).padStart(2, "0");
  const s = String(time % 60).padStart(2, "0");
  document.getElementById("completeFinalTime").textContent = `Seu tempo: ${m}:${s}`;

  // ✅ Recorde salvo por sessionId — não mistura com outras sessões
  const key  = "bestTime_" + currentSessionId + "_level_" + TOTAL_LEVELS;
  const best = localStorage.getItem(key);

  if (!best || time < parseInt(best)) {
    localStorage.setItem(key, time);
    document.getElementById("completeBest").textContent = "🥇 Novo recorde!";
  } else {
    const bm = String(Math.floor(parseInt(best) / 60)).padStart(2, "0");
    const bs = String(parseInt(best) % 60).padStart(2, "0");
    document.getElementById("completeBest").textContent = `Recorde: ${bm}:${bs}`;
  }

  // ✅ Ao completar todas as fases, remove o nível salvo da sessionId atual
  // Na próxima vez que esse mesmo usuário jogar, começa do nível 1 normalmente
  localStorage.removeItem("memoryrace_level_" + currentSessionId);

  document.getElementById("completeScreen").style.display = "flex";
  finalGoldExplosion();
  createGoldConfetti();
}

// =========================
// ➜ PRÓXIMO NÍVEL
// =========================
function nextLevel() {
  // ✅ Proteção: nunca avança além do total de fases existentes
  if (level >= TOTAL_LEVELS) return;

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
// 🔄 REINICIAR — volta ao menu sem deslogar
// =========================
function restartGame() {
  clearInterval(timer);

  // ✅ Reseta o nível para 1 na sessionId atual e volta ao menu
  // Não desloga o usuário nem remove a sessão
  level = 1;
  if (currentSessionId) {
    localStorage.setItem("memoryrace_level_" + currentSessionId, 1);
  }

  score = 0;
  time  = 0;
  first = second = null;
  lock  = false;

  document.getElementById("winScreen").style.display      = "none";
  document.getElementById("completeScreen").style.display = "none";
  document.body.style.background = "#000";

  showMenu();
}

// =========================
// 💾 PROGRESSO E RECORDE
// =========================
function saveProgress() {
  // ✅ Salva o nível pela sessionId — isolado por usuário/sessão
  if (currentSessionId) {
    const safeLevel = Math.min(level, TOTAL_LEVELS);
    localStorage.setItem("memoryrace_level_" + currentSessionId, safeLevel);
  }
}

function saveScore(t) {
  // ✅ Recorde também salvo por sessionId
  const key  = "bestTime_" + (currentSessionId || "guest") + "_level_" + level;
  const best = localStorage.getItem(key);

  if (!best || t < parseInt(best)) {
    localStorage.setItem(key, t);
    bestText.textContent = "Novo recorde!";
  } else {
    const bm = String(Math.floor(parseInt(best) / 60)).padStart(2, "0");
    const bs = String(parseInt(best) % 60).padStart(2, "0");
    bestText.textContent = `Recorde: ${bm}:${bs}`;
  }
}

function loadBestTime() {
  const key  = "bestTime_" + (currentSessionId || "guest") + "_level_" + level;
  const best = localStorage.getItem(key);

  if (best) {
    const bm = String(Math.floor(parseInt(best) / 60)).padStart(2, "0");
    const bs = String(parseInt(best) % 60).padStart(2, "0");
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