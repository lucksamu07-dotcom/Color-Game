import gsap from 'gsap';

// ── Audio & Stats ─────────────────────────────────────────────────────────────

let audioCtx = null;
let isMuted = localStorage.getItem('colorGameMuted') === 'true';

function initAudio() {
  if (!audioCtx && !isMuted) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  }
}

function playTone(freq, type, duration, vol=0.1) {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playPop() {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(600, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function playBeep() { playTone(600, 'square', 0.1, 0.05); }
function playBeepHigh() { playTone(880, 'square', 0.15, 0.05); }

function playReveal(score) {
  if (score >= 9.5) {
    // Acorde Mayor 7 brillante
    [440, 554.37, 659.25, 830.61].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 1.2, 0.1), i * 60);
    });
  } else if (score >= 8.0) {
    // Acorde Mayor
    [440, 554.37, 659.25].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 0.8, 0.1), i * 50);
    });
  } else if (score < 4.0) {
    // Sonido de fallo dramático
    playTone(180, 'sawtooth', 0.4, 0.15);
    setTimeout(() => playTone(140, 'sawtooth', 0.6, 0.15), 150);
  } else {
    // Sonido neutro/bien
    playTone(440, 'triangle', 0.15, 0.1);
    setTimeout(() => playTone(523.25, 'triangle', 0.25, 0.1), 100);
  }
}

function playLevelUp() {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.4, 0.1), i * 150);
  });
}

function playClick() {
  playTone(800, 'sine', 0.05, 0.05);
}

function playSuccess() {
  playTone(523.25, 'sine', 0.1, 0.1);
  setTimeout(() => playTone(659.25, 'sine', 0.15, 0.1), 80);
}

let lastSlideTime = 0;
function playSliderSound(freq) {
  const now = Date.now();
  if (now - lastSlideTime < 40) return; // Limitar frecuencia de sonidos
  lastSlideTime = now;
  playTone(freq, 'sine', 0.05, 0.03);
}

function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

const muteBtn = document.createElement('button');
muteBtn.className = 'btn-mute';
muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
document.body.appendChild(muteBtn);
muteBtn.addEventListener('click', () => {
  isMuted = !isMuted;
  localStorage.setItem('colorGameMuted', isMuted);
  muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', isMuted ? 'Activar sonido' : 'Silenciar');
  if (!isMuted) initAudio();
});

let stats = JSON.parse(localStorage.getItem('colorGameStats')) || {
  bestScore: 0,
  gamesPlayed: 0,
  streak: 0,
  lastPlayDate: null,
  dailyPlayed: {},
  history: [],
  ink: 0
};
if (!stats.history) stats.history = [];
if (stats.ink === undefined) stats.ink = 0;
if (stats.xp === undefined) stats.xp = 0;
if (stats.level === undefined) stats.level = 1;
if (stats.extraHints === undefined) stats.extraHints = 0;
if (stats.extraTime === undefined) stats.extraTime = 0;
if (stats.extraRetry === undefined) stats.extraRetry = 0;
if (stats.inkMultiplierGames === undefined) stats.inkMultiplierGames = 0;
if (stats.xpMultiplierGames === undefined) stats.xpMultiplierGames = 0;
if (stats.streakShield === undefined) stats.streakShield = 0;
if (!stats.unlockedThemes) stats.unlockedThemes = [];
if (stats.activeTheme === undefined) stats.activeTheme = null;
if (!stats.unlockedTitles) stats.unlockedTitles = [];
if (stats.activeTitle === undefined) stats.activeTitle = null;
if (stats.premiumConfetti === undefined) stats.premiumConfetti = false;

function getXPNeeded(lvl) { return Math.floor(100 * Math.pow(lvl, 1.5)); }

function saveStats() {
  localStorage.setItem('colorGameStats', JSON.stringify(stats));
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
let currentRandom = Math.random;

function setSeed(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  currentRandom = mulberry32(hash);
}

function clearSeed() { currentRandom = Math.random; }

// ── Color math ──────────────────────────────────────────────────────────────

const isMobile = window.matchMedia('(max-width: 768px)').matches;

function hsvToCss(h, s, v) {
  s /= 100; v /= 100;
  const l = v * (1 - s / 2);
  const sl = (l === 0 || l === 1) ? 0 : (v - l) / Math.min(l, 1 - l);
  return `hsl(${h},${(sl * 100).toFixed(1)}%,${(l * 100).toFixed(1)}%)`;
}
function hsvLabel(h, s, v) { return `H${h} S${s} B${v}`; }

function getColorName(h, s, v) {
  if (s < 12 && v > 85) return 'Blanco Roto';
  if (s < 15 && v < 20) return 'Negro Carbón';
  if (s < 15) return 'Gris Ceniza';
  if (v < 30) return 'Oscuro Profundo';
  if (h < 15 || h >= 340) {
    if (v < 60) return 'Rojo Sangre';
    if (s < 60) return 'Rosa Pastel';
    return 'Rojo Carmesí';
  }
  if (h < 45) {
    if (v < 60) return 'Marrón Tierra';
    if (s < 60) return 'Melocotón';
    return 'Naranja Atardecer';
  }
  if (h < 75) {
    if (v < 60) return 'Verde Oliva';
    if (s < 60) return 'Amarillo Vainilla';
    return 'Amarillo Mostaza';
  }
  if (h < 160) {
    if (v < 60) return 'Verde Bosque';
    if (s < 60) return 'Verde Menta';
    return 'Verde Esmeralda';
  }
  if (h < 210) {
    if (v < 60) return 'Azul Marino';
    if (s < 60) return 'Azul Cielo';
    return 'Cian Neón';
  }
  if (h < 260) {
    if (v < 60) return 'Azul Noche';
    return 'Azul Cobalto';
  }
  if (h < 315) {
    if (v < 60) return 'Morado Oscuro';
    if (s < 60) return 'Lila Suave';
    return 'Púrpura Real';
  }
  if (v < 60) return 'Vino Tinto';
  return 'Rosa Fucsia';
}
function randInt(a, b) { return Math.floor(currentRandom() * (b - a + 1)) + a; }
function scoreForRound(target, guess) {
  const dH = Math.min(Math.abs(target.h - guess.h), 360 - Math.abs(target.h - guess.h));
  const dS = Math.abs(target.s - guess.s);
  const dV = Math.abs(target.v - guess.v);
  return parseFloat(Math.max(0, (1 - (dH/180)*0.5 - (dS/100)*0.25 - (dV/100)*0.25) * 10).toFixed(2));
}

const DESCS = [
  [9.5, 'Memoria perfecta. Eres una maquina.'],
  [8.5, 'Casi perfecto. Increible.'],
  [7.5, 'Muy bien. Gran ojo para el color.'],
  [6.5, 'Bien. Bastante cerca.'],
  [5.0, 'Regular. Musica de ascensor.'],
  [3.0, 'Necesitas mas practica.'],
  [0.0, 'Prueba con blanco y negro.'],
];
function scoreDesc(s) { return (DESCS.find(([m]) => s >= m) ?? DESCS.at(-1))[1]; }

const RANKS = [
  [9.5, '🌈 Pantone Humano'],
  [8.5, '👁️ Maestro del Color'],
  [7.0, '🖌️ Diseñador Gráfico'],
  [5.0, '🎨 Aprendiz de Pintor'],
  [0.0, '⬜ Daltónico Accidental'],
];
function getRank(s) { return (RANKS.find(([m]) => s >= m) ?? RANKS.at(-1))[1]; }

// ── Constants ────────────────────────────────────────────────────────────────

const ROUNDS = 5;

const TAGLINES = [
  'Simple. Cruel. Adictivo.',
  'Tu cerebro vs. el espectro visible.',
  '5 colores. Sin trampa. Sin mapa.',
  'El reto mas simple del mundo... o no.',
  'Memoriza. Recrea. Pierde.',
  'Cuanto sabes de lo que ves?',
];

const DIFFS = [
  { label: 'Facil',   secs: 3, sub: '3 segundos' },
  { label: 'Dificil', secs: 2, sub: '2 segundos' },
  { label: 'Brutal',  secs: 1, sub: '1 segundo'  },
  { label: 'A ciegas',secs: 2, sub: 'Sin previsualización', blind: true }
];

// ── State ────────────────────────────────────────────────────────────────────

let G = { isDaily: false, round: 0, colors: [], guesses: [], scores: [], diffSecs: 3 };
let P = { h: 180, s: 50, v: 50 };
let timerIv  = null;
let taglineIv = null;
let dragCtrl  = null;
let diffIdx   = 0;
let pickerUpdatePending = false;

// -- URL Challenge parsing --
const urlParams = new URLSearchParams(window.location.search);
const _rawSeed = urlParams.get('reto') || '';
let challengeSeed = _rawSeed.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 64);
let challengeMode = challengeSeed.length > 0;
let challengeDiffIdx = Math.max(0, Math.min(DIFFS.length - 1, parseInt(urlParams.get('diff')) || 0));

const app = document.getElementById('app');

// ── Tagline cycling ──────────────────────────────────────────────────────────

function startTaglines() {
  let i = 0;
  taglineIv = setInterval(() => {
    const el = document.getElementById('tagline');
    if (!el) { clearInterval(taglineIv); taglineIv = null; return; }
    gsap.to(el, {
      opacity: 0, y: -6, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        i = (i + 1) % TAGLINES.length;
        el.textContent = TAGLINES[i];
        gsap.fromTo(el, { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', force3D: true });
      }
    });
  }, 3200);
  return () => { clearInterval(taglineIv); taglineIv = null; };
}

// ── Difficulty cycle ─────────────────────────────────────────────────────────

function cycleDiff() {
  diffIdx = (diffIdx + 1) % DIFFS.length;
  const d = DIFFS[diffIdx];
  const nameEl = document.getElementById('diff-name');
  const timeEl = document.getElementById('diff-time');
  if (nameEl) nameEl.textContent = d.label;
  if (timeEl) timeEl.textContent = d.sub;
  document.querySelectorAll('.diff-dot').forEach((dot, i) => {
    dot.classList.toggle('on', i <= diffIdx);
  });
  gsap.fromTo('#diff-chip', { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' });
}

// ── START SCREEN ─────────────────────────────────────────────────────────────

function buildStart() {
  const el = document.createElement('div');
  el.className = 'card start-card';

  if (challengeMode) {
    el.innerHTML = `
      <div class="title-row"><span class="title-letter">R</span><span class="title-letter">e</span><span class="title-letter">t</span><span class="title-letter">o</span></div>
      <div class="rank-badge" style="background: rgba(255,50,50,0.15); border-color: rgba(255,50,50,0.4); color: #ff8888;">⚔️ Has sido retado</div>
      <div class="stats-row" style="display:block; text-align:center; padding: 12px; color:#aaa; font-size:0.85rem;">
        Alguien te ha desafiado a superar su puntuación con sus mismos colores exactos.<br><br>Dificultad: <b style="color:#fff">${DIFFS[challengeDiffIdx].label}</b>
      </div>
      <div class="actions-col">
        <div class="action-btn play" id="btn-challenge" style="background: linear-gradient(145deg, #007aff, #005bb5); border-color: #007aff;">
          <div class="btn-title" style="color:#fff">Aceptar Reto</div>
        </div>
        <div class="action-btn play" id="btn-cancel-challenge">
          <div class="btn-title">Ignorar y salir</div>
        </div>
      </div>
    `;
    document.body.appendChild(el);
    
    document.getElementById('btn-challenge').addEventListener('click', () => {
      diffIdx = challengeDiffIdx;
      gsap.to(el, { y: -28, opacity: 0, scale: 0.97, duration: 0.3, ease: 'power2.in',
        onComplete: () => { el.remove(); buildCountdown(() => startGame('challenge')); } });
    });
    document.getElementById('btn-cancel-challenge').addEventListener('click', () => {
      window.location.href = window.location.pathname; // clear url
    });
    return;
  }

  const personSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
  const calendarSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
  const wallSVG = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
  const shopSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;

  const letters = 'color'.split('').map(l => `<span class="title-letter">${l}</span>`).join('');
  
  const today = getTodayStr();
  const playedToday = stats.dailyPlayed[today];
  const activeTitleItem = stats.activeTitle ? SHOP_ITEMS.find(i => i.id === stats.activeTitle) : null;
  const userRank = activeTitleItem?.titleText || (stats.gamesPlayed > 0 ? getRank(stats.bestScore) : '🌱 Novato');
  const activePowerUps = ['extraHints','extraTime','extraRetry','inkMultiplierGames','xpMultiplierGames','streakShield'].filter(k => (stats[k] || 0) > 0).length;
  
  // Novedad: El modo diario se bloquea a un solo intento solo si el jugador ya conoce el juego (>5 partidas)
  const isDailyLocked = (stats.gamesPlayed >= 5) && (playedToday !== undefined);

  el.innerHTML = `
    <div class="ink-badge" style="position:absolute; top:24px; left:24px;" title="Gotas de Tinta">
      <span class="ink-drop">💧</span> ${Math.floor(stats.ink || 0)}
    </div>
    <div style="position:absolute; top:24px; right:24px; text-align:right;">
      <div style="font-size:0.7rem; color:#888; font-weight:900; margin-bottom:4px;">NIVEL ${stats.level}</div>
      <div style="width:80px; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
        <div style="width:${(stats.xp / getXPNeeded(stats.level) * 100).toFixed(0)}%; height:100%; background:linear-gradient(90deg, #4cd964, #aaffaa); box-shadow:0 0 10px rgba(76,217,100,0.5);"></div>
      </div>
    </div>
    <button id="btn-history" class="btn-icon" style="position:absolute; top:56px; right:24px;" title="Muro de Historial" aria-label="Historial de partidas">${wallSVG}</button>
    <button id="btn-shop" class="btn-icon${activePowerUps > 0 ? ' btn-icon--badge' : ''}" style="position:absolute; top:56px; left:24px;" title="Tienda de Tinta" aria-label="Abrir tienda">${shopSVG}${activePowerUps > 0 ? `<span class="shop-badge">${activePowerUps}</span>` : ''}</button>
    <div class="title-row">${letters}</div>
    <div class="rank-badge${stats.activeTitle === 'chromatico' ? ' rank-badge--rainbow' : ''}" title="Basado en tu Mejor Puntuación">${userRank}</div>
    <div class="stats-row">
      <div class="stat"><div class="stat-val">${stats.bestScore.toFixed(2)}</div><div class="stat-lbl">Mejor</div></div>
      <div class="stat"><div class="stat-val">${stats.gamesPlayed}</div><div class="stat-lbl">Partidas</div></div>
      <div class="stat"><div class="stat-val">${stats.streak}</div><div class="stat-lbl">Racha 🔥</div></div>
    </div>
    <p class="start-desc">
      Los humanos no pueden recordar colores con precision.<br>
      Te mostraremos <strong style="color:#fff">5 colores</strong>, luego intenta recrearlos.
    </p>
    <div class="tagline-box">
      <div class="tagline" id="tagline">${TAGLINES[0]}</div>
    </div>
    
    <div class="action-grid-modern">
      <button class="action-btn play practice" id="btn-practice" title="Práctica Libre">
        <div class="btn-rainbow-overlay"></div>${personSVG}
      </button>
      
      <button class="action-btn play survival" id="btn-survival" title="Modo Supervivencia (Muerte Súbita)">
        <div class="btn-rainbow-overlay"></div><span style="font-size:1.4rem; position:relative; z-index:1;">☠️</span>
      </button>

      <div class="diff-chip-modern" id="diff-chip" title="Cambiar Dificultad">
        <div class="diff-dots">
          <span class="diff-dot on"></span>
          <span class="diff-dot"></span>
          <span class="diff-dot"></span>
        </div>
        <span class="diff-name" id="diff-name">${DIFFS[diffIdx].label}</span>
      </div>

      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <button class="action-btn play daily" id="btn-daily" title="${playedToday !== undefined ? 'Puntuación: ' + playedToday.toFixed(2) : 'Desafío Diario'}" ${isDailyLocked ? 'style="opacity:0.4; cursor:not-allowed;"' : ''}>
          <div class="btn-rainbow-overlay"></div>${calendarSVG}
        </button>
        ${isDailyLocked ? '<div id="daily-countdown" style="position:absolute; bottom:-20px; font-size:0.6rem; color:#888; white-space:nowrap; font-weight:700;"></div>' : ''}
      </div>
    </div>
  `;
  app.appendChild(el);

  const stopTaglines = startTaglines();

  document.getElementById('btn-history').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildHistory();
  });

  document.getElementById('btn-shop').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildShop();
  });

  document.getElementById('diff-chip').addEventListener('click', () => {
    playClick();
    cycleDiff();
  });

  if (isDailyLocked) {
    let cdIv;
    const updateCd = () => {
      const cdEl = document.getElementById('daily-countdown');
      if (!cdEl) { clearInterval(cdIv); return; }
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow - now;
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0');
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      cdEl.textContent = `${h}:${m}:${s}`;
    };
    updateCd();
    cdIv = setInterval(updateCd, 1000);
  }

  // Card shake + fast spin on button hover
  let shakeTween = null;
  const startShake = () => {
    if (shakeTween) shakeTween.kill();
    let intensity = 0;
    const MAX_I  = 8;
    const TICK   = 0.075;
    const STEPS  = Math.round(10 / TICK);
    shakeTween = gsap.to(el, {
      x: () => (Math.random() - 0.5) * intensity * 2.2,
      y: () => (Math.random() - 0.5) * intensity * 1.3,
      rotation: () => (Math.random() - 0.5) * intensity * 0.28,
      duration: TICK,
      repeat: -1,
      repeatRefresh: true,
      ease: 'none',
      force3D: true,
      onRepeat() { intensity = Math.min(MAX_I, intensity + MAX_I / STEPS); },
    });
  };
  const stopShake = () => {
    if (shakeTween) { shakeTween.kill(); shakeTween = null; }
    gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
  };

  ['btn-daily', 'btn-practice', 'btn-survival'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn || btn.style.opacity) return; // skip if disabled
    btn.addEventListener('mouseenter', startShake);
    btn.addEventListener('mouseleave', stopShake);
    btn.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.play').forEach(b => b.style.pointerEvents = 'none');
      stopShake();
      gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.1 });
      stopTaglines();
      G.diffSecs = DIFFS[diffIdx].secs;
      gsap.to(el, {
        y: -28, opacity: 0, scale: 0.97,
        duration: 0.3, ease: 'power2.in',
        onComplete: () => { el.remove(); buildCountdown(() => startGame(id.replace('btn-', ''))); }
      });
    }, { once: true });
  });

  // Entrance
  const letEls = el.querySelectorAll('.title-letter');
  const hues   = [0, 45, 140, 200, 260];
  gsap.set(letEls, { y: 70, opacity: 0 });
  gsap.set(['.start-desc', '.tagline-box', '.action-row'], { y: 18, opacity: 0 });

  gsap.timeline()
    .to(letEls, { y: 0, opacity: 1, duration: 0.55, stagger: 0.07, ease: 'back.out(1.8)' })
    .to(['.start-desc', '.tagline-box', '.action-row'], {
      y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: 'power2.out',
    }, '-=0.2');

  letEls.forEach((l, i) => {
    gsap.to(l, {
      color: `hsl(${hues[i]},85%,65%)`, duration: 0.01, delay: i * 0.07,
      onComplete: () => { gsap.to(l, { color: '#fff', duration: 0.5, delay: 0.15, ease: 'power2.out' }); }
    });
  });
}

// ── COUNTDOWN SCREEN ─────────────────────────────────────────────────────────

function buildCountdown(onDone) {
  const el = document.createElement('div');
  el.className = 'card countdown-card';
  el.innerHTML = '<div class="cd-word" id="cd-word"></div>';
  app.appendChild(el);

  const steps = [
    { word: 'Preparados', color: '#ffffff' },
    { word: 'Listos',     color: '#f5c542' },
    { word: 'YA!',        color: '#4cd964' },
  ];
  let i = 0;

  function step() {
    const we = document.getElementById('cd-word');
    if (!we) return;
    const { word, color } = steps[i];
    we.textContent = word;
    we.style.color = color;

    const isLast = i === steps.length - 1;

    if (isLast) {
      playTone(880, 'sine', 0.2, 0.1);
      setTimeout(() => playTone(1320, 'sine', 0.3, 0.1), 50);
    } else {
      playTone(440, 'sine', 0.1, 0.1);
    }

    gsap.fromTo(we,
      { scale: isLast ? 0.3 : 0.55, opacity: 0, y: isLast ? 0 : 18 },
      { scale: isLast ? 1.08 : 1, opacity: 1, y: 0, duration: isLast ? 0.45 : 0.35, ease: 'back.out(2.2)' }
    );

    if (isLast) {
      gsap.to(el, { backgroundColor: 'rgba(76,217,100,0.06)', duration: 0.15, yoyo: true, repeat: 3, ease: 'none' });
      gsap.to(we, {
        scale: 1.2, opacity: 0, duration: 0.28, delay: 0.52, ease: 'power2.in',
        onComplete: () => {
          gsap.to(el, { opacity: 0, duration: 0.25, onComplete: () => { el.remove(); onDone(); } });
        }
      });
    } else {
      gsap.to(we, {
        opacity: 0, y: -18, scale: 0.8,
        duration: 0.22, delay: 0.7, ease: 'power2.in',
        onComplete: () => { i++; step(); }
      });
    }
  }

  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.22, onComplete: step });
}

// ── MEMORIZE SCREEN ───────────────────────────────────────────────────────────

function buildMemorize(color) {
  if (timerIv !== null) { clearInterval(timerIv); timerIv = null; }

  const R = 72;
  const C = 2 * Math.PI * R;
  const secs = G.diffSecs ?? 3;

  const el = document.createElement('div');
  el.className = 'card mem-card';
  el.id = 'screen-mem';
  el.style.backgroundColor = hsvToCss(color.h, color.s, color.v);
  el.innerHTML = `
    <span class="mem-round">${G.mode === 'survival' ? `Ronda ${G.round + 1}` : `${G.round + 1} / ${ROUNDS}`}</span>
    <div class="timer-wrap" id="timer-wrap">
      <svg class="timer-svg" width="190" height="190" viewBox="0 0 190 190">
        <circle class="t-track" cx="95" cy="95" r="${R}"/>
        <circle class="t-fill" id="t-fill" cx="95" cy="95" r="${R}"
          stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="0"/>
      </svg>
      <div class="timer-inner">
        <div class="timer-num" id="timer-num">${secs}</div>
        <div class="timer-label">seg. para recordar</div>
      </div>
    </div>
    <div class="mem-color-name">${getColorName(color.h, color.s, color.v)}</div>
    <span class="mem-brand">Color Game</span>
  `;
  app.appendChild(el);

  gsap.fromTo(el,
    { clipPath: 'circle(0% at 50% 50%)', opacity: 0.7 },
    { clipPath: 'circle(150% at 50% 50%)', opacity: 1, duration: 0.6, ease: 'power2.out',
      onComplete: () => { el.style.clipPath = ''; } }
  );
  gsap.fromTo('#timer-wrap',
    { scale: 0.6, opacity: 0 },
    { scale: 1, opacity: 1, delay: 0.25, duration: 0.5, ease: 'back.out(1.7)' }
  );

  const glowTween = gsap.to(el, {
    boxShadow: `0 0 80px ${hsvToCss(color.h, color.s, color.v)}55, 0 40px 100px rgba(0,0,0,0.7)`,
    repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut',
  });

  gsap.to('#t-fill', { strokeDashoffset: C, duration: secs, ease: 'none' });

  let remaining = secs;
  let done = false;
  timerIv = setInterval(() => {
    remaining--;
    const numEl = document.getElementById('timer-num');
    if (!numEl || done) { clearInterval(timerIv); timerIv = null; return; }
    numEl.textContent = Math.ceil(remaining);
    gsap.fromTo(numEl,
      { scale: 1.8, opacity: 1 },
      { scale: 1, opacity: 0.8, duration: 0.6, ease: 'power2.out', force3D: true }
    );
    gsap.fromTo(el, { boxShadow: `0 0 80px ${hsvToCss(color.h, color.s, color.v)}77` }, { boxShadow: '0 40px 100px rgba(0,0,0,0.7)', duration: 0.6 });
    playTone(300, 'sine', 0.1, 0.03);
    
    if (remaining <= 0) {
      done = true;
      clearInterval(timerIv); timerIv = null;
      glowTween.kill();
      gsap.killTweensOf(el);
      gsap.to(el, {
        rotationY: -90, opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => { el.remove(); buildGuess(); }
      });
    }
  }, 1000);
}

// ── GUESS SCREEN ──────────────────────────────────────────────────────────────

function buildGuess() {
  P = { h: 180, s: 50, v: 50 };
  G.guessStartTime = Date.now();

  const el = document.createElement('div');
  el.className = 'card guess-card';
  el.id = 'screen-guess';
  el.innerHTML = `
    <div class="time-bonus-wrap"><div class="time-bonus-fill" id="bonus-fill"></div></div>
    <div class="hue-col" id="hue-col" role="slider" aria-label="Tono" aria-valuemin="0" aria-valuemax="360" aria-valuenow="180" tabindex="0">
      <div class="s-thumb" id="hue-thumb" style="top:-12px"></div>
      <span class="strip-lbl">H</span>
    </div>
    <div class="sb-col">
      <div class="sat-strip" id="sat-strip" role="slider" aria-label="Saturación" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
        <div class="s-thumb" id="sat-thumb"></div>
        <span class="strip-lbl">S</span>
      </div>
      <div class="bri-strip" id="bri-strip" role="slider" aria-label="Brillo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" tabindex="0">
        <div class="s-thumb" id="bri-thumb"></div>
        <span class="strip-lbl">B</span>
      </div>
    </div>
    <div class="preview-col">
      ${G.mode === 'survival' ? `<div style="position:absolute; top:24px; left:24px; font-size:1.5rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${'❤️'.repeat(G.lives)}${'🖤'.repeat(3 - G.lives)}</div>` : ''}
      <div class="guess-header">
        <span>${G.mode === 'survival' ? `Ronda ${G.round + 1}` : `${G.round + 1} / ${ROUNDS}`}</span>
        <span class="${G.combo >= 2 ? 'on-fire' : ''}">Color Game ${G.combo >= 2 ? '🔥' : ''}</span>
      </div>
      <div class="preview-box" id="preview-box">
        <div class="preview-shine"></div>
        <div class="preview-cross" id="preview-cross"></div>
      </div>
      <div class="hsb-val" id="hsb-val">H180 &bull; S50 &bull; B50</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
        <button class="btn-hint" id="btn-hint" title="${G.hints > 0 ? 'Revelar el Tono correcto (1 uso)' : 'Pista agotada'}" ${G.hints > 0 ? '' : 'disabled'} style="${G.hints > 0 ? '' : 'opacity:0.3; cursor:not-allowed;'}">💡</button>
        <button class="btn-submit pulse" id="btn-submit" aria-label="Confirmar selección">&#10003;</button>
      </div>
    </div>
  `;
  app.appendChild(el);

  // Throttled setup
  requestAnimationFrame(() => { 
    updatePicker(); 
    setupDrag(); 
  });

  gsap.fromTo(el, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
  gsap.fromTo('#btn-submit', { scale: 0 }, { scale: 1, delay: 0.25, duration: 0.5, ease: 'back.out(2)' });
  gsap.to('#bonus-fill', { scaleX: 0, duration: 10, ease: 'none', delay: 0.4 });

  const btnHint = document.getElementById('btn-hint');
  btnHint.addEventListener('click', () => {
    if (G.hints > 0) {
      G.hints--;
      P.h = G.colors[G.round].h;
      updatePicker();
      btnHint.disabled = true;
      btnHint.title = 'Pista agotada';
      btnHint.style.opacity = '0.3';
      btnHint.style.cursor = 'not-allowed';
      gsap.fromTo('#hue-thumb', 
        { scale: 1.8, boxShadow: '0 0 30px #fff' }, 
        { scale: 1, boxShadow: '0 3px 10px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,0.18)', duration: 0.6 }
      );
      playBeepHigh();
    }
  });

  const btnSubmit = document.getElementById('btn-submit');
  btnSubmit.addEventListener('click', () => {
    btnSubmit.style.pointerEvents = 'none';
    submitGuess();
  }, { once: true });
}

function updatePicker() {
  if (pickerUpdatePending) return;
  pickerUpdatePending = true;

  requestAnimationFrame(() => {
    const box      = document.getElementById('preview-box');
    const hsbEl    = document.getElementById('hsb-val');
    const satStrip = document.getElementById('sat-strip');
    const briStrip = document.getElementById('bri-strip');
    const hueCol   = document.getElementById('hue-col');
    if (!box) { pickerUpdatePending = false; return; }

    const isBlind = DIFFS[diffIdx].blind;
    const css = isBlind ? '#050505' : hsvToCss(P.h, P.s, P.v);
    
    box.style.backgroundColor = css;
    if (!isMobile) {
      // Simplificar sombras pesadas
      box.style.boxShadow = isBlind ? 'inset 0 0 10px rgba(0,0,0,0.5)' : `0 10px 30px ${css}66`;
    }
    
    if (isBlind && !box.querySelector('.blind-icon')) {
      const icon = document.createElement('div');
      icon.className = 'blind-icon';
      icon.style.cssText = 'position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:2.5rem; opacity:0.15;';
      icon.textContent = '👁️‍🗨️';
      box.appendChild(icon);
    } else if (!isBlind) {
      const icon = box.querySelector('.blind-icon');
      if (icon) icon.remove();
    }

    if (hsbEl) hsbEl.innerHTML = isBlind ? `H??? &bull; S??? &bull; B???` : `H${P.h} &bull; S${P.s} &bull; B${P.v}`;

    // Fondo del card respira con el color seleccionado
    const guessCard = document.getElementById('screen-guess');
    if (guessCard) {
      guessCard.style.background = isBlind ? '#111' : `linear-gradient(145deg, ${hsvToCss(P.h, 22, 13)}, #111 60%)`;
    }

    // Glow en los thumbs que coincide con el color seleccionado (desactivado en movil para mas FPS)
    const thumbGlow = (isBlind || isMobile) ? '0 2px 10px rgba(0,0,0,0.55), 0 0 0 2.5px rgba(255,255,255,0.2)' : `0 2px 10px rgba(0,0,0,0.55), 0 0 0 2.5px ${css}70, 0 0 12px ${css}60`;
    ['hue-thumb','sat-thumb','bri-thumb'].forEach(id => {
      const t = document.getElementById(id);
      if (t) t.style.boxShadow = thumbGlow;
    });

    if (satStrip) satStrip.style.background = `linear-gradient(to bottom, ${hsvToCss(P.h,100,P.v)}, ${hsvToCss(P.h,0,P.v)})`;
    if (briStrip) briStrip.style.background = `linear-gradient(to bottom, ${hsvToCss(P.h,P.s,100)}, ${hsvToCss(P.h,P.s,0)})`;

    if (hueCol)   { const t = document.getElementById('hue-thumb'); if (t) t.style.top = `${(P.h/360)*hueCol.clientHeight-11}px`; hueCol.setAttribute('aria-valuenow', P.h); }
    if (satStrip) { const t = document.getElementById('sat-thumb'); if (t) t.style.top = `${((100-P.s)/100)*satStrip.clientHeight-11}px`; satStrip.setAttribute('aria-valuenow', P.s); }
    if (briStrip) { const t = document.getElementById('bri-thumb'); if (t) t.style.top = `${((100-P.v)/100)*briStrip.clientHeight-11}px`; briStrip.setAttribute('aria-valuenow', P.v); }

    if (!isMobile) {
      let ambi = document.getElementById('ambilight');
      if (!ambi) {
        ambi = document.createElement('div');
        ambi.id = 'ambilight';
        ambi.style.cssText = 'position:fixed; top:50%; left:50%; width:90vw; height:90vh; transform:translate(-50%,-50%); border-radius:50%; filter:blur(120px); opacity:0.25; pointer-events:none; z-index:-1; transition: background 0.1s ease-out;';
        document.body.appendChild(ambi);
      }
      ambi.style.background = isBlind ? 'transparent' : hsvToCss(P.h, 100, 50);
    }
    
    pickerUpdatePending = false;
  });
}

function setupDrag() {
  if (dragCtrl) dragCtrl.abort();
  dragCtrl = new AbortController();
  const sig = dragCtrl.signal;

  function drag(id, thumbId, onMove) {
    const el = document.getElementById(id);
    const thumb = document.getElementById(thumbId);
    if (!el) return;
    let active = false;
    const start = e => { 
      active = true; 
      onMove(e); 
      if (thumb) gsap.to(thumb, { scale: 1.25, duration: 0.2, ease: 'back.out(2)' });
    };
    const move  = e => { if (active) onMove(e); };
    const stop  = ()  => { 
      if (active && thumb) {
        gsap.to(thumb, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
      }
      active = false; 
    };
    el.addEventListener('mousedown',  start, { signal: sig });
    el.addEventListener('touchstart', e => start(e.touches[0]), { passive: true, signal: sig });
    window.addEventListener('mousemove',  move, { signal: sig });
    window.addEventListener('touchmove',  e => move(e.touches[0]), { passive: true, signal: sig });
    window.addEventListener('mouseup',  stop, { signal: sig });
    window.addEventListener('touchend', stop, { signal: sig });
  }

  drag('hue-col', 'hue-thumb', e => {
    const r = document.getElementById('hue-col').getBoundingClientRect();
    const oldH = P.h;
    P.h = Math.round(Math.max(0, Math.min(e.clientY - r.top, r.height)) / r.height * 360) % 360;
    if (P.h !== oldH) {
      playSliderSound(400 + (P.h / 360) * 400);
      updatePicker();
    }
  });
  drag('sat-strip', 'sat-thumb', e => {
    const r = document.getElementById('sat-strip').getBoundingClientRect();
    const oldS = P.s;
    P.s = Math.round(100 - Math.max(0, Math.min(e.clientY - r.top, r.height)) / r.height * 100);
    if (P.s !== oldS) {
      playSliderSound(300 + (P.s / 100) * 300);
      updatePicker();
    }
  });
  drag('bri-strip', 'bri-thumb', e => {
    const r = document.getElementById('bri-strip').getBoundingClientRect();
    const oldV = P.v;
    P.v = Math.round(100 - Math.max(0, Math.min(e.clientY - r.top, r.height)) / r.height * 100);
    if (P.v !== oldV) {
      playSliderSound(300 + (P.v / 100) * 300);
      updatePicker();
    }
  });
}

function submitGuess() {
  if (dragCtrl) { dragCtrl.abort(); dragCtrl = null; }
  playPop();
  vibrate(15);
  
  const elapsed = (Date.now() - G.guessStartTime - 400) / 1000;
  gsap.killTweensOf('#bonus-fill');

  const guess  = { ...P };
  const target = G.colors[G.round];
  
  let rawSc = scoreForRound(target, guess);
  let finalSc = rawSc;
  let bonusStr = '';
  
  if (elapsed < 10 && elapsed > 0 && rawSc >= 4.0) {
    const mult = 1 + (0.15 * (10 - elapsed) / 10);
    finalSc = rawSc === 10 ? 10 : Math.min(9.99, rawSc * mult);
    const perc = ((mult - 1) * 100).toFixed(0);
    if (perc > 0) bonusStr = `+${perc}% Bonus Vel.`;
  }

  if (finalSc >= 9.0) G.combo++;
  else G.combo = 0;

  G.guesses.push(guess);
  G.scores.push(finalSc);
  const sc = finalSc;

  const el  = document.getElementById('screen-guess');
  const btn = document.getElementById('btn-submit');

  const titleEl = el.querySelector('.guess-header span:last-child');
  if (G.combo >= 2 && titleEl) {
    titleEl.classList.add('on-fire');
    if (!titleEl.textContent.includes('🔥')) titleEl.textContent += ' 🔥';
  }

  gsap.timeline()
    .to(btn, { scale: 1.5, duration: 0.12, ease: 'power2.out' })
    .to(btn, { scale: 0.85, duration: 0.1 })
    .to(btn, { scale: 1.1, duration: 0.12 })
    .to(el, { x: 5, skewX: 10, opacity: 0.5, duration: 0.05, className: "+=glitch-split", delay: 0.05 })
    .to(el, { x: -5, skewX: -10, opacity: 0.8, duration: 0.05 })
    .to(el, { x: 0, skewX: 0, opacity: 0, rotationY: -90, duration: 0.25, className: "-=glitch-split", ease: "power2.in",
        onComplete: () => { 
          el.remove(); 
          const ambi = document.getElementById('ambilight');
          if (ambi) ambi.style.background = 'transparent';
          buildResult(target, guess, sc, bonusStr); 
        } });
}

// ── RESULT SCREEN ─────────────────────────────────────────────────────────────

function buildResult(target, guess, sc, bonusStr = '') {
  const topCss = hsvToCss(guess.h, guess.s, guess.v);
  const botCss = hsvToCss(target.h, target.s, target.v);

  const el = document.createElement('div');
  el.className = 'card result-card';
  el.id = 'screen-result';
  el.innerHTML = `
    <div class="res-half res-top" id="res-top" style="background:${topCss}">
      <div><div class="res-color-label">Tu seleccion</div><div class="res-color-val">${hsvLabel(guess.h,guess.s,guess.v)}</div></div>
    </div>
    <div class="res-half res-bot" id="res-bot" style="background:${botCss}">
      <div>
        <div class="res-color-label" style="font-size:1.1rem; letter-spacing:1px; color:#fff; font-weight:800; text-transform:uppercase; margin-bottom:2px; text-shadow:0 2px 4px rgba(0,0,0,0.3);">
          ${getColorName(target.h, target.s, target.v)}
        </div>
        <div class="res-color-val" style="opacity:0.8; font-size:0.8rem; text-shadow:0 1px 2px rgba(0,0,0,0.4);">${hsvLabel(target.h,target.s,target.v)}</div>
      </div>
    </div>
    <div class="res-score-pill" id="score-pill">
      <div class="res-score-big" id="res-num">0.00</div>
      <div class="res-score-desc">${scoreDesc(sc)}</div>
      <div class="res-score-bonus" id="res-bonus">${bonusStr}</div>
    </div>
    ${sc < 5.0 && G.hasRetry && !G.retryUsed ? `<button class="btn-retry" id="btn-retry" aria-label="Reintentar esta ronda">🔄 Segunda Oportunidad</button>` : ''}
    <button class="btn-next" id="btn-next">&#8594;</button>
  `;
  app.appendChild(el);

  gsap.fromTo(el, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
  gsap.fromTo('#res-top', { y: '-100%' }, { y: 0, duration: 0.55, ease: 'power3.out' });
  gsap.fromTo('#res-bot', { y:  '100%' }, { y: 0, duration: 0.55, ease: 'power3.out' });
  gsap.fromTo('#score-pill', { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, delay: 0.35, duration: 0.5, ease: 'back.out(2)' });

  const counter = { value: 0 };
  const numEl = document.getElementById('res-num');
  gsap.to(counter, {
    value: sc, delay: 0.35, duration: 0.9, ease: 'power2.out',
    onStart: () => playReveal(sc),
    onUpdate() { numEl.textContent = counter.value.toFixed(2); },
    onComplete: () => {
      if (sc < 5.0) {
        const obj = { x: 0, y: 0 };
        gsap.to(obj, {
          x: 15, y: 10, duration: 0.05, repeat: 9, yoyo: true,
          onUpdate: () => { el.style.transform = `translate(${obj.x}px, ${obj.y}px)`; },
          onComplete: () => { el.style.transform = 'none'; }
        });
        gsap.fromTo(document.body, { backgroundColor: '#550000' }, { backgroundColor: '#050505', duration: 0.8, ease: 'power2.out' });
        playTone(150, 'sawtooth', 0.4, 0.2);
      } else if (sc >= 9.5) {
        vibrate([100, 50, 100]);
        const perf = document.createElement('div');
        perf.textContent = '¡PERFECTO!';
        perf.style.cssText = 'position:absolute; top:25%; left:50%; transform:translate(-50%,-50%); font-size:3.5rem; font-weight:900; color:#fff; text-shadow:0 0 30px rgba(255,255,255,0.8); z-index:100; pointer-events:none; letter-spacing:-2px;';
        el.appendChild(perf);
        gsap.fromTo(perf, { scale: 0.3, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 0.4, ease: 'back.out(3)' });
        gsap.to(perf, { scale: 1, duration: 0.15, delay: 0.4 });
        gsap.to(perf, { y: -30, opacity: 0, duration: 0.5, delay: 1.0 });
        
        const obj = { x: 0, y: 0 };
        gsap.to(obj, {
          x: 10, y: 10, duration: 0.05, repeat: 10, yoyo: true,
          onUpdate: () => { el.style.transform = `translate(${obj.x}px, ${obj.y}px)`; },
          onComplete: () => { el.style.transform = 'none'; }
        });
      }
    }
  });
  
  if (bonusStr) {
    gsap.fromTo('#res-bonus', { opacity: 0, y: 5 }, { opacity: 1, y: 0, delay: 1.3, duration: 0.4, ease: 'back.out(2)' });
  }

  gsap.to(numEl, { color: `hsl(${Math.round(sc*12)},75%,65%)`, delay: 1.1, duration: 0.4 });
  gsap.fromTo('#btn-next', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, delay: 0.85, duration: 0.4, ease: 'back.out(2)' });

  const btnRetry = document.getElementById('btn-retry');
  if (btnRetry) {
    gsap.fromTo(btnRetry, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, delay: 1.2, duration: 0.4, ease: 'back.out(2)' });
    btnRetry.addEventListener('click', () => {
      btnRetry.style.pointerEvents = 'none';
      G.retryUsed = true;
      G.scores.pop();
      G.guesses.pop();
      playClick();
      gsap.to(el, {
        rotationY: -90, opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => { el.remove(); buildMemorize(G.colors[G.round]); }
      });
    }, { once: true });
  }

  const btnNext = document.getElementById('btn-next');
  btnNext.addEventListener('click', () => {
    btnNext.style.pointerEvents = 'none';

    if (G.mode === 'survival') {
      if (sc < 7.5) {
        G.lives--;
        playTone(100, 'sawtooth', 0.5, 0.3);
        vibrate(200);
      }
      
      gsap.to(el, {
        rotationY: -90, opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => { 
          el.remove(); 
          if (G.lives <= 0) buildFinal();
          else {
            G.round++;
            G.colors.push({ h: randInt(0, 359), s: randInt(40, 100), v: randInt(22, 82) });
            if (G.round > 3) G.diffSecs = Math.max(1, G.diffSecs - 0.2);
            buildMemorize(G.colors[G.round]);
          }
        }
      });
      return;
    }

    G.round++;
    gsap.to(el, {
      rotationY: -90, opacity: 0, duration: 0.35, ease: 'power2.in',
      onComplete: () => { el.remove(); G.round >= ROUNDS ? buildFinal() : buildMemorize(G.colors[G.round]); }
    });
  }, { once: true });
}

// ── FINAL SCREEN ──────────────────────────────────────────────────────────────

function buildFinal() {
  const numRounds = G.mode === 'survival' ? G.round + 1 : ROUNDS;
  const avg = G.scores.reduce((a, b) => a + b, 0) / numRounds;
  
  const baseInk = Math.floor(avg * numRounds + (G.combo * 5));
  const hasInkMult = (stats.inkMultiplierGames || 0) > 0;
  const earnedInk = hasInkMult ? Math.floor(baseInk * 1.5) : baseInk;
  if (hasInkMult) stats.inkMultiplierGames--;
  stats.ink = (stats.ink || 0) + earnedInk;
  
  const hasXpMult = (stats.xpMultiplierGames || 0) > 0;
  const earnedXP = Math.floor(avg * 10 * numRounds) * (hasXpMult ? 2 : 1);
  if (hasXpMult) stats.xpMultiplierGames--;
  stats.xp += earnedXP;
  
  let leveledUp = false;
  while (stats.xp >= getXPNeeded(stats.level)) {
    stats.xp -= getXPNeeded(stats.level);
    stats.level++;
    leveledUp = true;
    playLevelUp();
    vibrate([100, 50, 100, 50, 200]);
  }
  
  stats.gamesPlayed++;
  if (avg > stats.bestScore) stats.bestScore = avg;
  
  const today = getTodayStr();
  let shieldUsed = false;
  if (G.isDaily) {
    stats.dailyPlayed[today] = avg;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
    if (stats.lastPlayDate === yStr) {
      stats.streak++;
    } else if (stats.lastPlayDate !== today) {
      if (stats.streakShield > 0 && stats.lastPlayDate !== null) {
        stats.streakShield--;
        shieldUsed = true;
      } else {
        stats.streak = 1;
      }
    }
    stats.lastPlayDate = today;
  }
  
  stats.history.push({
    date: new Date().getTime(),
    mode: G.mode,
    score: avg,
    colors: G.colors.map((c, i) => ({
      target: c,
      guess: G.guesses[i],
      score: G.scores[i]
    }))
  });
  if (stats.history.length > 50) stats.history.shift();
  
  saveStats();

  const R    = 66;
  const C    = 2 * Math.PI * R;
  const frac = avg / 10;
  const hue  = Math.round(frac * 120);

  const el = document.createElement('div');
  el.className = 'card final-card';
  el.id = 'screen-final';

  const recap = G.colors.map((t, i) => {
    const g  = G.guesses[i];
    const sc = G.scores[i];
    const h  = Math.round(sc * 12);
    return `
      <div class="recap-row">
        <div class="recap-swatches">
          <div class="recap-swatch" style="background:${hsvToCss(g.h,g.s,g.v)}" title="Tuyo"></div>
          <div class="recap-swatch" style="background:${hsvToCss(t.h,t.s,t.v)}" title="Original"></div>
        </div>
        <div class="recap-info">
          <strong style="color:#fff; font-size:0.95rem; display:block; margin-bottom:2px;">${getColorName(t.h, t.s, t.v)}</strong>
          <div style="font-size:0.75rem; opacity:0.7;">${hsvLabel(g.h,g.s,g.v)} &#8594; ${hsvLabel(t.h,t.s,t.v)}</div>
        </div>
        <div class="recap-sc" style="color:hsl(${h},70%,65%)">${sc.toFixed(2)}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="final-eyebrow">${G.isDaily ? 'Desafío Diario' : (G.mode === 'survival' ? 'Muerte Súbita' : 'Puntuación Final')}</div>
    <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
      <div class="ink-badge" title="Gotas de Tinta Ganadas${hasInkMult ? ' (Multiplicador x1.5 activo)' : ''}">
        <span class="ink-drop">💧</span> +${earnedInk}${hasInkMult ? ' <span style="color:#ffcc00;font-size:0.7rem;font-weight:900;">x1.5</span>' : ''}
      </div>
      <div class="ink-badge" style="border-color: rgba(76,217,100,0.3);" title="Experiencia Ganada${hasXpMult ? ' (XP x2 activo)' : ''}">
        <span style="color:#4cd964;">✨</span> +${earnedXP} XP${hasXpMult ? ' <span style="color:#a78bfa;font-size:0.7rem;font-weight:900;">x2</span>' : ''}
      </div>
    </div>
    ${leveledUp ? `<div style="color:#4cd964; font-weight:900; font-size:1.4rem; margin-top:12px; text-shadow:0 0 15px rgba(76,217,100,0.5); animation: pulse 1s infinite;">¡SUBISTE AL NIVEL ${stats.level}! 🏆</div>` : ''}
    ${shieldUsed ? `<div style="color:#60a5fa; font-size:0.82rem; font-weight:800; margin-top:8px; letter-spacing:0.5px;">🛡️ Racha Segura activada — tu racha se ha conservado</div>` : ''}
    <div class="stats-row" style="margin-top: 12px; margin-bottom: 12px; transform: scale(0.9);">
      <div class="stat"><div class="stat-val">${stats.bestScore.toFixed(2)}</div><div class="stat-lbl">Mejor</div></div>
      <div class="stat"><div class="stat-val">${stats.gamesPlayed}</div><div class="stat-lbl">Partidas</div></div>
      <div class="stat"><div class="stat-val">${stats.streak}</div><div class="stat-lbl">Racha 🔥</div></div>
    </div>
    <div class="ring-wrap">
      <svg class="score-ring-svg" width="150" height="150" viewBox="0 0 150 150">
        <circle class="score-ring-bg" cx="75" cy="75" r="${R}"/>
        <circle class="score-ring-fg" id="score-ring" cx="75" cy="75" r="${R}"
          stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}"
          stroke="hsl(${hue},70%,65%)"/>
      </svg>
      <div class="ring-num" id="final-num">0</div>
    </div>
    <div class="final-desc">${scoreDesc(avg)}</div>
    <div class="recap-list">${recap}</div>
    <div class="final-actions">
      <button class="btn-share" id="btn-share">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        Compartir
      </button>
      <button class="btn-replay" id="btn-replay">Rejugar</button>
    </div>
  `;
  app.appendChild(el);

  gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' });
  gsap.to('#score-ring', { strokeDashoffset: C*(1-frac), delay: 0.3, duration: 1.6, ease: 'power2.out' });

  const counter = { value: 0 };
  const numEl   = document.getElementById('final-num');
  gsap.to(counter, {
    value: avg, delay: 0.3, duration: 1.6, ease: 'power2.out',
    onUpdate() { numEl.textContent = counter.value.toFixed(2); }
  });
  gsap.to(numEl, { color: `hsl(${hue},70%,65%)`, delay: 1.6, duration: 0.4 });

  const rows = el.querySelectorAll('.recap-row');
  gsap.set(rows, { x: 32, opacity: 0 });
  gsap.to(rows, { x: 0, opacity: 1, stagger: 0.08, delay: 0.5, duration: 0.4, ease: 'power2.out' });

  gsap.set('#btn-replay', { y: 16, opacity: 0 });
  gsap.to('#btn-replay',  { y: 0, opacity: 1, delay: 1.1, duration: 0.4, ease: 'back.out(1.5)' });

  if (avg >= 7) launchConfetti(avg);

  document.getElementById('btn-share').addEventListener('click', shareResult);
  
  const btnReplay = document.getElementById('btn-replay');
  if (G.mode === 'challenge') btnReplay.textContent = 'Menú Principal';
  btnReplay.addEventListener('click', () => {
    btnReplay.style.pointerEvents = 'none';
    gsap.to(el, { y: -28, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => { 
        el.remove(); 
        if (G.mode === 'challenge') window.location.href = window.location.pathname;
        else buildStart(); 
      } });
  }, { once: true });
}

function colorEmoji(h) {
  if (h < 20 || h >= 340) return '🟥';
  if (h < 45) return '🟧';
  if (h < 75) return '🟨';
  if (h < 160) return '🟩';
  if (h < 260) return '🟦';
  return '🟪';
}

function shareResult() {
  const dateStr = new Date().toLocaleDateString();
  let title = 'Color Game';
  if (G.mode === 'daily') title += ` Diario - ${dateStr}`;
  else if (G.mode === 'challenge') title += ` - Reto Aceptado`;
  else title += ` - Práctica`;

  const diffName = DIFFS[diffIdx].label;
  const avg = G.scores.reduce((a, b) => a + b, 0) / G.scores.length;
  const currentRank = getRank(avg);
  
  let text = `${title}\n${currentRank} (Dificultad: ${diffName})\n\n`;
  G.colors.forEach((c, i) => {
    text += `${colorEmoji(c.h)} ${G.scores[i].toFixed(1)}\n`;
  });
  text += `\nMedia: ${avg.toFixed(2)} / 10\n`;
  
  const link = new URL(window.location.origin + window.location.pathname);
  link.searchParams.set('reto', G.seed);
  link.searchParams.set('diff', diffIdx);
  text += `\n¡Te reto a superarme con mis colores!\n${link.toString()}`;
  
  if (navigator.share) {
    navigator.share({ title: 'Color Game', text: text }).catch(console.error);
  } else {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-share');
      const orig = btn.innerHTML;
      btn.innerHTML = '¡Copiado!';
      setTimeout(() => btn.innerHTML = orig, 2000);
    });
  }
}

// ── CANVAS EFFECTS (CONFETTI & EXPLOSION) ───────────────────────────────────

function launchConfetti(score) {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const count = Math.floor(score * 20 + 40);
  const cx    = canvas.width  / 2;
  const cy    = canvas.height * 0.55;

  const gameColors = (stats.premiumConfetti && G.colors?.length > 0) ? G.colors : null;
  const pieces = Array.from({ length: count }, (_, idx) => ({
    x: cx + (Math.random()-0.5)*120, y: cy,
    vx: (Math.random()-0.5)*16,
    vy: -(Math.random()*14+7),
    r: Math.random()*5+3,
    color: gameColors
      ? hsvToCss(gameColors[idx % gameColors.length].h, 80, 70)
      : `hsl(${Math.random()*360},80%,62%)`,
    angle: Math.random()*360, spin: (Math.random()-0.5)*10,
    gravity: 0.32, decay: 0.985,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of pieces) {
      p.vy += p.gravity; p.vx *= p.decay; p.vy *= p.decay;
      p.x += p.vx; p.y += p.vy; p.angle += p.spin;
      if (p.y < canvas.height+20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r, -p.r*0.5, p.r*2, p.r);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

function buildHistory() {
  const el = document.createElement('div');
  el.className = 'card history-card';
  el.style.padding = '30px 20px';
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.maxHeight = '80vh';
  
  let top5Html = '';
  let recentHtml = '';

  if (!stats.history || stats.history.length === 0) {
    recentHtml = `<div style="text-align:center; color:#555; padding:40px 0;">Aún no has jugado ninguna partida.</div>`;
  } else {
    const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
    const sorted = [...stats.history].sort((a, b) => b.score - a.score).slice(0, 5);
    top5Html = sorted.map((game, rank) => {
      const date = new Date(game.date).toLocaleDateString();
      const modeIco = game.mode === 'daily' ? '📅' : (game.mode === 'challenge' ? '⚔️' : '👤');
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#161616; border-radius:12px; margin-bottom:8px; border:1px solid #1e1e1e;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.1rem;">${medals[rank]}</span>
            <div style="font-size:0.75rem; color:#888; font-weight:700;">${modeIco} ${date}</div>
          </div>
          <div style="font-size:1.3rem; font-weight:900; color:${game.score >= 9 ? '#4cd964' : (game.score >= 7 ? '#ffcc00' : '#ff3b30')}">${game.score.toFixed(2)}</div>
        </div>
      `;
    }).join('');

    const rev = [...stats.history].reverse();
    recentHtml = rev.map(game => {
      const date = new Date(game.date).toLocaleDateString();
      const modeIco = game.mode === 'daily' ? '📅' : (game.mode === 'challenge' ? '⚔️' : '👤');
      const swatches = game.colors.map(c =>
        `<div style="width:24px; height:24px; border-radius:6px; background:${hsvToCss(c.target.h, c.target.s, c.target.v)}" title="${getColorName(c.target.h, c.target.s, c.target.v)}"></div>`
      ).join('');
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#181818; border-radius:12px; margin-bottom:10px; border:1px solid #222;">
          <div>
            <div style="font-size:0.75rem; color:#888; margin-bottom:6px; font-weight:700;">${modeIco} &nbsp;${date}</div>
            <div style="display:flex; gap:6px;">${swatches}</div>
          </div>
          <div style="font-size:1.4rem; font-weight:900; color:${game.score >= 9 ? '#4cd964' : (game.score >= 7 ? '#ffcc00' : '#ff3b30')}">${game.score.toFixed(2)}</div>
        </div>
      `;
    }).join('');
  }

  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding:0 8px;">
      <div style="font-size:1.8rem; font-weight:900; letter-spacing:-1px;">Muro de Colores</div>
      <button id="btn-hist-close" class="btn-icon-close" aria-label="Cerrar historial">&times;</button>
    </div>
    <div style="overflow-y:auto; flex:1; padding-right:8px;" class="custom-scrollbar">
      ${top5Html ? `<div class="shop-section-title">🏆 Top 5</div>${top5Html}<div class="shop-section-title" style="margin-top:8px;">📋 Historial Reciente</div>` : ''}
      ${recentHtml}
    </div>
  `;
  app.appendChild(el);
  
  gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' });
  
  document.getElementById('btn-hist-close').addEventListener('click', () => {
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => {
      el.remove();
      buildStart();
    }});
  });
}

// ── SHOP ─────────────────────────────────────────────────────────────────────

const SHOP_ITEMS = [
  {
    id: 'extraHint',
    name: 'Pista Extra',
    desc: 'Añade una pista adicional a tu próxima partida. Revela el Tono (H) exacto del color.',
    price: 50,
    icon: '💡',
    stat: 'extraHints',
    maxStack: 3,
  },
  {
    id: 'extraTime',
    name: 'Tiempo +1s',
    desc: 'Añade 1 segundo al temporizador de memorización en tu próxima partida. Funciona en todos los modos.',
    price: 75,
    icon: '⏱️',
    stat: 'extraTime',
    maxStack: 3,
  },
  {
    id: 'extraRetry',
    name: 'Segunda Oportunidad',
    desc: 'Si fallas una ronda (menos de 5.0), podrás repetirla una vez. Se consume al inicio de la partida.',
    price: 130,
    icon: '🔄',
    stat: 'extraRetry',
    maxStack: 3,
  },
  {
    id: 'inkMultiplier',
    name: 'Tinta x1.5',
    desc: 'Gana 1.5× más Gotas de Tinta durante las próximas 5 partidas.',
    price: 180,
    icon: '💰',
    stat: 'inkMultiplierGames',
    perPurchase: 5,
  },
  {
    id: 'xpMultiplier',
    name: 'XP x2',
    desc: 'Gana el doble de experiencia durante las próximas 3 partidas. Ideal para subir de nivel rápido.',
    price: 220,
    icon: '⚡',
    stat: 'xpMultiplierGames',
    perPurchase: 3,
  },
  {
    id: 'streakShield',
    name: 'Racha Segura',
    desc: 'Si un día no juegas el Desafío Diario, tu racha no se romperá. Un escudo por compra.',
    price: 150,
    icon: '🛡️',
    stat: 'streakShield',
    maxStack: 3,
  },
  {
    id: 'themeForest',
    name: 'Tema Bosque',
    desc: 'Las partículas del fondo adoptan tonos verdes. Cosmético permanente.',
    price: 350,
    icon: '🌿',
    type: 'theme',
  },
  {
    id: 'themeOcean',
    name: 'Tema Océano',
    desc: 'Las partículas del fondo adoptan tonos azules. Cosmético permanente.',
    price: 350,
    icon: '🌊',
    type: 'theme',
  },
  {
    id: 'themeFire',
    name: 'Tema Fuego',
    desc: 'Las partículas del fondo adoptan tonos naranja y rojo. Cosmético permanente.',
    price: 350,
    icon: '🔥',
    type: 'theme',
  },
  {
    id: 'tintero',
    name: 'Título: Tintero',
    desc: 'Muestra "🖊️ Maestro Tintero" como tu rango en la pantalla principal. Permanente.',
    price: 300,
    icon: '🖊️',
    type: 'title',
    titleText: '🖊️ Maestro Tintero',
  },
  {
    id: 'chromatico',
    name: 'Título: Cromático',
    desc: 'Muestra "🌈 Cromático Supreme" con efecto arcoiris en tu rango. Permanente.',
    price: 500,
    icon: '🌈',
    type: 'title',
    titleText: '🌈 Cromático Supreme',
  },
  {
    id: 'premiumConfetti',
    name: 'Confetti Premium',
    desc: 'Al terminar una partida con más de 7 puntos, el confetti usará los colores exactos que jugaste. Permanente.',
    price: 400,
    icon: '🎊',
    type: 'oneshot',
    stat: 'premiumConfetti',
  },
];

function buildShop() {
  const el = document.createElement('div');
  el.className = 'card shop-card';

  function renderInk() { return Math.floor(stats.ink || 0); }

  let confirmingBtn = null;
  let confirmTimeout = null;

  function cancelConfirm() {
    if (!confirmingBtn) return;
    confirmingBtn.innerHTML = confirmingBtn._origHtml;
    confirmingBtn.style.background = '';
    confirmingBtn.style.color = '';
    confirmingBtn.style.border = '';
    confirmingBtn = null;
    if (confirmTimeout) { clearTimeout(confirmTimeout); confirmTimeout = null; }
  }

  function renderItems(items) {
    return items.map(item => {
      const isTheme   = item.type === 'theme';
      const isTitle   = item.type === 'title';
      const isOneshot = item.type === 'oneshot';
      const isOwned   = isTheme  ? (stats.unlockedThemes || []).includes(item.id)
                      : isTitle  ? (stats.unlockedTitles || []).includes(item.id)
                      : isOneshot ? !!stats[item.stat]
                      : false;
      const isActive  = (isTheme  && stats.activeTheme === item.id)
                     || (isTitle  && stats.activeTitle  === item.id)
                     || (isOneshot && !!stats[item.stat]);
      const owned     = (!isTheme && !isTitle && !isOneshot) ? (stats[item.stat] || 0) : 0;
      const affordable = (stats.ink || 0) >= item.price;
      const atMaxStack = item.maxStack !== undefined && owned >= item.maxStack;

      let btnClass = 'shop-item-btn';
      let btnDisabled = '';
      let btnLabel = `<span class="ink-drop">💧</span> ${item.price}`;

      if (isTheme || isTitle || isOneshot) {
        if (isActive) {
          btnClass += ' active-theme'; btnDisabled = 'disabled';
          btnLabel = '✓ Activo';
        } else if (isOwned && !isOneshot) {
          btnLabel = 'Equipar';
        } else if (!affordable) {
          btnClass += ' disabled'; btnDisabled = 'disabled';
        }
      } else if (atMaxStack) {
        btnClass += ' disabled'; btnDisabled = 'disabled';
        btnLabel = 'Máx.';
      } else if (!affordable) {
        btnClass += ' disabled'; btnDisabled = 'disabled';
      }

      let ownedHtml = '';
      if (owned > 0) {
        const stackInfo = item.maxStack ? ` / ${item.maxStack}` : '';
        ownedHtml = `<div class="shop-item-owned">${item.perPurchase ? `<strong>${owned}</strong> partidas restantes` : `Tienes: <strong>${owned}</strong>${stackInfo}`}</div>`;
      }

      return `
        <div class="shop-item">
          <div class="shop-item-icon">${item.icon}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
            ${ownedHtml}
          </div>
          <button
            class="${btnClass}"
            data-id="${item.id}"
            data-price="${item.price}"
            data-stat="${item.stat || ''}"
            data-per-purchase="${item.perPurchase || 1}"
            data-type="${item.type || 'consumable'}"
            ${btnDisabled}
            aria-label="${isActive ? `${item.name} activo` : `Comprar ${item.name} por ${item.price} gotas`}">
            ${btnLabel}
          </button>
        </div>
      `;
    }).join('');
  }

  const upgrades  = SHOP_ITEMS.filter(i => !i.type || i.type === 'consumable');
  const cosmetics = SHOP_ITEMS.filter(i =>  i.type && i.type !== 'consumable');

  el.innerHTML = `
    <div class="shop-header">
      <div class="shop-title">Tienda de Tinta</div>
      <button id="btn-shop-close" class="btn-icon-close" aria-label="Cerrar tienda">&times;</button>
    </div>
    <div class="shop-wallet">
      <span class="ink-drop">💧</span>
      <span id="shop-ink-count">${renderInk()}</span>
      <span style="color:#666; font-size:0.75rem; margin-left:2px;">gotas disponibles</span>
    </div>
    <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px;">
      <div class="shop-section-title">⚡ Mejoras</div>
      <div id="shop-upgrades">${renderItems(upgrades)}</div>
      <div class="shop-section-title" style="margin-top:8px;">🎨 Estética</div>
      <div id="shop-cosmetics">${renderItems(cosmetics)}</div>
    </div>
  `;
  app.appendChild(el);

  gsap.fromTo(el,
    { y: 60, opacity: 0, scale: 0.97 },
    { y: 0,  opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
  );

  function doPurchase(btn) {
    const price       = parseInt(btn.dataset.price);
    const stat        = btn.dataset.stat;
    const perPurchase = parseInt(btn.dataset.perPurchase || '1');
    const itemId      = btn.dataset.id;
    const itemType    = btn.dataset.type;
    const itemDef     = SHOP_ITEMS.find(i => i.id === itemId);

    if (itemType === 'theme' || itemType === 'title') {
      const unlockedKey = itemType === 'theme' ? 'unlockedThemes' : 'unlockedTitles';
      const activeKey   = itemType === 'theme' ? 'activeTheme'    : 'activeTitle';
      const alreadyOwned = (stats[unlockedKey] || []).includes(itemId);
      if (!alreadyOwned) {
        if ((stats.ink || 0) < price) return;
        stats.ink -= price;
        stats[unlockedKey] = [...(stats[unlockedKey] || []), itemId];
      }
      stats[activeKey] = itemId;
      saveStats(); playSuccess(); vibrate(30);
      gsap.to(el, { y: 20, opacity: 0, duration: 0.15, onComplete: () => { el.remove(); buildShop(); } });
      return;
    }

    if (itemType === 'oneshot') {
      if ((stats.ink || 0) < price || stats[stat]) return;
      stats.ink -= price;
      stats[stat] = true;
      saveStats(); playSuccess(); vibrate(30);
      gsap.to(el, { y: 20, opacity: 0, duration: 0.15, onComplete: () => { el.remove(); buildShop(); } });
      return;
    }

    if ((stats.ink || 0) < price) return;
    if (itemDef?.maxStack !== undefined && (stats[stat] || 0) >= itemDef.maxStack) return;
    stats.ink -= price;
    stats[stat] = (stats[stat] || 0) + perPurchase;
    saveStats();
    playSuccess();
    vibrate(30);

    document.getElementById('shop-ink-count').textContent = renderInk();

    const origLabel = `<span class="ink-drop">💧</span> ${price}`;
    btn.innerHTML = '¡Comprado!';
    btn.classList.add('bought');
    gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });

    setTimeout(() => {
      const currentOwned = stats[stat] || 0;
      const atMax = itemDef?.maxStack !== undefined && currentOwned >= itemDef.maxStack;
      if (atMax) {
        btn.innerHTML = 'Máx.';
        btn.classList.add('disabled');
        btn.classList.remove('bought');
        btn.disabled = true;
      } else if ((stats.ink || 0) < price) {
        btn.innerHTML = origLabel;
        btn.classList.add('disabled');
        btn.classList.remove('bought');
        btn.disabled = true;
      } else {
        btn.innerHTML = origLabel;
        btn.classList.remove('bought');
      }
      const stackInfo = itemDef?.maxStack ? ` / ${itemDef.maxStack}` : '';
      const newOwnedHtml = itemDef?.perPurchase
        ? `<strong>${currentOwned}</strong> partidas restantes`
        : `Tienes: <strong>${currentOwned}</strong>${stackInfo}`;
      const ownedEl = btn.closest('.shop-item').querySelector('.shop-item-owned');
      if (ownedEl) ownedEl.innerHTML = newOwnedHtml;
      else {
        const info = btn.closest('.shop-item').querySelector('.shop-item-info');
        const d = document.createElement('div');
        d.className = 'shop-item-owned';
        d.innerHTML = newOwnedHtml;
        info.appendChild(d);
      }
    }, 1200);
  }

  el.querySelectorAll('.shop-item-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();

      const itemId   = btn.dataset.id;
      const itemType = btn.dataset.type;
      const unlockedKey = itemType === 'theme' ? 'unlockedThemes' : 'unlockedTitles';
      const isEquip = (itemType === 'theme' || itemType === 'title') && (stats[unlockedKey] || []).includes(itemId);

      if (isEquip) { doPurchase(btn); return; }

      if (confirmingBtn === btn) {
        cancelConfirm();
        doPurchase(btn);
        return;
      }

      cancelConfirm();
      confirmingBtn = btn;
      btn._origHtml = btn.innerHTML;
      btn.innerHTML = '¿Confirmar?';
      btn.style.background = 'rgba(255,165,0,0.15)';
      btn.style.color = '#ffaa00';
      btn.style.border = '1px solid rgba(255,165,0,0.35)';

      confirmTimeout = setTimeout(() => {
        if (confirmingBtn === btn) cancelConfirm();
      }, 2500);
    });
  });

  el.addEventListener('click', () => cancelConfirm());

  document.getElementById('btn-shop-close').addEventListener('click', () => {
    cancelConfirm();
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => {
      el.remove();
      buildStart();
    }});
  });
}

// ── GAME FLOW ─────────────────────────────────────────────────────────────────

function startGame(mode) {
  initAudio();
  G = {
    mode,
    isDaily: mode === 'daily',
    seed: mode === 'challenge' ? challengeSeed : (mode === 'daily' ? getTodayStr() : Math.random().toString().substring(2, 10)),
    round: 0,
    hints: (mode === 'survival' ? 3 : 1) + (stats.extraHints > 0 ? 1 : 0),
    hasRetry: stats.extraRetry > 0,
    retryUsed: false,
    combo: 0,
    lives: mode === 'survival' ? 3 : null,
    colors: [],
    guesses: [], scores: [],
    diffSecs: DIFFS[diffIdx].secs + (stats.extraTime > 0 ? 1 : 0),
  };

  if (stats.extraHints > 0) { stats.extraHints--; saveStats(); }
  if (stats.extraTime > 0)  { stats.extraTime--;  saveStats(); }
  if (stats.extraRetry > 0) { stats.extraRetry--; saveStats(); }

  if (mode === 'daily') setSeed(getTodayStr());
  else if (mode === 'challenge') setSeed(challengeSeed);
  else clearSeed();

  const numRounds = mode === 'survival' ? 1 : ROUNDS;
  for (let i = 0; i < numRounds; i++) {
    G.colors.push({ h: randInt(0, 359), s: randInt(40, 100), v: randInt(22, 82) });
  }

  pActiveColor = null;
  buildMemorize(G.colors[0]);
}

// ── PARTICLES SYSTEM ────────────────────────────────────────────────────────

const THEME_COLORS = {
  themeForest: '#2d6a4f',
  themeOcean:  '#0369a1',
  themeFire:   '#ea580c',
};

const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];
let pActiveColor = null;

function initParticles() {
  if (!pCanvas) return;
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  const count = isMobile ? 35 : 90;
  particles = Array.from({ length: count }, () => {
    const theme = stats.activeTheme;
    return {
      x: Math.random() * pCanvas.width,
      y: Math.random() * pCanvas.height,
      r: Math.random() * 2.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.8 + 0.2),
      alpha: Math.random() * 0.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      hueOffset: (Math.random() - 0.5) * 30 // Variación de tono para cada partícula
    };
  });
}

let pPaused = false;
let lastPColorStr = '';
let lastPDraw = 0;
function drawParticles(now) {
  if (!pCanvas || pPaused) return;
  requestAnimationFrame(drawParticles);
  
  if (now - lastPDraw < 20) return; 
  lastPDraw = now;

  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  
  const theme = stats.activeTheme;
  const baseColor = pActiveColor
    ? hsvToCss(pActiveColor.h, pActiveColor.s, pActiveColor.v)
    : (theme ? THEME_COLORS[theme] : '#888888');
  
  pCtx.shadowBlur = isMobile ? 0 : (theme === 'themeFire' ? 15 : 10);
  
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    pCtx.globalAlpha = p.alpha;
    
    // Variación de color por partícula para temas naturales
    let pColor = baseColor;
    if (theme === 'themeForest' && !pActiveColor) {
      pColor = `hsl(${140 + p.hueOffset}, 45%, ${50 + (p.alpha * 20)}%)`;
    } else if (theme === 'themeFire' && !pActiveColor) {
      pColor = `hsl(${20 + p.hueOffset}, 85%, ${50 + (p.alpha * 20)}%)`;
    }

    pCtx.fillStyle = pColor;
    pCtx.strokeStyle = pColor;
    pCtx.shadowColor = pColor;
    
    const sway = Math.sin(now / 1200 + p.phase) * 0.3;
    
    if (theme === 'themeForest') {
      // HOJAS: Elipses rotando suavemente
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.phase + now / 1500);
      pCtx.beginPath();
      pCtx.ellipse(0, 0, p.r * 1.8, p.r * 0.8, 0, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();
    } 
    else if (theme === 'themeOcean') {
      // BURBUJAS: Círculos con borde y algunos rellenos
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      if (i % 2 === 0) {
        pCtx.lineWidth = 1.5;
        pCtx.stroke();
      } else {
        pCtx.fill();
      }
    }
    else if (theme === 'themeFire') {
      // CHISPAS: Triángulos/Llamas que parpadean
      const flicker = Math.sin(now / 80 + p.phase) * 0.3 + 0.7;
      pCtx.globalAlpha = p.alpha * flicker;
      pCtx.beginPath();
      pCtx.moveTo(p.x, p.y - p.r * 2.5);
      pCtx.lineTo(p.x - p.r, p.y);
      pCtx.lineTo(p.x + p.r, p.y);
      pCtx.closePath();
      pCtx.fill();
    }
    else {
      // PUNTOS: El efecto premium por defecto
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fill();
    }
    
    // FÍSICA
    const speedMult = theme === 'themeFire' ? 1.8 : (theme === 'themeOcean' ? 0.7 : 1);
    p.x += (p.vx + sway) * speedMult; 
    p.y += p.vy * speedMult;
    
    if (p.y < -30) { 
      p.y = pCanvas.height + 30; 
      p.x = Math.random() * pCanvas.width; 
    }
    if (p.x < -30) p.x = pCanvas.width + 30;
    if (p.x > pCanvas.width + 30) p.x = -30;
  }
}

window.addEventListener('resize', initParticles);
document.addEventListener('visibilitychange', () => {
  pPaused = document.hidden;
  if (!pPaused) requestAnimationFrame(drawParticles);
});
initParticles();
drawParticles();

// ── INIT ──────────────────────────────────────────────────────────────────────

buildStart();