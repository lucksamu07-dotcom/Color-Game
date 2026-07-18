import gsap from 'gsap';
import { inject } from '@vercel/analytics';

// Estadísticas de visitas en el panel de Vercel. Solo en la web publicada:
// en local no manda nada.
if (import.meta.env.PROD) inject();

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

// Cada skin cambia el "timbre" de (casi) todos los sonidos del juego desde
// este único punto, sin tocar cada llamada a playTone() por separado.
function getSkinWaveType(type) {
  const skin = stats.activeSkin;
  if (skin === 'skinRetro') return (type === 'sine' || type === 'triangle') ? 'square' : type;
  if (skin === 'skinCyberpunk') return type === 'sine' ? 'sawtooth' : type;
  return type;
}
function getSkinFreqMult() {
  const skin = stats.activeSkin;
  if (skin === 'skinCristal') return 1.18; // más agudo: campanillas
  if (skin === 'skinRetro') return 0.92;   // un pelín más grave: chiptune
  return 1;
}

function playTone(freq, type, duration, vol=0.1) {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = getSkinWaveType(type);
  osc.frequency.setValueAtTime(freq * getSkinFreqMult(), audioCtx.currentTime);
  
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
  const t = audioCtx.currentTime;
  const thud = audioCtx.createOscillator();
  const thudGain = audioCtx.createGain();
  thud.frequency.setValueAtTime(160, t);
  thud.frequency.exponentialRampToValueAtTime(50, t + 0.13);
  thudGain.gain.setValueAtTime(0.44, t);
  thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  thud.connect(thudGain); thudGain.connect(audioCtx.destination);
  thud.start(t); thud.stop(t + 0.15);
  const click = audioCtx.createOscillator();
  const clickGain = audioCtx.createGain();
  click.type = 'square';
  click.frequency.setValueAtTime(1100, t);
  click.frequency.exponentialRampToValueAtTime(200, t + 0.05);
  clickGain.gain.setValueAtTime(0.09, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  click.connect(clickGain); clickGain.connect(audioCtx.destination);
  click.start(t); click.stop(t + 0.05);
}

function playBeep() { playTone(600, 'square', 0.1, 0.05); }
function playBeepHigh() { playTone(880, 'square', 0.15, 0.05); }

function playReveal(score) {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const t = audioCtx.currentTime;
  if (score >= 9.5) {
    const sweep = audioCtx.createOscillator();
    const sweepGain = audioCtx.createGain();
    sweep.frequency.setValueAtTime(220, t);
    sweep.frequency.exponentialRampToValueAtTime(880, t + 0.32);
    sweepGain.gain.setValueAtTime(0.07, t);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    sweep.connect(sweepGain); sweepGain.connect(audioCtx.destination);
    sweep.start(t); sweep.stop(t + 0.32);
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 1.8, 0.13), 330 + i * 65);
    });
  } else if (score >= 8.0) {
    [440, 554.37, 659.25].forEach((f, i) => {
      setTimeout(() => playTone(f, 'sine', 1.1, 0.11), i * 55);
    });
  } else if (score >= 6.0) {
    playTone(440, 'triangle', 0.35, 0.09);
    setTimeout(() => playTone(554.37, 'triangle', 0.45, 0.09), 85);
  } else if (score < 4.0) {
    playTone(200, 'sawtooth', 0.12, 0.18);
    setTimeout(() => playTone(160, 'sawtooth', 0.45, 0.18), 130);
    setTimeout(() => playTone(110, 'sawtooth', 0.65, 0.18), 290);
  } else {
    playTone(440, 'triangle', 0.18, 0.1);
    setTimeout(() => playTone(523.25, 'triangle', 0.28, 0.09), 95);
  }
}

function playLevelUp() {
  const notes = [392, 493.88, 523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'sine', 0.55, 0.12), i * 110);
  });
  setTimeout(() => {
    [523.25, 659.25, 783.99].forEach(f => playTone(f, 'sine', 1.0, 0.09));
  }, notes.length * 110 + 40);
}

function playClick() {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(1400, t);
  osc.frequency.exponentialRampToValueAtTime(500, t + 0.04);
  gain.gain.setValueAtTime(0.07, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.start(t); osc.stop(t + 0.04);
}

function playSuccess() {
  [523.25, 659.25, 783.99].forEach((f, i) => {
    setTimeout(() => playTone(f, 'sine', 0.3, 0.1), i * 65);
  });
}

function playStartJingle(mode) {
  const themes = {
    daily: [392, 523.25, 659.25, 783.99],
    survival: [220, 329.63, 440, 659.25],
    practice: [329.63, 392, 493.88, 659.25],
    challenge: [293.66, 440, 587.33, 880],
    timed: [440, 554.37, 659.25, 880],
    zen: [261.63, 329.63, 392, 523.25],
    inverse: [587.33, 493.88, 392, 587.33],
  };
  const notes = themes[mode] || themes.practice;
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, i === notes.length - 1 ? 'triangle' : 'sine', 0.22 + i * 0.03, 0.08), i * 58);
  });
}

function playColorReveal(color) {
  const base = 220 + (color.h / 360) * 440;
  playTone(base, 'sine', 0.24, 0.055);
  setTimeout(() => playTone(base * (1 + color.s / 220), 'triangle', 0.18, 0.035), 45);
}

function playAwardPop(i = 0) {
  const base = 520 + i * 85;
  playTone(base, 'triangle', 0.14, 0.05);
  setTimeout(() => playTone(base * 1.5, 'sine', 0.16, 0.04), 45);
}

function playSwish() {
  if (isMuted) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const t = audioCtx.currentTime;
  const dur = 0.17;
  const buf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * dur), audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'bandpass';
  filt.frequency.setValueAtTime(3500, t);
  filt.frequency.exponentialRampToValueAtTime(350, t + dur);
  filt.Q.value = 0.9;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.065, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
  src.start(t); src.stop(t + dur);
}

function playCombo(n) {
  const base = Math.min(880, 440 * Math.pow(1.14, n - 2));
  playTone(base, 'sine', 0.18, 0.09);
  setTimeout(() => playTone(base * 1.26, 'sine', 0.22, 0.09), 70);
  if (n >= 4) setTimeout(() => playTone(base * 1.587, 'sine', 0.28, 0.09), 140);
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

// ── Pool de partículas DOM ──────────────────────────────────────────────────
// Con chispas en cada botón, crear y destruir cientos de <div> por minuto
// pondría al recolector de basura a trabajar justo durante las animaciones.
// El pool recicla los divs (mismo aspecto, coste de creación casi cero) y un
// tope duro de partículas vivas garantiza que ni el peor pico (confeti +
// fuegos + clics a la vez) pueda saturar un aparato modesto.
const MAX_LIVE_DOTS = 220;
let liveDots = 0;
const dotPool = [];
function acquireDot() {
  const d = dotPool.pop() || document.createElement('div');
  d._free = false;
  liveDots++;
  return d;
}
function releaseDot(d) {
  if (d._free) return; // ya devuelto (onComplete + red de seguridad pueden coincidir)
  d._free = true;
  liveDots--;
  gsap.killTweensOf(d);
  d.remove();
  if (dotPool.length < 160) dotPool.push(d);
}

// ── Explosión de puntitos de color al pulsar (juice barato: pocos nodos,
//    solo transform+opacity, reciclados del pool). colors=null → arcoíris.
function spawnBurst(x, y, opts = {}) {
  if (prefersReducedMotion) return;
  let n = Math.max(1, Math.round((opts.count || 10) * burstScale()));
  n = Math.min(n, Math.max(0, MAX_LIVE_DOTS - liveDots));
  const colors = opts.colors || null;
  for (let i = 0; i < n; i++) {
    const d = acquireDot();
    const size = 4 + Math.random() * 5;
    const c = colors ? colors[i % colors.length] : `hsl(${Math.round(Math.random() * 360)},85%,62%)`;
    d.style.cssText = `position:fixed; left:${x}px; top:${y}px; width:${size}px; height:${size}px; margin:-${size/2}px 0 0 -${size/2}px; border-radius:50%; background:${c}; pointer-events:none; z-index:5000; will-change:transform,opacity;`;
    document.body.appendChild(d);
    const ang = Math.random() * Math.PI * 2;
    const dist = 34 + Math.random() * 46;
    gsap.fromTo(d, { x: 0, y: 0, scale: 1, opacity: 1 },
      { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist - 12, scale: 0.2, opacity: 0,
        duration: 0.5 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => releaseDot(d) });
    // Red de seguridad por si algo mata el tween (p.ej. salir al menú)
    setTimeout(() => releaseDot(d), 1000);
  }
}

// Sacudida de cámara reutilizable (generaliza el patrón ad-hoc que ya
// existía para rondas malas/perfectas en buildResult). Anima solo
// transform, así que es barata y no interfiere con otros tweens del propio
// elemento (usa su transform actual como base, no lo pisa).
function screenShake(el, opts = {}) {
  if (prefersReducedMotion || !el) return;
  const amp = opts.amp ?? 10;
  const count = opts.count ?? 8;
  const obj = { x: 0, y: 0 };
  gsap.to(obj, {
    x: amp, y: amp * 0.7, duration: 0.05, repeat: count, yoyo: true,
    onUpdate: () => { el.style.transform = `translate(${obj.x}px, ${obj.y}px)`; },
    onComplete: () => { el.style.transform = 'none'; },
  });
}

// Destello de pantalla completa (barato: un div de color a opacidad alta
// que se apaga con un tween de opacity, sin canvas ni filtros caros).
function screenFlash(color = '#ffffff', opts = {}) {
  if (prefersReducedMotion) return;
  const flash = document.createElement('div');
  flash.style.cssText = `position:fixed; inset:0; background:${color}; opacity:${opts.peak ?? 0.35}; pointer-events:none; z-index:6000;`;
  document.body.appendChild(flash);
  gsap.to(flash, { opacity: 0, duration: opts.duration ?? 0.5, ease: 'power2.out', onComplete: () => flash.remove() });
}

// Onda expansiva: un anillo que crece y se desvanece desde un punto. Barato
// (un div, solo transform+opacity) y muy resultón para momentos "¡PUM!".
function shockwave(x, y, color = '#ffffff') {
  if (prefersReducedMotion) return;
  const ring = document.createElement('div');
  ring.style.cssText = `position:fixed; left:${x}px; top:${y}px; width:24px; height:24px; margin:-12px 0 0 -12px; border-radius:50%; border:3px solid ${color}; pointer-events:none; z-index:6600; opacity:0.9; will-change:transform,opacity;`;
  document.body.appendChild(ring);
  gsap.fromTo(ring, { scale: 0.4 }, { scale: 16, opacity: 0, duration: 0.65, ease: 'power2.out', onComplete: () => ring.remove() });
  setTimeout(() => ring.remove(), 1000);
}

// Lo contrario de spawnBurst: partículas que nacen alrededor de un punto y
// CONVERGEN hacia él. Se usa cuando algo "se reconstruye" o absorbe energía.
function spawnImplosion(x, y, opts = {}) {
  if (prefersReducedMotion) return;
  let n = Math.max(1, Math.round((opts.count || 14) * burstScale()));
  n = Math.min(n, Math.max(0, MAX_LIVE_DOTS - liveDots));
  const colors = opts.colors || null;
  for (let i = 0; i < n; i++) {
    const d = acquireDot();
    const size = 3 + Math.random() * 4;
    const c = colors ? colors[i % colors.length] : `hsl(${Math.round(Math.random() * 360)},85%,62%)`;
    const ang = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 130;
    d.style.cssText = `position:fixed; left:${x + Math.cos(ang) * dist}px; top:${y + Math.sin(ang) * dist}px; width:${size}px; height:${size}px; margin:-${size/2}px 0 0 -${size/2}px; border-radius:50%; background:${c}; pointer-events:none; z-index:5000; opacity:0; will-change:transform,opacity;`;
    document.body.appendChild(d);
    const delay = Math.random() * 0.18;
    gsap.fromTo(d, { x: 0, y: 0, scale: 1 }, { opacity: 1, duration: 0.12, delay });
    gsap.to(d, {
      x: -Math.cos(ang) * dist, y: -Math.sin(ang) * dist, scale: 0.3,
      duration: 0.4 + Math.random() * 0.25, delay,
      ease: 'power2.in', onComplete: () => releaseDot(d),
    });
    setTimeout(() => releaseDot(d), 1200); // red de seguridad
  }
}

// Barrido de color de pantalla completa entre fases del juego. Es una capa
// superpuesta autónoma (se crea, se anima y se autodestruye) que no toca ni
// reemplaza las transiciones GSAP que ya existen en cada pantalla — solo se
// dibuja encima, así que no hay riesgo de romper una transición existente.
// El estilo del barrido varía según el skin activo (mismo llamador, mismos
// puntos de la partida, solo cambia cómo se ve la capa).
function colorWipe(color, opts = {}) {
  if (prefersReducedMotion) return null;
  const skin = stats.activeSkin;

  if (skin === 'skinRetro') {
    // Escaneo horizontal tipo CRT en vez de círculo.
    const wipe = document.createElement('div');
    wipe.style.cssText = `position:fixed; inset:0; background:${color}; z-index:7000; pointer-events:none; clip-path:inset(0 0 100% 0); will-change:clip-path;`;
    document.body.appendChild(wipe);
    const tl = gsap.timeline({ onComplete: () => wipe.remove() });
    tl.to(wipe, { clipPath: 'inset(0 0 0% 0)', duration: opts.inDur ?? 0.3, ease: 'steps(6)' });
    tl.to(wipe, { clipPath: 'inset(100% 0 0 0)', duration: opts.outDur ?? 0.32, ease: 'steps(6)' }, `+=${opts.hold ?? 0.04}`);
    return tl;
  }

  if (skin === 'skinCyberpunk') {
    // Barrido con separación RGB (3 capas desfasadas en rojo/cian) + jitter.
    const layer = (dx, c, blend) => {
      const d = document.createElement('div');
      d.style.cssText = `position:fixed; inset:0; background:${c}; z-index:7000; pointer-events:none; clip-path:circle(0% at 50% 50%); mix-blend-mode:${blend}; transform:translateX(${dx}px);`;
      document.body.appendChild(d);
      return d;
    };
    const base = layer(0, color, 'normal');
    const r = layer(-4, 'rgba(255,0,60,0.55)', 'screen');
    const c = layer(4, 'rgba(0,229,255,0.55)', 'screen');
    const all = [base, r, c];
    const tl = gsap.timeline({ onComplete: () => all.forEach(d => d.remove()) });
    tl.to(all, { clipPath: 'circle(150% at 50% 50%)', duration: opts.inDur ?? 0.24, ease: 'power1.in' });
    tl.to([r, c], { x: 0, duration: 0.18, ease: 'steps(4)' }, '<');
    tl.to(all, { clipPath: 'circle(0% at 50% 50%)', duration: opts.outDur ?? 0.4, ease: 'power2.out' }, `+=${opts.hold ?? 0.05}`);
    return tl;
  }

  // Cristal (y skin por defecto): el mismo círculo de siempre; en Cristal se
  // aligera a un barrido translúcido con desenfoque para que se note el vidrio.
  const wipe = document.createElement('div');
  wipe.style.cssText = skin === 'skinCristal'
    ? `position:fixed; inset:0; background:${color}; opacity:0.55; backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); z-index:7000; pointer-events:none; clip-path:circle(0% at 50% 50%); will-change:clip-path;`
    : `position:fixed; inset:0; background:${color}; z-index:7000; pointer-events:none; clip-path:circle(0% at 50% 50%); will-change:clip-path;`;
  document.body.appendChild(wipe);
  const tl = gsap.timeline({ onComplete: () => wipe.remove() });
  tl.to(wipe, { clipPath: 'circle(150% at 50% 50%)', duration: opts.inDur ?? 0.32, ease: 'power2.in' });
  tl.to(wipe, { clipPath: 'circle(0% at 50% 50%)', duration: opts.outDur ?? 0.42, ease: 'power2.out' }, `+=${opts.hold ?? 0.05}`);
  return tl;
}

// Celebración a pantalla completa reservada para los hitos más raros del
// juego (hoy: completar el Pase de Temporada entero). Overlay propio y
// autónomo — no compite con nada de lo que ya haya en pantalla.
// Varias explosiones de spawnBurst repartidas por la pantalla y escalonadas
// en el tiempo: mismo "motor" barato de siempre, pero varias veces seguidas
// da la sensación de fuegos artificiales de verdad en vez de un solo pop.
function fireworksShow(count = 6, spread = 1600) {
  if (prefersReducedMotion) return;
  const palette = ['#ffd700', '#ff416c', '#45dcff', '#4cd964', '#c77dff', '#ff9f45'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const x = window.innerWidth * (0.18 + Math.random() * 0.64);
      const y = window.innerHeight * (0.16 + Math.random() * 0.4);
      const c = palette[Math.floor(Math.random() * palette.length)];
      spawnBurst(x, y, { count: 16, colors: [c, '#ffffff'] });
    }, (i / count) * spread + Math.random() * 120);
  }
}

// "Portal" de color: anillos que se expanden girando desde el centro. Capa
// propia autónoma, igual que colorWipe/screenFlash — nunca debe poder
// bloquear el arranque de la partida, así que va con try/catch y una red de
// seguridad que fuerza su limpieza pase lo que pase. (Antes usaba un único
// gsap.timeline() cuyo onComplete, si algo lo interrumpía, dejaba el overlay
// atascado en pantalla y con él el juego, ya que se dibuja por encima de todo.)
function portalTransition(color) {
  if (prefersReducedMotion) return;
  try {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed; inset:0; z-index:2000; pointer-events:none; display:flex; align-items:center; justify-content:center; overflow:hidden;';
    document.body.appendChild(wrap);

    let cleaned = false;
    const cleanup = () => { if (!cleaned) { cleaned = true; wrap.remove(); } };
    setTimeout(cleanup, 1200); // red de seguridad: desaparece sí o sí

    let remaining = 3;
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('div');
      r.style.cssText = `position:absolute; width:40px; height:40px; border-radius:50%; border:4px solid ${color}; opacity:0.9;`;
      wrap.appendChild(r);
      gsap.fromTo(r, { scale: 0.3, opacity: 0.9, rotation: 0 }, {
        scale: 60, opacity: 0, rotation: 180, duration: 0.55, delay: i * 0.08, ease: 'power2.out',
        onComplete: () => { remaining--; if (remaining <= 0) cleanup(); },
      });
    }
  } catch (_) {
    // Un fallo puramente decorativo nunca debe impedir que el juego arranque.
  }
}

function epicCelebration(title, subtitle = '') {
  if (prefersReducedMotion) return;
  const ov = document.createElement('div');
  ov.className = 'epic-celebration';
  ov.innerHTML = `
    <div class="epic-rays"></div>
    <div class="epic-text">
      <div class="epic-title">${title}</div>
      ${subtitle ? `<div class="epic-sub">${subtitle}</div>` : ''}
    </div>
  `;
  document.body.appendChild(ov);
  vibrate([80, 40, 80, 40, 160]);
  gsap.fromTo(ov, { opacity: 0 }, { opacity: 1, duration: 0.3 });
  gsap.fromTo(ov.querySelector('.epic-title'), { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, delay: 0.15, ease: 'elastic.out(1, 0.55)' });
  if (subtitle) gsap.fromTo(ov.querySelector('.epic-sub'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, delay: 0.5 });
  spawnBurst(window.innerWidth / 2, window.innerHeight / 2, { count: 26, colors: ['#ffd700', '#ff9f45', '#4cd964', '#45dcff', '#ffffff'] });
  fireworksShow(7, 2600);

  const dismiss = () => { gsap.to(ov, { opacity: 0, duration: 0.4, onComplete: () => ov.remove() }); };
  ov.addEventListener('click', dismiss, { once: true });
  setTimeout(dismiss, 3400);
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

// Si lo guardado está corrupto (JSON inválido), se arranca de cero en vez de
// dejar el juego muerto en pantalla negra (el error aquí ocurría antes del
// try/catch del arranque, así que ni siquiera se veía el aviso de recarga).
let stats = (() => {
  try { return JSON.parse(localStorage.getItem('colorGameStats')); }
  catch (_) { return null; }
})() || {
  bestScore: 0,
  gamesPlayed: 0,
  streak: 0,
  lastPlayDate: null,
  dailyPlayed: {},
  history: [],
  ink: 0
};
// Solo en "npm run dev" local (ver saveStats()): se aplica también aquí, al
// cargar, porque la pantalla principal lee stats.ink antes de que se llame
// a saveStats() por primera vez — si no, se veía el valor viejo hasta la
// primera acción que guardase.
if (import.meta.env.DEV) stats.ink = Math.max(stats.ink || 0, 999999);
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
if (stats.permHintBoost === undefined) stats.permHintBoost = false;
if (stats.permTimeBoost === undefined) stats.permTimeBoost = false;
if (stats.permRetryBoost === undefined) stats.permRetryBoost = false;
if (stats.permInkBoost === undefined) stats.permInkBoost = false;
if (stats.permXpBoost === undefined) stats.permXpBoost = false;
if (!stats.unlockedAch) stats.unlockedAch = {};   // logros: id → fecha de desbloqueo
if (!stats.c) stats.c = {};                       // contadores acumulados para logros
if (stats.seasonId === undefined) stats.seasonId = null;
if (stats.seasonPoints === undefined) stats.seasonPoints = 0;
if (!stats.seasonClaimedTiers) stats.seasonClaimedTiers = [];
if (stats.dailyReminderEnabled === undefined) stats.dailyReminderEnabled = false;
if (stats.playerName === undefined) stats.playerName = '';
if (!stats.unlockedSkins) stats.unlockedSkins = [];
if (stats.activeSkin === undefined) stats.activeSkin = null;
if (!stats.unlockedFrames) stats.unlockedFrames = [];
if (stats.activeFrame === undefined) stats.activeFrame = null;
if (!stats.unlockedCursors) stats.unlockedCursors = [];
if (stats.activeCursor === undefined) stats.activeCursor = null;
if (!stats.unlockedShareFrames) stats.unlockedShareFrames = [];
if (stats.activeShareFrame === undefined) stats.activeShareFrame = null;
if (stats.cursorTrailEnabled === undefined) stats.cursorTrailEnabled = false;

function getXPNeeded(lvl) { return Math.floor(100 * Math.pow(lvl, 1.5)); }

// ── TEMPORADAS / PASE DE BATALLA ────────────────────────────────────────────
// La temporada se calcula a partir de una fecha fija: todos los jugadores
// entran y salen de la misma temporada a la vez sin necesitar servidor.
const SEASON_LENGTH_DAYS = 30;
const SEASON_EPOCH = new Date(2025, 0, 1).getTime();
function getSeasonInfo() {
  const daysSince = Math.max(0, Math.floor((Date.now() - SEASON_EPOCH) / 86400000));
  const seasonNum = Math.floor(daysSince / SEASON_LENGTH_DAYS) + 1;
  const dayInSeason = daysSince % SEASON_LENGTH_DAYS;
  return { seasonNum, seasonId: `S${seasonNum}`, daysLeft: SEASON_LENGTH_DAYS - dayInSeason };
}

// El tema exclusivo de cada temporada se genera a partir de su número: cada
// temporada tiene un tono distinto sin necesitar arte nuevo por temporada.
function getSeasonThemeId(seasonNum) { return `seasonTheme_${(seasonNum * 47) % 360}`; }

function getSeasonTiers(seasonNum) {
  return [
    { threshold: 60,   ink: 60 },
    { threshold: 150,  ink: 90 },
    { threshold: 280,  ink: 130 },
    { threshold: 450,  ink: 170 },
    { threshold: 670,  ink: 220 },
    { threshold: 950,  ink: 280 },
    { threshold: 1300, ink: 350 },
    { threshold: 1730, ink: 430 },
    { threshold: 2250, ink: 520 },
    { threshold: 2900, ink: 300, theme: getSeasonThemeId(seasonNum) },
  ];
}

// Se llama al terminar cada partida: reinicia el progreso si cambió la
// temporada y devuelve los tramos recién desbloqueados (para el aviso).
function checkSeasonTiers(earnedSeasonPts) {
  const { seasonNum, seasonId } = getSeasonInfo();
  if (stats.seasonId !== seasonId) {
    stats.seasonId = seasonId;
    stats.seasonPoints = 0;
    stats.seasonClaimedTiers = [];
  }
  stats.seasonPoints = (stats.seasonPoints || 0) + earnedSeasonPts;

  const tiers = getSeasonTiers(seasonNum);
  const claimed = stats.seasonClaimedTiers || (stats.seasonClaimedTiers = []);
  const newlyClaimed = [];
  tiers.forEach((tier, i) => {
    if (claimed.includes(i) || stats.seasonPoints < tier.threshold) return;
    claimed.push(i);
    stats.ink = (stats.ink || 0) + tier.ink;
    if (tier.theme) {
      stats.unlockedThemes = [...(stats.unlockedThemes || []), tier.theme];
      stats.activeTheme = tier.theme; // recompensa final: se equipa al instante, como al comprar en la tienda
      updateAuroraColors();
      epicCelebration('🎉 ¡PASE DE TEMPORADA COMPLETADO!', `Temporada S${seasonNum} · Tema exclusivo desbloqueado y equipado`);
    }
    newlyClaimed.push({ tier: i, ...tier });
  });
  return newlyClaimed;
}

function saveStats() {
  // Solo en "npm run dev" local: Vite inyecta import.meta.env.DEV=false en
  // cualquier build de producción (lo que corre en Vercel), así que esto
  // nunca existe en la web pública ni es activable por otros jugadores.
  if (import.meta.env.DEV) stats.ink = Math.max(stats.ink || 0, 999999);
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
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPowerMode = prefersReducedMotion;

// ── Ajustes de rendimiento ────────────────────────────────────────────────────
// Modo "Auto" (por defecto): un gobernador mide los FPS reales y sube o baja
// el nivel de detalle solo, de forma invisible — cada dispositivo recibe el
// máximo que aguanta sin que nadie tenga que tocar ajustes. Los controles
// manuales siguen existiendo para quien quiera fijarlo a mano.
// FILOSOFÍA: la CALIDAD (cristal, brillos, luz ambiental, temas) va SIEMPRE
// al máximo en todos los niveles. Lo único que el gobernador flexibiliza es
// la DENSIDAD de partículas de fondo/explosiones — algo que nadie percibe
// como "menos calidad", solo como "menos puntitos". El último nivel es una
// salida de emergencia (solo si el aparato no llega ni a 30 fps) que apaga
// únicamente el desenfoque de cristal, el efecto más caro y el que menos se
// nota: las tarjetas son 97% opacas.
const AUTO_LEVELS = [
  { particles: 'ultra', ambilight: true, glow: true, blur: true  },
  { particles: 'high',  ambilight: true, glow: true, blur: true  },
  { particles: 'low',   ambilight: true, glow: true, blur: true  },
  { particles: 'low',   ambilight: true, glow: true, blur: false }, // emergencia
];
function startLevel() {
  // TODO el mundo arranca al máximo, también en móvil: el gobernador recorta
  // densidad en segundos solo si hace falta de verdad.
  return 0;
}
function defaultPerf() {
  // Los campos manuales solo se usan si el jugador desactiva el Auto.
  return { auto: true, level: startLevel(), particles: 'ultra', ambilight: true, glow: true, blur: true };
}
let perfSettings = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem('colorGamePerf'));
    if (saved && typeof saved === 'object') {
      // Ajustes guardados con el formato viejo (sin "auto"): venían de tocar
      // los ajustes a mano, así que se respetan como modo manual.
      const s = Object.assign(defaultPerf(), { auto: false }, saved);
      // En Auto, cada visita arranca de nuevo al máximo: la calibración es
      // cuestión de segundos y así nadie se queda "atrapado" en un nivel
      // bajo por un mal día del dispositivo.
      if (s.auto) s.level = startLevel();
      return s;
    }
  } catch (_) {}
  return defaultPerf();
})();
function effPerf() {
  if (!perfSettings.auto) return perfSettings;
  const lvl = Math.max(0, Math.min(AUTO_LEVELS.length - 1, perfSettings.level ?? 0));
  return AUTO_LEVELS[lvl];
}
// Cuántas partículas sueltan los efectos puntuales (explosiones, confeti…)
// según el nivel de detalle actual: más chispas donde el equipo va sobrado.
function burstScale() {
  const p = effPerf().particles;
  return p === 'ultra' ? 1.6 : p === 'high' ? 1.1 : p === 'low' ? 0.8 : 0.6;
}
function savePerf() { localStorage.setItem('colorGamePerf', JSON.stringify(perfSettings)); }
function applyPerf() {
  const p = effPerf();
  document.body.classList.toggle('perf-no-blur', !p.blur);
  document.body.classList.toggle('perf-no-aurora', !p.ambilight);
  initParticles();
  ensureParticleLoop();
  // Ocultar/mostrar ambilight existente según ajuste
  const ambi = document.getElementById('ambilight');
  if (ambi && !p.ambilight) ambi.style.background = 'transparent';
}
function getPreset() {
  const p = perfSettings;
  if (p.auto) return 'auto';
  if (p.particles === 'none' && !p.ambilight && !p.glow && !p.blur) return 'perf';
  if (p.particles === 'low'  && !p.ambilight && !p.glow && !p.blur) return 'bal';
  if (p.particles === 'high' &&  p.ambilight &&  p.glow &&  p.blur) return 'quality';
  return 'custom';
}

// ── GOBERNADOR DE FPS ────────────────────────────────────────────────────────
// Cuenta frames en ventanas de 2s. Si el dispositivo no llega a ~46 fps baja
// un nivel de detalle al instante; si va sobrado (58+) durante un buen rato,
// sube uno. Si una subida provoca bajón enseguida, ese nivel se marca como
// "demasiado" y no se vuelve a intentar en esta sesión (evita el parpadeo
// de subir-bajar-subir en equipos justos).
let fpsFrames = 0, fpsWindowStart = performance.now();
let fpsGoodStreak = 0, fpsLastClimb = 0, fpsClimbCap = 0;
let fpsWarmup = true; // la 1ª ventana se descarta: la carga inicial da FPS falsos
function fpsGovernor(now) {
  requestAnimationFrame(fpsGovernor);
  if (document.hidden || !perfSettings.auto || prefersReducedMotion) {
    fpsFrames = 0; fpsWindowStart = now;
    return;
  }
  fpsFrames++;
  const elapsed = now - fpsWindowStart;
  if (elapsed < 2000) return;
  const fps = fpsFrames * 1000 / elapsed;
  fpsFrames = 0; fpsWindowStart = now;
  if (fpsWarmup) { fpsWarmup = false; return; }

  const lvl = Math.max(0, Math.min(AUTO_LEVELS.length - 1, perfSettings.level ?? 0));
  // Bajar de densidad es barato y reversible (fps<46). Entrar en el nivel de
  // emergencia (apagar el cristal) exige un aparato realmente ahogado: <30.
  const dropThreshold = (lvl === AUTO_LEVELS.length - 2) ? 30 : 46;
  if (fps < dropThreshold && lvl < AUTO_LEVELS.length - 1) {
    if (now - fpsLastClimb < 25000) fpsClimbCap = Math.max(fpsClimbCap, lvl + 1);
    perfSettings.level = lvl + 1;
    fpsGoodStreak = 0;
    savePerf(); applyPerf();
  } else if (fps >= 58 && lvl > 0 && lvl - 1 >= fpsClimbCap) {
    fpsGoodStreak++;
    if (fpsGoodStreak >= 6) {
      perfSettings.level = lvl - 1;
      fpsGoodStreak = 0;
      fpsLastClimb = now;
      savePerf(); applyPerf();
    }
  } else {
    fpsGoodStreak = 0;
  }
}
requestAnimationFrame(fpsGovernor);

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

// Multiplicador de Tinta/XP por racha de rondas >=9.0 mantenida hasta el
// final de la partida. G.combo se resetea en submitGuess() ante cualquier
// ronda floja, así que llegar con racha viva a buildFinal() ya implica
// haber terminado la partida sin fallar: por eso "doble"/"triple" solo
// premian si aciertas MUCHO y aguantas hasta el último color.
const STREAK_MULTS = [
  [5, 3,    '🌈 RACHA PERFECTA'],
  [4, 2,    '🔥🔥 RACHA x2'],
  [3, 1.5,  '🔥 RACHA x1.5'],
  [2, 1.15, 'Racha x1.15'],
  [0, 1,    ''],
];
function getStreakMult(combo) { return (STREAK_MULTS.find(([m]) => combo >= m) ?? STREAK_MULTS.at(-1)); }

function hueDelta(a, b) {
  return Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function getRoundBreakdown(target, guess) {
  const hDiff = hueDelta(target.h, guess.h);
  const sDiff = Math.abs(target.s - guess.s);
  const vDiff = Math.abs(target.v - guess.v);
  return [
    { label: 'Tono', short: 'H', diff: `${Math.round(hDiff)} deg`, score: clamp01(1 - hDiff / 180) },
    { label: 'Saturacion', short: 'S', diff: `${sDiff}`, score: clamp01(1 - sDiff / 100) },
    { label: 'Brillo', short: 'B', diff: `${vDiff}`, score: clamp01(1 - vDiff / 100) },
  ];
}

function getRoundTip(parts) {
  const weakest = [...parts].sort((a, b) => a.score - b.score)[0];
  if (!weakest || weakest.score > 0.86) return 'Muy fino: pequenos matices te separan del 10.';
  if (weakest.short === 'H') return 'Tu memoria fallo mas en el tono.';
  if (weakest.short === 'S') return 'La saturacion fue lo que mas se alejo.';
  return 'El brillo fue el mayor desvio.';
}

function getDailyPalette(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
  }
  const rand = mulberry32(hash);
  return Array.from({ length: 5 }, () => ({
    h: Math.floor(rand() * 360),
    s: Math.floor(55 + rand() * 40),
    v: Math.floor(45 + rand() * 40),
  }));
}

function getDailyFocus(playedToday) {
  if (playedToday >= 9) return { done: true, title: 'Perfecto diario', sub: 'Hoy ya dejaste una marca dificil de superar.' };
  if (playedToday >= 7) return { done: true, title: 'Racha caliente', sub: `Diario completado con ${playedToday.toFixed(2)}.` };
  if (stats.streak >= 3) return { done: false, title: 'Defiende la racha', sub: `${stats.streak} dias seguidos. El diario te espera.` };
  if ((stats.bestScore || 0) >= 8) return { done: false, title: 'Busca el 9+', sub: 'Un color perfecto puede cambiar la partida.' };
  return { done: false, title: 'Objetivo 7.00', sub: 'Supera la media y gana ritmo de recompensas.' };
}

function getSessionAwards(avg, perfects, bestRound, numRounds) {
  const awards = [];
  if (bestRound >= 9.5) awards.push({ tone: 'gold', label: 'Color perfecto', value: `${bestRound.toFixed(2)}` });
  if (perfects >= 2) awards.push({ tone: 'rainbow', label: 'Doble acierto', value: `${perfects} rondas` });
  if (avg >= 8.5) awards.push({ tone: 'green', label: 'Ojo fino', value: `${avg.toFixed(2)}` });
  if (G.combo >= 2) awards.push({ tone: 'fire', label: 'Combo vivo', value: `x${G.combo}` });
  if (G.mode === 'survival' && numRounds >= 8) awards.push({ tone: 'blue', label: 'Superviviente', value: `${numRounds} rondas` });
  if (G.mode === 'timed') awards.push({ tone: 'blue', label: 'Contrarreloj', value: `${numRounds} ${numRounds === 1 ? 'color' : 'colores'} en 60s` });
  if (!awards.length) awards.push({ tone: 'dim', label: 'Siguiente meta', value: '+7.00' });
  return awards;
}

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
let lastPickerPaint = { h: null, s: null, v: null, blind: null };

// -- URL Challenge parsing --
const urlParams = new URLSearchParams(window.location.search);
const _rawSeed = urlParams.get('reto') || '';
let challengeSeed = _rawSeed.replace(/[^a-zA-Z0-9_\-.]/g, '').slice(0, 64);
let challengeMode = challengeSeed.length > 0;
let challengeDiffIdx = Math.max(0, Math.min(DIFFS.length - 1, parseInt(urlParams.get('diff')) || 0));
// Puntuación del retador incrustada en el enlace: convierte "jugar los mismos
// colores" en un duelo de verdad (ganas/pierdes contra un número concreto),
// en vez de solo compartir texto suelto que la app no podía verificar.
const _rawTargetScore = parseFloat(urlParams.get('score'));
let challengeTargetScore = Number.isFinite(_rawTargetScore) ? Math.max(0, Math.min(10, _rawTargetScore)) : null;

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
  if (nameEl) nameEl.textContent = d.label;
  document.querySelectorAll('.diff-dot').forEach((dot, i) => {
    dot.classList.toggle('on', i <= diffIdx);
  });
  gsap.fromTo('#diff-chip', { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(2.5)' });
}

// ── SETTINGS SCREEN ──────────────────────────────────────────────────────────

function buildSettings() {
  const el = document.createElement('div');
  el.className = 'card settings-card custom-scrollbar';

  const PRESETS = {
    perf:    { particles: 'none', ambilight: false, glow: false, blur: false },
    bal:     { particles: 'low',  ambilight: false, glow: false, blur: false },
    quality: { particles: 'high', ambilight: true,  glow: true,  blur: true  },
  };

  function renderUI() {
    const cur = getPreset();
    el.innerHTML = `
      <div class="shop-header">
        <div class="shop-title">Ajustes</div>
        <button id="btn-settings-close" class="btn-icon-close" aria-label="Cerrar">&times;</button>
      </div>

      <div style="padding:0 4px;">
        <div class="shop-section-title" style="margin-bottom:8px;">⚡ Calidad gráfica</div>
        <div class="preset-row">
          <button class="preset-btn${cur==='auto'    ? ' active':''}" id="preset-auto">🤖<br>Auto</button>
          <button class="preset-btn${cur==='perf'    ? ' active':''}" id="preset-perf">🚀<br>Rendim.</button>
          <button class="preset-btn${cur==='bal'     ? ' active':''}" id="preset-bal">⚖️<br>Equilib.</button>
          <button class="preset-btn${cur==='quality' ? ' active':''}" id="preset-quality">✨<br>Calidad</button>
        </div>
        <div class="setting-desc" style="margin-top:8px; line-height:1.5;">
          <b style="color:#8ce0ff;">Auto (recomendado):</b> calidad SIEMPRE al máximo. El juego mide tu
          fluidez real y, si hiciera falta, solo regula la cantidad de partículas de fondo
          — nunca los efectos, brillos ni detalles. No hace falta tocar nada.
        </div>
      </div>

      <div class="shop-section-title" style="margin-top:4px;">🎨 Detalle manual</div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Partículas de fondo</div>
          <div class="setting-desc">Puntos animados que flotan en el fondo</div>
        </div>
        <div class="seg-ctrl">
          <button class="seg-btn${!perfSettings.auto && perfSettings.particles==='none' ?' active':''}" data-key="particles" data-val="none">0</button>
          <button class="seg-btn${!perfSettings.auto && perfSettings.particles==='low'  ?' active':''}" data-key="particles" data-val="low">Pocas</button>
          <button class="seg-btn${!perfSettings.auto && perfSettings.particles==='high' ?' active':''}" data-key="particles" data-val="high">Muchas</button>
          <button class="seg-btn${!perfSettings.auto && perfSettings.particles==='ultra'?' active':''}" data-key="particles" data-val="ultra">Ultra</button>
        </div>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Luz ambiental</div>
          <div class="setting-desc">Brillo de fondo al seleccionar colores</div>
        </div>
        <button class="toggle-pill${effPerf().ambilight?' on':''}" data-key="ambilight" aria-label="Luz ambiental"></button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Sombras y brillo</div>
          <div class="setting-desc">Glow dinámico en el selector de color</div>
        </div>
        <button class="toggle-pill${effPerf().glow?' on':''}" data-key="glow" aria-label="Sombras"></button>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Efectos de cristal</div>
          <div class="setting-desc">Desenfoque en botones y diálogos</div>
        </div>
        <button class="toggle-pill${effPerf().blur?' on':''}" data-key="blur" aria-label="Cristal"></button>
      </div>

      <div class="shop-section-title" style="margin-top:8px;">🔔 Notificaciones</div>
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Recordatorio de racha diaria</div>
          <div class="setting-desc">Aviso si no has jugado el Desafío Diario. Solo funciona en Chrome/Android con la app instalada; en otros navegadores no llegará con la app cerrada.</div>
        </div>
        <button id="btn-reminder-toggle" class="toggle-pill${stats.dailyReminderEnabled ? ' on' : ''}" aria-label="Recordatorio diario"></button>
      </div>

      <div class="shop-section-title" style="margin-top:8px;">✨ Extras</div>
      <div class="setting-row">
        <div class="setting-info">
          <div class="setting-name">Estela de cursor</div>
          <div class="setting-desc">Partículas siguiendo tu ratón por toda la app. Solo escritorio.</div>
        </div>
        <button id="btn-trail-toggle" class="toggle-pill${stats.cursorTrailEnabled ? ' on' : ''}" aria-label="Estela de cursor"></button>
      </div>

      <button id="btn-settings-reset" style="padding:12px; border-radius:12px; border:1px solid #2a2a2a; background:#111; color:#555; font-size:0.78rem; font-weight:700; cursor:pointer; transition:all 0.15s; touch-action:manipulation; width:100%;">
        Restaurar valores por defecto del dispositivo
      </button>
    `;

    document.getElementById('btn-settings-close').addEventListener('click', () => {
      playClick();
      gsap.to(el, { y: 40, opacity: 0, scale: 0.97, duration: 0.25, ease: 'power2.in',
        onComplete: () => { el.remove(); buildStart(); } });
    });

    // Cualquier ajuste manual desactiva el Auto, partiendo de lo que el Auto
    // tenía puesto en ese momento (así el cambio es exactamente el que se ve).
    function goManual() {
      if (!perfSettings.auto) return;
      Object.assign(perfSettings, effPerf());
      perfSettings.auto = false;
    }

    document.getElementById('preset-auto').addEventListener('click', () => {
      playClick();
      perfSettings.auto = true;
      savePerf(); applyPerf();
      renderUI();
    });

    ['perf','bal','quality'].forEach(id => {
      document.getElementById(`preset-${id}`).addEventListener('click', () => {
        playClick();
        perfSettings.auto = false;
        Object.assign(perfSettings, PRESETS[id]);
        savePerf(); applyPerf();
        renderUI();
      });
    });

    el.querySelectorAll('.seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        playClick();
        goManual();
        perfSettings[btn.dataset.key] = btn.dataset.val;
        savePerf(); applyPerf();
        renderUI();
      });
    });

    el.querySelectorAll('.toggle-pill[data-key]').forEach(pill => {
      pill.addEventListener('click', () => {
        playClick();
        goManual();
        perfSettings[pill.dataset.key] = !perfSettings[pill.dataset.key];
        savePerf(); applyPerf();
        renderUI();
      });
    });

    document.getElementById('btn-reminder-toggle').addEventListener('click', async () => {
      playClick();
      if (stats.dailyReminderEnabled) {
        disableDailyReminder();
        renderUI();
        return;
      }
      const ok = await enableDailyReminder();
      if (!ok) {
        const btn = document.getElementById('btn-reminder-toggle');
        if (btn) {
          const desc = btn.closest('.setting-row').querySelector('.setting-desc');
          const orig = desc.textContent;
          desc.textContent = 'Permiso de notificaciones denegado por el navegador.';
          desc.style.color = '#ff6b6b';
          setTimeout(() => { desc.textContent = orig; desc.style.color = ''; }, 3000);
        }
        return;
      }
      renderUI();
    });

    document.getElementById('btn-trail-toggle').addEventListener('click', () => {
      playClick();
      stats.cursorTrailEnabled = !stats.cursorTrailEnabled;
      saveStats();
      renderUI();
    });

    document.getElementById('btn-settings-reset').addEventListener('click', () => {
      playClick();
      Object.assign(perfSettings, defaultPerf());
      savePerf(); applyPerf();
      renderUI();
    });
  }

  // La tarjeta debe estar en el documento ANTES de renderUI():
  // sus listeners se buscan con document.getElementById y fallaban en frío.
  app.appendChild(el);
  renderUI();
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
}

// ── HOME BUTTON & QUIT CONFIRM ────────────────────────────────────────────────

let homeBtn = null;

function showHomeBtn() {
  if (homeBtn) return;
  homeBtn = document.createElement('button');
  homeBtn.className = 'btn-home-game';
  homeBtn.setAttribute('aria-label', 'Volver al menú principal');
  homeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  document.body.appendChild(homeBtn);
  gsap.fromTo(homeBtn, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)' });
  homeBtn.addEventListener('click', showQuitConfirm);
}

function hideHomeBtn() {
  if (!homeBtn) return;
  const btn = homeBtn;
  homeBtn = null;
  gsap.to(btn, { scale: 0, opacity: 0, duration: 0.2, ease: 'power2.in', onComplete: () => btn.remove() });
}

function showQuitConfirm() {
  playClick();
  const overlay = document.createElement('div');
  overlay.className = 'quit-overlay';
  overlay.innerHTML = `
    <div class="quit-dialog" id="quit-dialog">
      <div class="quit-title">¿Salir?</div>
      <div class="quit-sub">Perderás el progreso<br>de esta partida</div>
      <div class="quit-btns">
        <button class="quit-btn-yes" id="quit-yes">Salir al menú</button>
        <button class="quit-btn-no"  id="quit-no">Seguir jugando</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.18 });
  gsap.fromTo('#quit-dialog', { scale: 0.85, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.32, ease: 'back.out(2)' });

  document.getElementById('quit-no').addEventListener('click', () => {
    playClick();
    gsap.to(overlay, { opacity: 0, duration: 0.18, onComplete: () => overlay.remove() });
  });

  document.getElementById('quit-yes').addEventListener('click', () => {
    if (timerIv !== null) { clearInterval(timerIv); timerIv = null; }
    stopTimedHUD();
    if (dragCtrl) { dragCtrl.abort(); dragCtrl = null; }
    gsap.killTweensOf('*');
    app.innerHTML = '';
    const ambi = document.getElementById('ambilight');
    if (ambi) ambi.remove();
    document.querySelector('.combo-popup')?.remove();
    overlay.remove();
    hideHomeBtn();
    buildStart();
  });
}

// ── START SCREEN ─────────────────────────────────────────────────────────────

function buildStart() {
  const el = document.createElement('div');
  el.className = 'card start-card';

  if (challengeMode) {
    const targetHtml = challengeTargetScore !== null
      ? `<div class="duel-target-score">Puntuación a superar<br><strong>${challengeTargetScore.toFixed(2)}</strong> / 10</div>`
      : '';
    el.innerHTML = `
      <div class="title-row"><span class="title-letter">R</span><span class="title-letter">e</span><span class="title-letter">t</span><span class="title-letter">o</span></div>
      <div class="rank-badge" style="background: rgba(255,50,50,0.15); border-color: rgba(255,50,50,0.4); color: #ff8888;">⚔️ Has sido retado</div>
      <div class="stats-row" style="display:block; text-align:center; padding: 12px; color:#aaa; font-size:0.85rem;">
        Alguien te ha desafiado a superar su puntuación con sus mismos colores exactos.<br><br>Dificultad: <b style="color:#fff">${DIFFS[challengeDiffIdx].label}</b>
      </div>
      ${targetHtml}
      <div class="actions-col">
        <button class="wide-btn" id="btn-challenge" style="background: linear-gradient(145deg, #007aff, #005bb5); border-color: #007aff; text-align:center;">
          <div class="btn-title">Aceptar Reto</div>
        </button>
        <button class="wide-btn" id="btn-cancel-challenge" style="text-align:center;">
          <div class="btn-title">Ignorar y salir</div>
        </button>
      </div>
    `;
    app.appendChild(el);

    document.getElementById('btn-challenge').addEventListener('click', () => {
      diffIdx = challengeDiffIdx;
      let started = false;
      const goToGame = () => {
        if (started) return;
        started = true;
        el.remove();
        buildCountdown(() => startGame('challenge'));
      };
      setTimeout(goToGame, 600); // red de seguridad, igual que en los botones de modo
      gsap.to(el, { y: -28, opacity: 0, scale: 0.97, duration: 0.3, ease: 'power2.in', onComplete: goToGame });
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
  const trophySVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
  const gearSVG = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;

  const letters = 'color'.split('').map(l => `<span class="title-letter">${l}</span>`).join('');
  
  const today = getTodayStr();
  const playedToday = stats.dailyPlayed[today];
  const activeTitleItem = stats.activeTitle ? SHOP_ITEMS.find(i => i.id === stats.activeTitle) : null;
  const userRank = activeTitleItem?.titleText || (stats.gamesPlayed > 0 ? getRank(stats.bestScore) : '🌱 Novato');
  const activePowerUps = ['extraHints','extraTime','extraRetry','inkMultiplierGames','xpMultiplierGames','streakShield'].filter(k => (stats[k] || 0) > 0).length;
  const dailyPalette = getDailyPalette(today);
  const focus = getDailyFocus(playedToday);
  const dailyPaletteHtml = dailyPalette
    .map(c => `<span class="daily-palette-swatch" style="background:${hsvToCss(c.h, c.s, c.v)}"></span>`)
    .join('');
  
  // Novedad: El modo diario se bloquea a un solo intento solo si el jugador ya conoce el juego (>5 partidas)
  const isDailyLocked = (stats.gamesPlayed >= 5) && (playedToday !== undefined);

  el.innerHTML = `
    <div class="ink-badge" style="position:absolute; top:24px; left:24px;" title="Gotas de Tinta" ${stats.activeFrame ? `data-frame="${stats.activeFrame}"` : ''}>
      <span class="ink-drop">💧</span> ${Math.floor(stats.ink || 0)}
      ${import.meta.env.DEV ? '<span style="margin-left:5px; color:#4cd964; font-size:0.6rem; font-weight:900;">DEV</span>' : ''}
    </div>
    <div style="position:absolute; top:24px; right:24px; text-align:right;">
      <div style="font-size:0.7rem; color:#888; font-weight:900; margin-bottom:4px;">NIVEL ${stats.level}</div>
      <div style="width:80px; height:6px; background:rgba(255,255,255,0.1); border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.05);">
        <div class="xp-fill" style="width:${(stats.xp / getXPNeeded(stats.level) * 100).toFixed(0)}%; height:100%; background:linear-gradient(90deg, #4cd964, #aaffaa); box-shadow:0 0 10px rgba(76,217,100,0.5);"></div>
      </div>
    </div>
    <button id="btn-history" class="btn-icon" style="position:absolute; top:56px; right:24px;" title="Muro de Historial" aria-label="Historial de partidas">${wallSVG}</button>
    <button id="btn-ach" class="btn-icon" style="position:absolute; top:92px; right:24px;" title="Logros" aria-label="Logros">${trophySVG}</button>
    <button id="btn-stats" class="btn-icon" style="position:absolute; top:128px; right:24px; font-size:1.15rem;" title="Estadísticas y Entrenamiento" aria-label="Estadísticas y Entrenamiento">📊</button>
    <button id="btn-shop" class="btn-icon${activePowerUps > 0 ? ' btn-icon--badge' : ''}" style="position:absolute; top:56px; left:24px;" title="Tienda de Tinta" aria-label="Abrir tienda">${shopSVG}${activePowerUps > 0 ? `<span class="shop-badge">${activePowerUps}</span>` : ''}</button>
    <button id="btn-season" class="btn-icon" style="position:absolute; top:92px; left:24px; font-size:1.15rem;" title="Pase de Temporada" aria-label="Pase de Temporada">🎟️</button>
    <button id="btn-leaderboard" class="btn-icon" style="position:absolute; top:128px; left:24px; font-size:1.15rem;" title="Clasificación de Hoy" aria-label="Clasificación de Hoy">🏅</button>
    <div class="title-row">${letters}</div>
    <div class="daily-palette" aria-hidden="true">${dailyPaletteHtml}</div>
    <div class="rank-badge${stats.activeTitle === 'chromatico' ? ' rank-badge--rainbow' : ''}" title="Basado en tu Mejor Puntuación">${userRank}</div>
    <div class="stats-row">
      <div class="stat"><div class="stat-val">${stats.bestScore.toFixed(2)}</div><div class="stat-lbl">Mejor</div></div>
      <div class="stat"><div class="stat-val">${stats.gamesPlayed}</div><div class="stat-lbl">Partidas</div></div>
      <button class="stat stat-btn${stats.streak >= 30 ? ' streak-tier-3' : stats.streak >= 7 ? ' streak-tier-2' : stats.streak >= 3 ? ' streak-tier-1' : ''}" id="btn-calendar" title="Ver calendario del Desafío Diario" aria-label="Calendario del Desafío Diario"><div class="stat-val">${stats.streak}</div><div class="stat-lbl">Racha 🔥</div></button>
    </div>
    <div class="focus-card${focus.done ? ' done' : ''}">
      <div class="focus-kicker">${focus.done ? 'Completado hoy' : 'Objetivo de hoy'}</div>
      <div class="focus-title">${focus.title}</div>
      <div class="focus-sub">${focus.sub}</div>
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
          ${DIFFS.map((_, i) => `<span class="diff-dot${i <= diffIdx ? ' on' : ''}"></span>`).join('')}
        </div>
        <span class="diff-name" id="diff-name">${DIFFS[diffIdx].label}</span>
      </div>

      <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
        <button class="action-btn play daily" id="btn-daily" title="${playedToday !== undefined ? 'Puntuación: ' + playedToday.toFixed(2) : 'Desafío Diario'}" ${isDailyLocked ? 'style="opacity:0.4; cursor:not-allowed;" aria-disabled="true" data-locked="true"' : ''}>
          <div class="btn-rainbow-overlay"></div>${calendarSVG}
        </button>
        ${isDailyLocked ? '<div id="daily-countdown" style="position:absolute; bottom:-20px; font-size:0.6rem; color:#888; white-space:nowrap; font-weight:700;"></div>' : ''}
      </div>

      <button class="action-btn play" id="btn-timed" title="Contrarreloj: ¿cuántos colores aciertas en 60 segundos?">
        <div class="btn-rainbow-overlay"></div><span style="font-size:1.4rem; position:relative; z-index:1;">⏱️</span>
      </button>

      <button class="action-btn play" id="btn-zen" title="Modo Zen: sin tiempo, sin presión">
        <div class="btn-rainbow-overlay"></div><span style="font-size:1.4rem; position:relative; z-index:1;">🧘</span>
      </button>

      <button class="action-btn play" id="btn-inverse" title="Modo Inverso: te damos el nombre, tú creas el color">
        <div class="btn-rainbow-overlay"></div><span style="font-size:1.4rem; position:relative; z-index:1;">🔤</span>
      </button>
    </div>
    <div style="text-align:center; margin-top:14px;">
      <button class="btn-icon" id="btn-settings" style="display:inline-flex; align-items:center; gap:5px; font-size:0.72rem; color:#444; padding:6px 10px; border-radius:8px;" aria-label="Ajustes de rendimiento">
        ${gearSVG} Ajustes
      </button>
    </div>
  `;
  app.appendChild(el);

  // El logo cae con rebote antes de que arranque su animación ambiental de
  // flotar/arcoíris (que ya tenía un delay de 1.2s+ integrado en el CSS):
  // termina de rebotar y justo entonces el CSS toma el relevo sin pisarse.
  if (!prefersReducedMotion) {
    gsap.from('.title-letter', {
      y: -70, opacity: 0, rotation: () => gsap.utils.random(-20, 20),
      duration: 0.55, stagger: 0.07, ease: 'bounce.out',
    });
  }

  const stopTaglines = startTaglines();

  document.getElementById('btn-history').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildHistory();
  });

  document.getElementById('btn-ach').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildAchievements();
  });

  document.getElementById('btn-stats').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildStatsScreen();
  });

  document.getElementById('btn-calendar').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildCalendar();
  });

  document.getElementById('btn-shop').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildShop();
  });

  document.getElementById('btn-season').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildSeasonPass();
  });

  document.getElementById('btn-leaderboard').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildLeaderboard();
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    playClick();
    el.remove(); stopTaglines();
    buildSettings();
  });

  document.getElementById('diff-chip').addEventListener('click', (e) => {
    playClick();
    cycleDiff();
    const r = e.currentTarget.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top + r.height / 2, { count: 6, colors: ['#ffffff', '#ffd93d'] });
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

  // Card shake + grietas + explosión + reconstrucción al pasar el ratón por
  // un botón de modo. Durante 10s de temblor creciente se van dibujando
  // grietas de verdad (SVG) sobre la tarjeta; al llegar al pico, explota
  // (implosiona + trozos + partículas) y se reconstruye en 3s completos con
  // rebote. Si el ratón se va en cualquier momento, se corta todo al
  // instante (nada se queda roto en pantalla).
  let shakeTween = null;
  let crackSvg = null;
  let revealedCracks = 0;
  // Todos los setTimeout de la secuencia de explosión/reconstrucción viven
  // aquí para poder cancelarlos de golpe si el ratón se va a media secuencia
  // (si no, disparaban ráfagas/destellos sueltos sobre una tarjeta ya
  // restaurada, o incluso sobre una secuencia nueva empezada después).
  let pendingTimeouts = [];
  function schedule(fn, ms) {
    const id = setTimeout(() => { pendingTimeouts = pendingTimeouts.filter(t => t !== id); fn(); }, ms);
    pendingTimeouts.push(id);
    return id;
  }
  function clearPendingTimeouts() {
    pendingTimeouts.forEach(id => clearTimeout(id));
    pendingTimeouts = [];
  }

  const CRACK_PATHS = [
    'M50,48 L38,30 L28,10', 'M50,48 L65,25 L80,8',
    'M50,48 L20,55 L2,68',  'M50,48 L82,58 L98,72',
    'M50,48 L46,80 L40,100', 'M50,48 L58,82 L64,102',
    'M38,30 L48,15',        'M65,25 L58,10',
    'M20,55 L12,38',        'M82,58 L90,42',
    'M46,80 L30,90',        'M58,82 L74,92',
  ];

  function ensureCrackOverlay() {
    if (crackSvg) return crackSvg;
    el.style.position = 'relative'; // para que el SVG se alinee con la propia tarjeta
    crackSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    crackSvg.setAttribute('viewBox', '0 0 100 100');
    crackSvg.setAttribute('preserveAspectRatio', 'none');
    crackSvg.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:40; overflow:visible;';
    crackSvg.innerHTML = CRACK_PATHS.map((d, i) =>
      `<path data-crack="${i}" d="${d}" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="0.6" stroke-linecap="round" style="filter:drop-shadow(0 0 3px rgba(255,255,255,0.85));"/>`
    ).join('');
    el.appendChild(crackSvg);
    crackSvg.querySelectorAll('path').forEach(p => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = String(len);
      p.style.strokeDashoffset = String(len);
    });
    revealedCracks = 0;
    return crackSvg;
  }

  function revealCracksUpTo(fraction) {
    if (!crackSvg) return;
    const target = Math.floor(fraction * CRACK_PATHS.length);
    while (revealedCracks < target) {
      const p = crackSvg.querySelector(`[data-crack="${revealedCracks}"]`);
      if (p) {
        gsap.to(p, { strokeDashoffset: 0, duration: 0.22, ease: 'power2.out' });
        playTone(1300 + Math.random() * 500, 'square', 0.05, 0.045);
      }
      revealedCracks++;
    }
  }

  function removeCracks() {
    if (crackSvg) { crackSvg.remove(); crackSvg = null; }
    revealedCracks = 0;
  }

  const resetCardTransform = () => {
    gsap.killTweensOf(el);
    clearPendingTimeouts();
    removeCracks();
    gsap.to(el, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
  };

  function shatterCard() {
    if (!el.isConnected) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    removeCracks(); // las grietas ya cumplieron su función, ahora se rompe de verdad

    playTone(90, 'sawtooth', 0.3, 0.18);
    playTone(55, 'sine', 0.5, 0.22); // sub-grave: el "boom" que se siente en el pecho
    // Cristales cayendo tras el estallido
    [1650, 2100, 1300, 1900].forEach((f, i) => setTimeout(() => playTone(f, 'square', 0.07, 0.035), 130 + i * 85));
    screenFlash('#ffffff', { peak: 0.45, duration: 0.35 });
    shockwave(cx, cy, '#ffffff');
    setTimeout(() => shockwave(cx, cy, '#ffd166'), 90);
    screenShake(document.body, { amp: 14, count: 6 });
    vibrate([40, 20, 60]);

    // Trozos de verdad (no solo puntitos): fragmentos rectangulares que salen
    // despedidos girando desde distintos puntos de la tarjeta (más trozos
    // cuanto más detalle gráfico permita el dispositivo).
    const shardWrap = document.createElement('div');
    shardWrap.style.cssText = 'position:fixed; inset:0; z-index:6500; pointer-events:none;';
    document.body.appendChild(shardWrap);
    const palette = ['#ff416c', '#ffd166', '#4cd964', '#45dcff', '#8b5cf6', '#ffffff'];
    const shards = Array.from({ length: Math.max(7, Math.round(12 * burstScale())) }, () => {
      const sx = rect.left + Math.random() * rect.width;
      const sy = rect.top + Math.random() * rect.height;
      const size = 18 + Math.random() * 30;
      const s = document.createElement('div');
      s.style.cssText = `position:fixed; left:${sx}px; top:${sy}px; width:${size}px; height:${size}px;
        background:${palette[Math.floor(Math.random() * palette.length)]}; opacity:0.92; border-radius:3px;
        box-shadow:0 0 10px rgba(255,255,255,0.3);`;
      shardWrap.appendChild(s);
      return { el: s, ang: Math.random() * Math.PI * 2, dist: 90 + Math.random() * 220 };
    });
    gsap.to(shards.map(s => s.el), {
      x: (i) => Math.cos(shards[i].ang) * shards[i].dist,
      y: (i) => Math.sin(shards[i].ang) * shards[i].dist - 40,
      rotation: () => (Math.random() - 0.5) * 720,
      opacity: 0, duration: 0.9, ease: 'power2.out',
      onComplete: () => shardWrap.remove(),
    });

    // Ráfagas de partículas más pequeñas, repartidas por toda la tarjeta.
    for (let i = 0; i < 5; i++) {
      spawnBurst(rect.left + Math.random() * rect.width, rect.top + Math.random() * rect.height, { count: 14 });
    }

    // Nota: no se toca pointer-events aquí — ponerlo a "none" en la tarjeta
    // mientras el ratón sigue encima del botón dispara mouseleave (dejar de
    // ser el elemento "golpeado" por el cursor cuenta como salir), lo que
    // cancelaría la propia explosión justo al empezar.
    gsap.to(el, {
      opacity: 0, scale: 0.35, rotation: (Math.random() - 0.5) * 50,
      duration: 0.7, ease: 'power2.in',
      onComplete: () => {
        // Pausa real con la tarjeta desaparecida antes de reconstruirse.
        gsap.set(el, { rotation: 0, scale: 0.12 });
        schedule(() => {
          if (!el.isConnected) return;
          // Reconstrucción: primero la energía CONVERGE hacia el centro
          // (implosión de partículas + nota ascendente) y entonces la tarjeta
          // renace en 3 segundos con rebote, chispazos y onda final.
          spawnImplosion(cx, cy, { count: 22, colors: ['#ffffff', '#45dcff', '#ffd166'] });
          playTone(220, 'sine', 0.5, 0.07);
          setTimeout(() => playTone(440, 'sine', 0.4, 0.07), 250);
          spawnBurst(cx, cy, { count: 24, colors: ['#ffffff', '#45dcff', '#ffd166'] });
          gsap.to(el, { opacity: 1, scale: 1, duration: 3, ease: 'elastic.out(1, 0.22)' });
          schedule(() => { spawnImplosion(cx, cy, { count: 14, colors: ['#ff416c', '#4cd964', '#ffffff'] }); spawnBurst(cx, cy, { count: 18, colors: ['#ff416c', '#4cd964', '#ffffff'] }); }, 900);
          schedule(() => {
            screenFlash('#ffffff', { peak: 0.12, duration: 0.3 });
            shockwave(cx, cy, '#45dcff');
            spawnBurst(cx, cy, { count: 26 });
            playTone(880, 'sine', 0.35, 0.08);
          }, 1900);
        }, 700);
      },
    });
  }

  const startShake = () => {
    if (shakeTween) shakeTween.kill();
    removeCracks();
    if (prefersReducedMotion) return; // sin motion: ni temblor ni explosión

    ensureCrackOverlay();
    let intensity = 0;
    const MAX_I = 16;
    const RAMP_DURATION = 7; // segundos de temblor creciente antes de explotar
    const TICK = 0.06;
    const RAMP_STEPS = Math.round(RAMP_DURATION / TICK);
    let step = 0;
    // Multiplicadores bajados a la mitad de lo que eran: con los de antes, en
    // el pico el botón (64px) se desplazaba hasta 22px, lo suficiente para
    // escaparse de debajo de un cursor quieto — eso disparaba un mouseleave
    // "falso" (el ratón no se movió, el botón sí), lo que reseteaba el
    // temblor a medio hacer y hacía que el clic cayera fuera del botón.
    shakeTween = gsap.to(el, {
      x: () => (Math.random() - 0.5) * intensity * 1.3,
      y: () => (Math.random() - 0.5) * intensity * 0.8,
      rotation: () => (Math.random() - 0.5) * intensity * 0.4,
      duration: TICK,
      repeat: RAMP_STEPS - 1,
      repeatRefresh: true,
      ease: 'none',
      force3D: true,
      onRepeat() {
        step++;
        intensity = Math.min(MAX_I, intensity + MAX_I / RAMP_STEPS);
        revealCracksUpTo(step / RAMP_STEPS);
      },
      onComplete: shatterCard,
    });
  };
  const stopShake = () => {
    if (shakeTween) { shakeTween.kill(); shakeTween = null; }
    resetCardTransform();
  };

  // Para el chequeo de "mouseleave falso" de abajo: dónde está el cursor de
  // verdad en cada instante.
  let lastMouseX = -1, lastMouseY = -1;
  window.addEventListener('mousemove', e => { lastMouseX = e.clientX; lastMouseY = e.clientY; }, { passive: true });

  ['btn-daily', 'btn-practice', 'btn-survival', 'btn-timed', 'btn-zen', 'btn-inverse'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const locked = btn.dataset.locked === 'true';
    if (!locked) {
      btn.addEventListener('mouseenter', startShake);
      // No se corta al primer mouseleave: el propio temblor puede apartar el
      // botón de debajo de un cursor que no se ha movido, y eso también
      // cuenta como "salir" para el navegador. Se comprueba un instante
      // después, con la posición real del cursor, si de verdad se fue.
      btn.addEventListener('mouseleave', () => {
        setTimeout(() => {
          const under = document.elementFromPoint(lastMouseX, lastMouseY);
          if (under && (under === btn || btn.contains(under))) return;
          stopShake();
        }, 120);
      });
    }
    btn.addEventListener('click', () => {
      if (locked) {
        playTone(180, 'triangle', 0.12, 0.08);
        const cdEl = document.getElementById('daily-countdown');
        gsap.fromTo(btn, { x: -5 }, { x: 0, duration: 0.08, repeat: 5, yoyo: true, ease: 'none' });
        if (cdEl) {
          gsap.fromTo(cdEl, { scale: 1.35, color: '#fff' }, { scale: 1, color: '#888', duration: 0.45, ease: 'back.out(2)' });
        }
        return;
      }
      const mode = id.replace('btn-', '');

      // Garantía dura: se pase lo que pase con las animaciones de abajo (y
      // hay unas cuantas), la partida arranca sí o sí, como muy tarde a los
      // 600ms del clic. goToGame() está protegida para no ejecutarse dos
      // veces, así que da igual si la dispara el propio tween al terminar
      // o esta red de seguridad — solo la primera cuenta.
      let started = false;
      const goToGame = () => {
        if (started) return;
        started = true;
        el.remove();
        buildCountdown(() => startGame(mode));
      };
      setTimeout(goToGame, 600);

      // Todo lo puramente decorativo va protegido: un fallo aquí no debe
      // poder impedir nunca que goToGame() se dispare.
      try {
        playClick();
        playStartJingle(mode);
        const br = btn.getBoundingClientRect();
        spawnBurst(br.left + br.width / 2, br.top + br.height / 2, { count: 14 });
        const modeColors = { daily: '#ffd166', practice: '#8b5cf6', survival: '#ff4136', timed: '#45dcff', zen: '#4cd964', inverse: '#ff6ec7' };
        portalTransition(modeColors[mode] || '#ffffff');
        document.querySelectorAll('.play').forEach(b => b.style.pointerEvents = 'none');
        stopShake();
        gsap.to(el, { x: 0, y: 0, rotation: 0, duration: 0.1 });
        stopTaglines();
        G.diffSecs = DIFFS[diffIdx].secs;
        gsap.to(el, {
          y: -28, opacity: 0, scale: 0.97,
          duration: 0.3, ease: 'power2.in',
          onComplete: goToGame,
        });
      } catch (_) {
        // Si algo decorativo falla, goToGame() ya está programada por el
        // setTimeout de arriba y arrancará la partida igualmente.
      }
      // El botón bloqueado (diario ya jugado) no usa {once:true}: su única
      // respuesta es el temblor de aviso y debe funcionar en cada clic.
    }, locked ? undefined : { once: true });
  });

  // Entrance
  const letEls = el.querySelectorAll('.title-letter');
  const hues   = [0, 45, 140, 200, 260];
  const animTargets = el.querySelectorAll('.daily-palette, .focus-card, .start-desc, .tagline-box, .action-grid-modern');

  if (prefersReducedMotion) {
    gsap.set(letEls, { opacity: 1 });
    gsap.set(animTargets, { opacity: 1 });
  } else {
    gsap.fromTo(letEls,
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.8)', clearProps: 'transform' }
    );
    gsap.fromTo(animTargets,
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: 'power2.out', delay: 0.22, clearProps: 'transform' }
    );
  }

  if (!prefersReducedMotion) {
    letEls.forEach((l, i) => {
      gsap.to(l, {
        color: `hsl(${hues[i]},85%,65%)`, duration: 0.01, delay: i * 0.07,
        onComplete: () => { gsap.to(l, { color: '#fff', duration: 0.5, delay: 0.15, ease: 'power2.out' }); }
      });
    });
  }
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
      playTone(880, 'sine', 0.15, 0.16);
      setTimeout(() => playTone(1109.73, 'sine', 0.18, 0.14), 45);
      setTimeout(() => playTone(1318.51, 'sine', 0.26, 0.13), 90);
    } else {
      playTone(i === 0 ? 330 : 550, 'sine', 0.13, 0.09);
    }

    gsap.fromTo(we,
      { scale: isLast ? 0.1 : 0.55, opacity: 0, y: isLast ? 0 : 18 },
      { scale: isLast ? 1.15 : 1, opacity: 1, y: 0, duration: isLast ? 0.55 : 0.35, ease: isLast ? 'elastic.out(1.2, 0.4)' : 'back.out(2.2)' }
    );

    if (isLast) {
      gsap.fromTo(el, { scale: 1 }, { scale: 1.05, duration: 0.08, yoyo: true, repeat: 1, ease: 'none' });
      gsap.to(el, { backgroundColor: 'rgba(76,217,100,0.22)', duration: 0.08 });
      gsap.to(el, { backgroundColor: 'rgba(10,10,10,1)', duration: 0.55, delay: 0.08 });
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

  const isInverse = G.mode === 'inverse';
  const isZen = G.mode === 'zen';
  const roundLabel = (G.mode === 'survival' || G.mode === 'timed') ? `Ronda ${G.round + 1}` : `${G.round + 1} / ${ROUNDS}`;

  const el = document.createElement('div');
  el.className = 'card mem-card';
  el.id = 'screen-mem';
  // En Inverso no se enseña el color: se enseña su NOMBRE
  el.style.backgroundColor = isInverse ? '#101016' : hsvToCss(color.h, color.s, color.v);
  el.innerHTML = `
    <span class="mem-round">${roundLabel}</span>
    ${isInverse ? `<div class="inverse-name">${getColorName(color.h, color.s, color.v)}</div><div class="inverse-sub">Recrea este color de memoria</div>` : ''}
    ${isZen ? `
    <button id="zen-ready" class="btn-zen-ready">¡Lo tengo!</button>
    ` : `
    <div class="timer-wrap" id="timer-wrap">
      <svg class="timer-svg" width="190" height="190" viewBox="0 0 190 190">
        <circle class="t-track" cx="95" cy="95" r="${R}"/>
        <circle class="t-fill" id="t-fill" cx="95" cy="95" r="${R}"
          stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="0"/>
      </svg>
      <div class="timer-inner">
        <div class="timer-num" id="timer-num">${Math.ceil(secs)}</div>
        <div class="timer-label">${isInverse ? 'seg. para leerlo' : 'seg. para recordar'}</div>
      </div>
    </div>`}
    ${isInverse ? '' : `<div class="mem-color-name">${getColorName(color.h, color.s, color.v)}</div>`}
    <span class="mem-brand">Color Game</span>
  `;
  app.appendChild(el);
  showHomeBtn();
  playColorReveal(color);

  gsap.fromTo(el,
    { clipPath: 'circle(0% at 50% 50%)', opacity: 0.7 },
    { clipPath: 'circle(150% at 50% 50%)', opacity: 1, duration: 0.6, ease: 'power2.out',
      onComplete: () => { el.style.clipPath = ''; } }
  );
  if (!isZen) {
    gsap.fromTo('#timer-wrap',
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, delay: 0.25, duration: 0.5, ease: 'back.out(1.7)' }
    );
  }

  // Halo pulsante sin animar box-shadow (animarlo repinta toda la tarjeta en
  // cada frame): la sombra vive en una capa hermana fija bajo la tarjeta y
  // solo se anima su opacidad, que la GPU compone gratis.
  let glowEl = null;
  if (!lowPowerMode && !isInverse) {
    glowEl = document.createElement('div');
    glowEl.className = 'mem-glow';
    // hsl() con alfa válido (pegar "66" hex a un hsl() es CSS inválido fuera de GSAP)
    const glowColor = hsvToCss(color.h, color.s, color.v).replace('hsl(', 'hsla(').replace(')', ',0.4)');
    glowEl.style.boxShadow = `0 0 80px ${glowColor}, 0 40px 100px rgba(0,0,0,0.7)`;
    app.insertBefore(glowEl, el);
  }
  const glowTween = glowEl ? gsap.fromTo(glowEl, { opacity: 0.25 },
    { opacity: 1, repeat: -1, yoyo: true, duration: 1.2, ease: 'sine.inOut' }) : null;

  // Zen: sin temporizador — el color se queda hasta que el jugador esté listo
  if (isZen) {
    const zenBtn = document.getElementById('zen-ready');
    gsap.fromTo(zenBtn, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, delay: 0.3, duration: 0.5, ease: 'back.out(1.8)' });
    zenBtn.addEventListener('click', () => {
      playClick();
      if (glowTween) glowTween.kill();
      if (glowEl) {
        gsap.killTweensOf(glowEl);
        gsap.to(glowEl, { opacity: 0, duration: 0.3, onComplete: () => glowEl.remove() });
      }
      colorWipe(hsvToCss(color.h, color.s, color.v));
      gsap.killTweensOf(el);
      gsap.to(el, {
        rotationY: -90, opacity: 0, duration: 0.4, ease: 'power2.in',
        onComplete: () => { el.remove(); buildGuess(); }
      });
    }, { once: true });
    return;
  }

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
    if (glowEl) {
      gsap.fromTo(glowEl, { opacity: 1 }, { opacity: 0.25, duration: 0.6 });
    }
    playTone(300, 'sine', 0.1, 0.03);
    
    if (remaining <= 0) {
      done = true;
      clearInterval(timerIv); timerIv = null;
      if (glowTween) glowTween.kill();
      if (glowEl) {
        gsap.killTweensOf(glowEl);
        gsap.to(glowEl, { opacity: 0, duration: 0.3, onComplete: () => glowEl.remove() });
      }
      colorWipe(hsvToCss(color.h, color.s, color.v));
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
  lastPickerPaint = { h: null, s: null, v: null, blind: null };

  const el = document.createElement('div');
  el.className = 'card guess-card';
  el.id = 'screen-guess';
  const guessTarget = G.colors[G.round];
  el.innerHTML = `
    ${G.mode === 'zen' ? '' : '<div class="time-bonus-wrap"><div class="time-bonus-fill" id="bonus-fill"></div></div>'}
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
        <span>${(G.mode === 'survival' || G.mode === 'timed') ? `Ronda ${G.round + 1}` : `${G.round + 1} / ${ROUNDS}`}</span>
        <span class="${G.combo >= 2 ? 'on-fire' : ''}">Color Game ${G.combo >= 2 ? '🔥' : ''}</span>
      </div>
      ${G.mode === 'inverse' ? `<div class="inverse-target">🎯 ${getColorName(guessTarget.h, guessTarget.s, guessTarget.v)}</div>` : ''}
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
  if (G.mode !== 'zen') gsap.to('#bonus-fill', { scaleX: 0, duration: 10, ease: 'none', delay: 0.4 });

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
      const hr = btnHint.getBoundingClientRect();
      spawnBurst(hr.left + hr.width / 2, hr.top + hr.height / 2, { count: 10, colors: ['#ffd93d', '#fff7cc', '#ffb84d'] });
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
    box.style.boxShadow = isBlind ? 'inset 0 0 10px rgba(0,0,0,0.5)' : `0 10px 30px ${css}66`;
    
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

    // Evita recalcular el fondo si el tono no ha cambiado.
    const guessCard = document.getElementById('screen-guess');
    if (guessCard && !lowPowerMode && (lastPickerPaint.h !== P.h || lastPickerPaint.blind !== isBlind)) {
      guessCard.style.background = isBlind ? '#111' : `linear-gradient(145deg, ${hsvToCss(P.h, 22, 13)}, #111 60%)`;
    }

    const thumbGlow = (isBlind || !effPerf().glow) ? '0 2px 10px rgba(0,0,0,0.55), 0 0 0 2.5px rgba(255,255,255,0.2)' : `0 2px 10px rgba(0,0,0,0.55), 0 0 0 2.5px ${css}70, 0 0 12px ${css}60`;
    ['hue-thumb','sat-thumb','bri-thumb'].forEach(id => {
      const t = document.getElementById(id);
      if (t) {
        t.style.boxShadow = thumbGlow;
        t.style.setProperty('--thumb-c', isBlind ? 'rgba(255,255,255,0.55)' : css);
      }
    });

    if (satStrip && (lastPickerPaint.h !== P.h || lastPickerPaint.v !== P.v)) {
      satStrip.style.background = `linear-gradient(to bottom, ${hsvToCss(P.h,100,P.v)}, ${hsvToCss(P.h,0,P.v)})`;
    }
    if (briStrip && (lastPickerPaint.h !== P.h || lastPickerPaint.s !== P.s)) {
      briStrip.style.background = `linear-gradient(to bottom, ${hsvToCss(P.h,P.s,100)}, ${hsvToCss(P.h,P.s,0)})`;
    }

    if (hueCol)   { const t = document.getElementById('hue-thumb'); if (t) t.style.top = `${(P.h/360)*hueCol.clientHeight-11}px`; hueCol.setAttribute('aria-valuenow', P.h); }
    if (satStrip) { const t = document.getElementById('sat-thumb'); if (t) t.style.top = `${((100-P.s)/100)*satStrip.clientHeight-11}px`; satStrip.setAttribute('aria-valuenow', P.s); }
    if (briStrip) { const t = document.getElementById('bri-thumb'); if (t) t.style.top = `${((100-P.v)/100)*briStrip.clientHeight-11}px`; briStrip.setAttribute('aria-valuenow', P.v); }

    if (effPerf().ambilight) {
      let ambi = document.getElementById('ambilight');
      if (!ambi) {
        ambi = document.createElement('div');
        ambi.id = 'ambilight';
        // Sin filter:blur(120px): un degradado radial produce el mismo halo
        // difuso y cuesta muchísimo menos en GPUs antiguas.
        ambi.style.cssText = 'position:fixed; top:50%; left:50%; width:120vw; height:120vh; transform:translate(-50%,-50%); opacity:0.25; pointer-events:none; z-index:-1;';
        document.body.appendChild(ambi);
      }
      ambi.style.background = isBlind ? 'transparent' : `radial-gradient(closest-side, ${hsvToCss(P.h, 100, 50)}, transparent)`;
    }
    lastPickerPaint = { h: P.h, s: P.s, v: P.v, blind: isBlind };
    
    pickerUpdatePending = false;
  });
}

// Estela de partículas al arrastrar los deslizadores: puramente decorativa
// y reactiva a la velocidad de TU gesto, nunca a lo cerca que estés del
// color objetivo (eso seguiría revelando la respuesta antes de tiempo).
let lastTrailTime = 0;
function spawnDragTrail(thumbId) {
  if (DIFFS[diffIdx].blind) return; // en "A ciegas" no hay color que mostrar en la estela
  const now = performance.now();
  if (now - lastTrailTime < 55) return;
  lastTrailTime = now;
  const t = document.getElementById(thumbId);
  if (!t) return;
  const r = t.getBoundingClientRect();
  spawnBurst(r.left + r.width / 2, r.top + r.height / 2, { count: 2, colors: [hsvToCss(P.h, P.s, P.v)] });
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
      if (thumb) {
        thumb.classList.add('dragging');
        gsap.to(thumb, { scale: 1.25, duration: 0.2, ease: 'back.out(2)' });
      }
    };
    const move  = e => { if (active) onMove(e); };
    const stop  = ()  => {
      if (active && thumb) {
        thumb.classList.remove('dragging');
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
      spawnDragTrail('hue-thumb');
    }
  });
  drag('sat-strip', 'sat-thumb', e => {
    const r = document.getElementById('sat-strip').getBoundingClientRect();
    const oldS = P.s;
    P.s = Math.round(100 - Math.max(0, Math.min(e.clientY - r.top, r.height)) / r.height * 100);
    if (P.s !== oldS) {
      playSliderSound(300 + (P.s / 100) * 300);
      updatePicker();
      spawnDragTrail('sat-thumb');
    }
  });
  drag('bri-strip', 'bri-thumb', e => {
    const r = document.getElementById('bri-strip').getBoundingClientRect();
    const oldV = P.v;
    P.v = Math.round(100 - Math.max(0, Math.min(e.clientY - r.top, r.height)) / r.height * 100);
    if (P.v !== oldV) {
      playSliderSound(300 + (P.v / 100) * 300);
      updatePicker();
      spawnDragTrail('bri-thumb');
    }
  });

  // Control por teclado de los deslizadores (accesibilidad + jugar sin ratón).
  // Flechas: ±1 · Re/Av Pág: ±10 · Inicio/Fin: extremos · Enter: confirmar.
  const KEY_SLIDERS = {
    'hue-col':   { key: 'h', min: 0, max: 359, wrap: true,  freq: () => 400 + (P.h / 360) * 400 },
    'sat-strip': { key: 's', min: 0, max: 100, wrap: false, freq: () => 300 + (P.s / 100) * 300 },
    'bri-strip': { key: 'v', min: 0, max: 100, wrap: false, freq: () => 300 + (P.v / 100) * 300 },
  };
  Object.entries(KEY_SLIDERS).forEach(([id, cfg]) => {
    const strip = document.getElementById(id);
    if (!strip) return;
    strip.addEventListener('keydown', ev => {
      let delta = null;
      switch (ev.key) {
        case 'ArrowUp': case 'ArrowRight': delta = 1; break;
        case 'ArrowDown': case 'ArrowLeft': delta = -1; break;
        case 'PageUp':   delta = 10; break;
        case 'PageDown': delta = -10; break;
        case 'Home':     delta = 'min'; break;
        case 'End':      delta = 'max'; break;
        case 'Enter':
          ev.preventDefault();
          document.getElementById('btn-submit')?.click();
          return;
        default: return;
      }
      ev.preventDefault();
      const old = P[cfg.key];
      let next;
      if (delta === 'min') next = cfg.min;
      else if (delta === 'max') next = cfg.max;
      else {
        next = old + delta;
        if (cfg.wrap) next = ((next % 360) + 360) % 360;
        else next = Math.max(cfg.min, Math.min(cfg.max, next));
      }
      if (next !== old) {
        P[cfg.key] = next;
        playSliderSound(cfg.freq());
        updatePicker();
      }
    }, { signal: sig });
  });
}

function submitGuess() {
  if (dragCtrl) { dragCtrl.abort(); dragCtrl = null; }
  playPop();
  vibrate(15);
  const sb = document.getElementById('btn-submit');
  if (sb) {
    const r = sb.getBoundingClientRect();
    spawnBurst(r.left + r.width / 2, r.top + r.height / 2, { count: 12, colors: [hsvToCss(P.h, P.s, P.v), '#ffffff'] });
  }
  
  const elapsed = (Date.now() - G.guessStartTime - 400) / 1000;
  gsap.killTweensOf('#bonus-fill');

  const guess  = { ...P };
  const target = G.colors[G.round];
  
  let rawSc = scoreForRound(target, guess);
  let finalSc = rawSc;
  let bonusStr = '';
  
  if (G.mode !== 'zen' && elapsed < 10 && elapsed > 0 && rawSc >= 4.0) {
    const mult = 1 + (0.15 * (10 - elapsed) / 10);
    finalSc = rawSc === 10 ? 10 : Math.min(9.99, rawSc * mult);
    const perc = Math.round((mult - 1) * 100);
    if (perc > 0) bonusStr = `+${perc}% Bonus Vel.`;
    if (perc >= 12 && finalSc >= 9) G.fastNine = true; // para el logro Rayo Veloz
  }

  if (finalSc >= 9.0) G.combo++;
  else G.combo = 0;
  if (G.combo > (G.maxCombo || 0)) G.maxCombo = G.combo;

  if (G.combo >= 2) {
    playCombo(G.combo);
    const comboEl = document.createElement('div');
    comboEl.className = 'combo-popup';
    comboEl.textContent = `🔥 COMBO x${G.combo}`;
    document.body.appendChild(comboEl);
    gsap.fromTo(comboEl, { scale: 0.4, opacity: 0 },
      { scale: 1.1, opacity: 1, duration: 0.35, ease: 'back.out(3)' });
    gsap.to(comboEl, { opacity: 0, y: -70, scale: 0.85, duration: 0.45, delay: 0.6,
      ease: 'power2.in', onComplete: () => comboEl.remove() });
  }

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

  playSwish();
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
  const breakdown = getRoundBreakdown(target, guess);
  const analysisHtml = breakdown.map(part => {
    const pct = Math.round(part.score * 100);
    const hue = Math.round(part.score * 120);
    return `
      <div class="res-analysis-row">
        <span class="res-analysis-key">${part.short}</span>
        <div class="res-analysis-track"><span data-width="${pct}%" style="width:${pct}%; background:hsl(${hue},70%,58%)"></span></div>
        <span class="res-analysis-diff">${part.diff}</span>
      </div>
    `;
  }).join('');
  const roundTip = getRoundTip(breakdown);

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
    <div class="res-analysis" id="res-analysis">
      <div class="res-analysis-title">${roundTip}</div>
      ${analysisHtml}
    </div>
    ${sc < 5.0 && G.hasRetry && !G.retryUsed ? `<button class="btn-retry" id="btn-retry" aria-label="Reintentar esta ronda">🔄 Segunda Oportunidad</button>` : ''}
    <button class="btn-next" id="btn-next">&#8594;</button>
  `;
  app.appendChild(el);

  gsap.fromTo(el, { rotationY: 90, opacity: 0 }, { rotationY: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
  gsap.fromTo('#res-top', { y: '-100%' }, { y: 0, duration: 0.55, ease: 'power3.out' });
  gsap.fromTo('#res-bot', { y:  '100%' }, { y: 0, duration: 0.55, ease: 'power3.out' });
  gsap.fromTo('#score-pill',
    { scale: 0.2, opacity: 0, y: 12 },
    { scale: 1, opacity: 1, y: 0, delay: 0.35, duration: 0.65, ease: 'elastic.out(1.1, 0.5)' }
  );
  if (!lowPowerMode) {
    gsap.fromTo('#score-pill',
      { boxShadow: '0 0 55px rgba(255,255,255,0.55)' },
      { boxShadow: '0 0 0px rgba(255,255,255,0)', delay: 0.95, duration: 1.0, ease: 'power2.out' }
    );
  }
  gsap.fromTo('#res-analysis',
    { y: 14, opacity: 0 },
    { y: 0, opacity: 1, delay: 0.85, duration: 0.45, ease: 'power2.out' }
  );
  gsap.fromTo('.res-analysis-track span',
    { width: 0 },
    { width: (i, el) => el.dataset.width, delay: 0.95, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
  );

  // 10.00 exacto: cámara lenta real durante el conteo hasta el número, para
  // que el momento más raro del juego se note. gsap.globalTimeline ralentiza
  // TODO lo que esté animándose con GSAP en ese instante (efecto buscado:
  // que se sienta como si el tiempo se congelase, no solo esta pantalla).
  // El setTimeout usa tiempo real (no lo afecta el timeScale), así que
  // siempre se restaura a los 900ms pase lo que pase.
  if (sc >= 9.995 && !prefersReducedMotion) {
    gsap.globalTimeline.timeScale(0.35);
    setTimeout(() => gsap.globalTimeline.timeScale(1), 900);
  }

  const counter = { value: 0 };
  const numEl = document.getElementById('res-num');
  gsap.to(counter, {
    value: sc, delay: 0.38, duration: 0.85, ease: 'power3.out',
    onStart: () => playReveal(sc),
    onUpdate() { numEl.textContent = counter.value.toFixed(2); },
    onComplete: () => {
      gsap.fromTo(numEl, { scale: 1.22 }, { scale: 1, duration: 0.38, ease: 'elastic.out(1, 0.5)' });
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
        const pillEl = document.getElementById('score-pill');
        if (pillEl) {
          const pr = pillEl.getBoundingClientRect();
          shockwave(pr.left + pr.width / 2, pr.top + pr.height / 2, '#ffd700');
        }
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
        if (sc >= 9.995) {
          // 10.00 exacto: el momento más raro del juego se nota más que un
          // simple "¡PERFECTO!" — destello dorado + sacudida extra.
          screenFlash('#ffd700', { peak: 0.4, duration: 0.6 });
          screenShake(el, { amp: 16, count: 5 });
        }
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
    playSwish();
    const nr = btnNext.getBoundingClientRect();
    spawnBurst(nr.left + nr.width / 2, nr.top + nr.height / 2, { count: 10, colors: [`hsl(${Math.round(sc * 12)},75%,62%)`, '#ffffff'] });

    if (G.mode === 'timed') {
      gsap.to(el, {
        rotationY: -90, opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => {
          el.remove();
          if (G.timeUp) { colorWipe(`hsl(${Math.round(sc * 12)},70%,55%)`); buildFinal(); }
          else {
            G.round++;
            G.colors.push({ h: randInt(0, 359), s: randInt(40, 100), v: randInt(22, 82) });
            buildMemorize(G.colors[G.round]);
          }
        }
      });
      return;
    }

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
          if (G.lives <= 0) { colorWipe(`hsl(${Math.round(sc * 12)},70%,55%)`); buildFinal(); }
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
      onComplete: () => {
        el.remove();
        if (G.round >= ROUNDS) { colorWipe(`hsl(${Math.round(sc * 12)},70%,55%)`); buildFinal(); }
        else buildMemorize(G.colors[G.round]);
      }
    });
  }, { once: true });
}

// ── FINAL SCREEN ──────────────────────────────────────────────────────────────

function buildFinal() {
  hideHomeBtn();
  stopTimedHUD();
  // En Contrarreloj pueden quedar colores generados sin llegar a jugarse
  if (G.mode === 'timed') G.colors = G.colors.slice(0, G.scores.length);
  const numRounds = G.mode === 'survival' ? G.round + 1
                  : G.mode === 'timed' ? Math.max(1, G.scores.length)
                  : ROUNDS;
  const avg = G.scores.reduce((a, b) => a + b, 0) / numRounds;

  // Duelo: solo cuenta como reto real si el enlace traía la puntuación del
  // retador (enlaces viejos sin &score= siguen jugándose igual, sin comparación).
  const isDuel = G.mode === 'challenge' && challengeTargetScore !== null;
  const duelTied = isDuel && Math.abs(avg - challengeTargetScore) < 0.005;
  const duelWon = isDuel && !duelTied && avg > challengeTargetScore;
  if (isDuel) {
    stats.c.duelsPlayed = (stats.c.duelsPlayed || 0) + 1;
    if (duelWon) stats.c.duelsWon = (stats.c.duelsWon || 0) + 1;
  }

  const [, streakMult, streakLabel] = getStreakMult(G.combo);

  const baseInk = Math.floor(avg * numRounds + (G.combo * 5));
  const hasInkMult = (stats.inkMultiplierGames || 0) > 0;
  const earnedInk = Math.floor(baseInk * streakMult * (hasInkMult ? 1.5 : 1) * (stats.permInkBoost ? 1.1 : 1));
  if (hasInkMult) stats.inkMultiplierGames--;
  stats.ink = (stats.ink || 0) + earnedInk;

  const hasXpMult = (stats.xpMultiplierGames || 0) > 0;
  const earnedXP = Math.floor(avg * 10 * numRounds * streakMult * (hasXpMult ? 2 : 1) * (stats.permXpBoost ? 1.1 : 1));
  if (hasXpMult) stats.xpMultiplierGames--;
  stats.xp += earnedXP;

  const earnedSeasonPts = Math.max(1, Math.round(earnedXP / 3));
  const newSeasonTiers = checkSeasonTiers(earnedSeasonPts);

  let leveledUp = false;
  while (stats.xp >= getXPNeeded(stats.level)) {
    stats.xp -= getXPNeeded(stats.level);
    stats.level++;
    leveledUp = true;
    playLevelUp();
    vibrate([100, 50, 100, 50, 200]);
  }
  
  stats.gamesPlayed++;
  const isNewRecord = stats.gamesPlayed > 1 && stats.bestScore > 0 && avg > stats.bestScore;
  if (avg > stats.bestScore) stats.bestScore = avg;
  
  const today = getTodayStr();
  let shieldUsed = false;
  if (G.isDaily) {
    stats.dailyPlayed[today] = avg;
    syncDailyFlagForSW();
    submitDailyScore(avg);
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
  const perfects = G.scores.filter(s => s >= 9.5).length;
  const bestRound = Math.max(...G.scores);
  const awards = getSessionAwards(avg, perfects, bestRound, numRounds);

  // Logros: acumular contadores y comprobar desbloqueos de esta partida
  stats.c.totalRounds = (stats.c.totalRounds || 0) + numRounds;
  stats.c.perfectRounds = (stats.c.perfectRounds || 0) + perfects;
  stats.c.exact10 = (stats.c.exact10 || 0) + G.scores.filter(x => x >= 9.995).length;
  stats.c.maxCombo = Math.max(stats.c.maxCombo || 0, G.maxCombo || 0);
  stats.c.inkEarned = (stats.c.inkEarned || 0) + earnedInk;
  if (G.mode === 'survival') stats.c.bestSurvival = Math.max(stats.c.bestSurvival || 0, numRounds);
  if (G.mode === 'challenge') stats.c.challenges = (stats.c.challenges || 0) + 1;
  const newAch = checkAchievements({
    avg, scores: G.scores, perfects, numRounds, mode: G.mode,
    maxCombo: G.maxCombo || 0, blind: DIFFS[diffIdx].blind, fastNine: !!G.fastNine,
    duelWon,
  });
  const awardsHtml = awards.map(a => `
    <div class="award-chip award-chip--${a.tone}">
      <span>${a.label}</span>
      <strong>${a.value}</strong>
    </div>
  `).join('');

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
    <div class="final-eyebrow">${{ daily: 'Desafío Diario', survival: 'Muerte Súbita', timed: 'Contrarreloj', zen: 'Modo Zen', inverse: 'Modo Inverso', training: 'Entrenamiento' }[G.mode] || 'Puntuación Final'}</div>
    ${isDuel ? `<div class="duel-result-banner ${duelWon ? 'duel-won' : (duelTied ? 'duel-tied' : 'duel-lost')}" id="duel-result-banner">
      ${duelWon ? `🏆 ¡GANASTE EL DUELO! ${avg.toFixed(2)} vs ${challengeTargetScore.toFixed(2)}`
        : duelTied ? `🤝 EMPATE · ${avg.toFixed(2)} vs ${challengeTargetScore.toFixed(2)}`
        : `💀 Perdiste el duelo · ${avg.toFixed(2)} vs ${challengeTargetScore.toFixed(2)}`}
    </div>` : ''}
    ${streakMult > 1 ? `<div class="streak-mult-banner" id="streak-mult-banner">${streakLabel} · Tinta y XP ×${streakMult}</div>` : ''}
    ${isNewRecord ? `<div class="streak-mult-banner" id="new-record-banner" style="background:linear-gradient(90deg, rgba(255,215,0,0.22), rgba(76,217,100,0.18)); border-color:rgba(255,215,0,0.5);">🏆 ¡NUEVO RÉCORD PERSONAL! ${avg.toFixed(2)}</div>` : ''}
    <div style="display:flex; justify-content:center; gap:10px; margin-top:10px;">
      <div class="ink-badge" title="Gotas de Tinta Ganadas${hasInkMult ? ' (Multiplicador x1.5 activo)' : ''}">
        <span class="ink-drop">💧</span> +${earnedInk}${streakMult > 1 ? ` <span style="color:#ff9f45;font-size:0.7rem;font-weight:900;">×${streakMult}</span>` : ''}${hasInkMult ? ' <span style="color:#ffcc00;font-size:0.7rem;font-weight:900;">x1.5</span>' : ''}
      </div>
      <div class="ink-badge" style="border-color: rgba(76,217,100,0.3);" title="Experiencia Ganada${hasXpMult ? ' (XP x2 activo)' : ''}">
        <span style="color:#4cd964;">✨</span> +${earnedXP} XP${streakMult > 1 ? ` <span style="color:#ff9f45;font-size:0.7rem;font-weight:900;">×${streakMult}</span>` : ''}${hasXpMult ? ' <span style="color:#a78bfa;font-size:0.7rem;font-weight:900;">x2</span>' : ''}
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
    <div class="final-awards" id="final-awards">${awardsHtml}</div>
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
  const ringTarget = C * (1 - frac);
  gsap.to('#score-ring', {
    strokeDashoffset: Math.max(0, ringTarget - C * 0.025),
    delay: 0.3, duration: 1.4, ease: 'power3.out',
    onComplete: () => gsap.to('#score-ring', { strokeDashoffset: ringTarget, duration: 0.38, ease: 'power2.inOut' })
  });

  const counter = { value: 0 };
  const numEl   = document.getElementById('final-num');
  gsap.to(counter, {
    value: avg, delay: 0.3, duration: 1.35, ease: 'power3.out',
    onUpdate() { numEl.textContent = counter.value.toFixed(2); },
    onComplete: () => gsap.fromTo(numEl, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1.1, 0.5)' })
  });
  gsap.to(numEl, { color: `hsl(${hue},70%,65%)`, delay: 1.35, duration: 0.4 });

  const rows = el.querySelectorAll('.recap-row');
  gsap.set(rows, { x: 32, opacity: 0 });
  gsap.to(rows, { x: 0, opacity: 1, stagger: 0.08, delay: 0.5, duration: 0.4, ease: 'power2.out' });

  const awardEls = el.querySelectorAll('.award-chip');
  gsap.set(awardEls, { y: 14, opacity: 0, scale: 0.92 });
  gsap.to(awardEls, {
    y: 0, opacity: 1, scale: 1, stagger: 0.09, delay: 0.85, duration: 0.38, ease: 'back.out(1.8)',
    onStart: () => awards.forEach((_, i) => setTimeout(() => playAwardPop(i), i * 90))
  });

  gsap.set('#btn-replay', { y: 16, opacity: 0 });
  gsap.to('#btn-replay',  { y: 0, opacity: 1, delay: 1.1, duration: 0.4, ease: 'back.out(1.5)' });

  if (avg >= 7) launchConfetti(avg, streakMult);
  if (newAch.length) showAchToasts(newAch);
  if (newSeasonTiers.length) showSeasonTierToasts(newSeasonTiers, newAch.length ? 1200 + newAch.length * 3400 : 1200);

  if (leveledUp) {
    screenFlash('#4cd964', { peak: 0.3, duration: 0.7 });
    screenShake(el, { amp: 12, count: 6 });
    shockwave(window.innerWidth / 2, window.innerHeight / 2, '#4cd964');
    fireworksShow(3, 1300);
  }

  if (isNewRecord) {
    const recordBanner = document.getElementById('new-record-banner');
    if (recordBanner) {
      gsap.fromTo(recordBanner, { y: -14, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, delay: 0.2, duration: 0.4, ease: 'back.out(2.2)' });
    }
    screenFlash('#ffd700', { peak: 0.3, duration: 0.7 });
    fireworksShow(4, 1400);
    playLevelUp();
  }

  if (isDuel) {
    const duelBanner = document.getElementById('duel-result-banner');
    if (duelBanner) {
      gsap.fromTo(duelBanner, { y: -14, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, delay: 0.1, duration: 0.4, ease: 'back.out(2.2)' });
      if (duelWon) {
        setTimeout(() => {
          const r = duelBanner.getBoundingClientRect();
          spawnBurst(r.left + r.width / 2, r.top + r.height / 2,
            { count: 18, colors: ['#ffd700', '#4cd964', '#ffffff'] });
          shockwave(r.left + r.width / 2, r.top + r.height / 2, '#ffd700');
        }, 120);
        screenFlash('#ffd700', { peak: 0.32, duration: 0.65 });
        screenShake(el, { amp: 14, count: 7 });
        playLevelUp();
      } else if (!duelTied) {
        playBeep();
      }
    }
  }

  if (streakMult > 1) {
    const banner = document.getElementById('streak-mult-banner');
    if (banner) {
      gsap.fromTo(banner, { y: -14, opacity: 0, scale: 0.85 },
        { y: 0, opacity: 1, scale: 1, delay: 0.15, duration: 0.4, ease: 'back.out(2.2)' });
      setTimeout(() => {
        const r = banner.getBoundingClientRect();
        spawnBurst(r.left + r.width / 2, r.top + r.height / 2,
          { count: Math.round(10 * streakMult), colors: ['#ff9f45', '#ffcc00', '#ff6b6b', '#ffffff'] });
      }, 150);
    }
    if (streakMult >= 3) {
      screenFlash('#ff9f45', { peak: 0.35, duration: 0.7 });
      screenShake(el, { amp: 15, count: 8 });
    }
    playCombo(streakMult >= 3 ? 5 : 4);
  }

  document.getElementById('btn-share').addEventListener('click', shareResult);
  
  const btnReplay = document.getElementById('btn-replay');
  if (G.mode === 'challenge') btnReplay.textContent = 'Menú Principal';
  btnReplay.addEventListener('click', () => {
    btnReplay.style.pointerEvents = 'none';
    playSwish();
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

// ── TARJETA-IMAGEN PARA COMPARTIR ────────────────────────────────────────────

function drawRoundRect(ctx, rx, ry, rw, rh, rr) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, rr);
  else {
    ctx.moveTo(rx + rr, ry);
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, rr);
    ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, rr);
    ctx.arcTo(rx, ry + rh, rx, ry, rr);
    ctx.arcTo(rx, ry, rx + rw, ry, rr);
    ctx.closePath();
  }
}

function renderShareCard() {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  x.fillStyle = '#0d0d10';
  x.fillRect(0, 0, W, H);
  const grad = x.createLinearGradient(0, 0, W, 0);
  ['#ff416c', '#ffd166', '#4cd964', '#45dcff', '#8b5cf6'].forEach((col, i, arr) => grad.addColorStop(i / (arr.length - 1), col));
  x.fillStyle = grad;
  x.fillRect(0, 0, W, 14);

  x.fillStyle = '#ffffff';
  x.font = '900 96px Inter, sans-serif';
  x.textAlign = 'center';
  x.fillText('color', W / 2, 155);
  const modeNames = { daily: 'Desafío Diario', survival: 'Muerte Súbita', timed: 'Contrarreloj', zen: 'Modo Zen', inverse: 'Modo Inverso', challenge: 'Reto', practice: 'Práctica', training: 'Entrenamiento' };
  x.fillStyle = '#888';
  x.font = '700 34px Inter, sans-serif';
  x.fillText(`${modeNames[G.mode] || 'Partida'} · ${new Date().toLocaleDateString()}`, W / 2, 212);

  // Filas: tu color (izquierda) frente al objetivo (derecha) + nota
  const rows = G.colors.slice(0, 6);
  const rowH = 92, gap = 24, rowW = 720;
  const rx = (W - rowW) / 2 - 55;
  let ry = 300;
  x.font = '800 26px Inter, sans-serif';
  x.fillStyle = '#666';
  x.textAlign = 'left';
  x.fillText('TÚ', rx + 10, ry - 16);
  x.textAlign = 'right';
  x.fillText('OBJETIVO', rx + rowW - 10, ry - 16);
  rows.forEach((t, i) => {
    const gcol = G.guesses[i];
    const sc = G.scores[i];
    if (!gcol) return;
    x.save();
    drawRoundRect(x, rx, ry, rowW, rowH, 20);
    x.clip();
    x.fillStyle = hsvToCss(gcol.h, gcol.s, gcol.v);
    x.fillRect(rx, ry, rowW / 2, rowH);
    x.fillStyle = hsvToCss(t.h, t.s, t.v);
    x.fillRect(rx + rowW / 2, ry, rowW / 2, rowH);
    x.restore();
    x.fillStyle = `hsl(${Math.round(sc * 12)},70%,62%)`;
    x.font = '900 46px Inter, sans-serif';
    x.textAlign = 'left';
    x.fillText(sc.toFixed(1), rx + rowW + 28, ry + rowH / 2 + 17);
    ry += rowH + gap;
  });

  const avg = G.scores.reduce((a, b) => a + b, 0) / Math.max(1, G.scores.length);
  ry += 40;
  x.textAlign = 'center';
  x.fillStyle = `hsl(${Math.round(avg * 12)},70%,62%)`;
  x.font = '900 168px Inter, sans-serif';
  x.fillText(avg.toFixed(2), W / 2, ry + 150);
  x.fillStyle = '#aaa';
  x.font = '800 42px Inter, sans-serif';
  x.fillText(getRank(avg), W / 2, ry + 228);

  x.fillStyle = '#555';
  x.font = '700 30px Inter, sans-serif';
  x.fillText('¿Me superas? → colormemory.vercel.app', W / 2, H - 56);

  drawShareFrame(x, W, H);
  return c;
}

// Marco cosmético opcional sobre la tarjeta de compartir. Se dibuja al
// final, encima de todo, como un borde — nunca tapa el contenido central.
function drawShareFrame(x, W, H) {
  const frame = stats.activeShareFrame;
  if (!frame) return;
  const pad = 22;
  x.textAlign = 'center'; // por si algún borde deja el canvas en otro estado

  if (frame === 'shareFrameGold') {
    x.strokeStyle = '#ffd700'; x.lineWidth = 6;
    x.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    x.strokeStyle = 'rgba(255,215,0,0.4)'; x.lineWidth = 2;
    x.strokeRect(pad + 10, pad + 10, W - (pad + 10) * 2, H - (pad + 10) * 2);
  } else if (frame === 'shareFrameNeon') {
    x.strokeStyle = 'rgba(0,229,255,0.85)'; x.lineWidth = 5;
    x.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    x.strokeStyle = 'rgba(255,0,229,0.6)'; x.lineWidth = 5;
    x.strokeRect(pad + 8, pad + 8, W - (pad + 8) * 2, H - (pad + 8) * 2);
  } else if (frame === 'shareFrameFloral') {
    x.strokeStyle = 'rgba(255,182,213,0.8)'; x.lineWidth = 4;
    x.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
    [[pad, pad], [W - pad, pad], [pad, H - pad], [W - pad, H - pad]].forEach(([cx, cy]) => {
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        x.beginPath();
        x.arc(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14, 9, 0, Math.PI * 2);
        x.fillStyle = 'rgba(255,182,213,0.55)';
        x.fill();
      }
      x.beginPath(); x.arc(cx, cy, 7, 0, Math.PI * 2); x.fillStyle = '#fff7cc'; x.fill();
    });
  }
}

function shareResult() {
  const dateStr = new Date().toLocaleDateString();
  let title = 'Color Game';
  if (G.mode === 'daily') title += ` Diario - ${dateStr}`;
  else if (G.mode === 'challenge') title += ` - Reto Aceptado`;
  else if (G.mode === 'timed') title += ` - Contrarreloj`;
  else if (G.mode === 'zen') title += ` - Zen`;
  else if (G.mode === 'inverse') title += ` - Inverso`;
  else if (G.mode === 'training') title += ` - Entrenamiento`;
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
  link.searchParams.set('score', avg.toFixed(2));
  text += `\n¡Te reto a superar mi ${avg.toFixed(2)} con mis mismos colores!\n${link.toString()}`;
  
  // Imagen primero: tarjeta bonita para WhatsApp/Instagram; con degradado
  // de alternativas según lo que soporte el navegador.
  const canvas = renderShareCard();
  canvas.toBlob(blob => {
    const file = blob ? new File([blob], 'color-game.png', { type: 'image/png' }) : null;

    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ title: 'Color Game', text, files: [file] }).catch(() => {});
      return;
    }
    if (navigator.share) {
      navigator.share({ title: 'Color Game', text }).catch(console.error);
      return;
    }
    // Escritorio sin Web Share: descargar la imagen y copiar el texto del reto
    if (blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'color-game.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('btn-share');
      if (!btn) return;
      const orig = btn.innerHTML;
      btn.innerHTML = '¡Imagen guardada + reto copiado!';
      setTimeout(() => { btn.innerHTML = orig; }, 2200);
    }).catch(() => {});
  }, 'image/png');
}

// ── CANVAS EFFECTS (CONFETTI & EXPLOSION) ───────────────────────────────────

function launchConfetti(score, intensityMult = 1) {
  const canvas = document.getElementById('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  // El multiplicador de racha refuerza visualmente el premio, pero se limita
  // a 2.2x para no disparar el coste en gama baja con "RACHA PERFECTA" (x3).
  // burstScale() añade más piezas aún en dispositivos que van sobrados.
  const count = Math.floor((score * 20 + 40) * Math.min(2.2, intensityMult) * burstScale());
  const cx    = canvas.width  / 2;
  const cy    = canvas.height * 0.55;

  const gameColors = (stats.premiumConfetti && G.colors?.length > 0) ? G.colors : null;
  const skin = stats.activeSkin;
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
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      if (skin === 'skinCristal') {
        // Burbujas: círculos suaves, sin rotación (no tiene sentido en un disco)
        ctx.beginPath(); ctx.arc(0, 0, p.r * 0.75, 0, Math.PI * 2); ctx.fill();
      } else if (skin === 'skinRetro') {
        // Confeti "píxel": cuadrados sin rotar, a lo bloque
        ctx.fillRect(-p.r * 0.6, -p.r * 0.6, p.r * 1.2, p.r * 1.2);
      } else if (skin === 'skinCyberpunk') {
        // Chispas: líneas finas brillantes
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.fillRect(-p.r * 1.6, -1, p.r * 3.2, 2);
      } else {
        ctx.rotate(p.angle * Math.PI / 180);
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      }
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

// ── ESTADÍSTICAS Y ENTRENAMIENTO ─────────────────────────────────────────────

const AXIS_NAMES = { h: 'Tono', s: 'Saturación', v: 'Brillo' };

function computeComponentStats() {
  let hSum = 0, sSum = 0, vSum = 0, n = 0;
  for (const game of stats.history || []) {
    for (const r of game.colors || []) {
      if (!r.target || !r.guess) continue;
      hSum += hueDelta(r.target.h, r.guess.h) / 180;
      sSum += Math.abs(r.target.s - r.guess.s) / 100;
      vSum += Math.abs(r.target.v - r.guess.v) / 100;
      n++;
    }
  }
  if (!n) return null;
  return { h: hSum / n, s: sSum / n, v: vSum / n, rounds: n };
}

function drawStatsChart(canvas) {
  const hist = (stats.history || []).slice(-20);
  const ctx = canvas.getContext('2d');
  const W = canvas.width = Math.max(2, canvas.clientWidth * 2); // nitidez retina
  const Hc = canvas.height = 240;
  ctx.clearRect(0, 0, W, Hc);
  const pad = 24;
  const xs = i => pad + i * (W - pad * 2) / (hist.length - 1);
  const ys = v => Hc - pad - (v / 10) * (Hc - pad * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  [2.5, 5, 7.5].forEach(v => { ctx.beginPath(); ctx.moveTo(pad, ys(v)); ctx.lineTo(W - pad, ys(v)); ctx.stroke(); });
  ctx.beginPath();
  hist.forEach((g, i) => { i ? ctx.lineTo(xs(i), ys(g.score)) : ctx.moveTo(xs(0), ys(g.score)); });
  ctx.strokeStyle = '#45dcff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  hist.forEach((g, i) => {
    ctx.beginPath();
    ctx.arc(xs(i), ys(g.score), 7, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${Math.round(g.score * 12)},70%,60%)`;
    ctx.fill();
  });
}

function buildStatsScreen() {
  const el = document.createElement('div');
  el.className = 'card shop-card';
  app.appendChild(el);

  const comp = computeComponentStats();
  let weak = null;
  let compHtml = '<div style="text-align:center; color:#555; padding:30px 0; font-size:0.85rem;">Juega unas partidas para ver tu análisis.</div>';
  let trainHtml = '';
  if (comp) {
    weak = ['h', 's', 'v'].reduce((a, b) => comp[a] >= comp[b] ? a : b);
    compHtml = ['h', 's', 'v'].map(k => {
      const acc = Math.max(0, Math.round((1 - comp[k]) * 100));
      const hue = Math.round((acc / 100) * 120);
      return `
        <div class="comp-row${k === weak ? ' weak' : ''}">
          <span class="comp-name">${AXIS_NAMES[k]}${k === weak ? ' ⚠️' : ''}</span>
          <div class="res-analysis-track"><span style="width:${acc}%; background:hsl(${hue},70%,58%)"></span></div>
          <span class="comp-val">${acc}%</span>
        </div>`;
    }).join('');
    trainHtml = `
      <div class="train-callout">
        <div><strong>Tu punto débil: ${AXIS_NAMES[weak]}</strong><br><span>Practica con colores diseñados para forzar justo ese componente.</span></div>
        <button id="btn-train" class="btn-train">🎯 Entrenar ${AXIS_NAMES[weak]}</button>
      </div>`;
  }

  const hist = stats.history || [];
  el.innerHTML = `
    <div class="shop-header">
      <div class="shop-title" style="font-size:1.5rem;">Estadísticas</div>
      <button id="btn-stats-close" class="btn-icon-close" aria-label="Cerrar estadísticas">&times;</button>
    </div>
    <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px; display:flex; flex-direction:column; gap:14px;">
      <div>
        <div class="shop-section-title">📈 Evolución (últimas ${Math.min(20, hist.length)} partidas)</div>
        <div class="stats-chart-wrap"><canvas id="stats-chart"></canvas></div>
      </div>
      <div>
        <div class="shop-section-title">🎯 Precisión por componente</div>
        ${compHtml}
      </div>
      ${trainHtml}
      <div class="stats-mini-row">
        <div class="stat"><div class="stat-val">${stats.c?.perfectRounds || 0}</div><div class="stat-lbl">Perfectas</div></div>
        <div class="stat"><div class="stat-val">${stats.c?.maxCombo || 0}</div><div class="stat-lbl">Mejor combo</div></div>
        <div class="stat"><div class="stat-val">${stats.c?.totalRounds || 0}</div><div class="stat-lbl">Rondas</div></div>
      </div>
    </div>
  `;
  requestAnimationFrame(() => {
    const cv = document.getElementById('stats-chart');
    if (!cv) return;
    if (hist.length >= 2) drawStatsChart(cv);
    else cv.parentElement.innerHTML = '<div style="text-align:center; color:#555; padding:24px 0; font-size:0.8rem;">Aún no hay suficientes partidas.</div>';
  });
  document.getElementById('btn-stats-close').addEventListener('click', () => {
    playClick();
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => { el.remove(); buildStart(); } });
  });
  const bt = document.getElementById('btn-train');
  if (bt) bt.addEventListener('click', () => {
    playClick();
    playStartJingle('practice');
    gsap.to(el, { y: -28, opacity: 0, scale: 0.97, duration: 0.3, ease: 'power2.in',
      onComplete: () => { el.remove(); buildCountdown(() => startGame('training', { axis: weak })); } });
  }, { once: true });
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
}

// ── CALENDARIO DEL DIARIO ────────────────────────────────────────────────────

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function computeBestStreak() {
  const days = Object.keys(stats.dailyPlayed || {});
  if (!days.length) return 0;
  const set = new Set(days);
  let best = 0;
  for (const d of days) {
    const [y, m, dd] = d.split('-').map(Number);
    const prev = new Date(y, m - 1, dd - 1);
    if (set.has(`${prev.getFullYear()}-${prev.getMonth() + 1}-${prev.getDate()}`)) continue; // no es inicio de racha
    let len = 1;
    const cur = new Date(y, m - 1, dd + 1);
    while (set.has(`${cur.getFullYear()}-${cur.getMonth() + 1}-${cur.getDate()}`)) {
      len++;
      cur.setDate(cur.getDate() + 1);
    }
    best = Math.max(best, len);
  }
  return best;
}

function buildCalendar() {
  const now = new Date();
  const view = new Date(now.getFullYear(), now.getMonth(), 1);
  const el = document.createElement('div');
  el.className = 'card shop-card';
  app.appendChild(el);

  function render() {
    const y = view.getFullYear(), m = view.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const lead = (new Date(y, m, 1).getDay() + 6) % 7; // semana empezando en lunes
    const todayKey = getTodayStr();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${m + 1}-${d}`;
      const score = stats.dailyPlayed?.[key];
      const isToday = key === todayKey;
      const isFuture = new Date(y, m, d) > now;
      if (score !== undefined) {
        const hue = Math.round((score / 10) * 120);
        cells += `<div class="cal-cell played${isToday ? ' today' : ''}" style="background:hsla(${hue},70%,42%,0.9); border-color:hsl(${hue},70%,60%);" title="Nota del día: ${score.toFixed(2)}"><span>${d}</span><small>${score.toFixed(1)}</small></div>`;
      } else {
        cells += `<div class="cal-cell${isToday ? ' today' : ''}${isFuture ? ' future' : ''}"><span>${d}</span></div>`;
      }
    }
    const played = Object.keys(stats.dailyPlayed || {}).length;
    el.innerHTML = `
      <div class="shop-header">
        <div class="shop-title" style="font-size:1.5rem;">Desafío Diario</div>
        <button id="btn-cal-close" class="btn-icon-close" aria-label="Cerrar calendario">&times;</button>
      </div>
      <div class="cal-nav">
        <button id="cal-prev" class="cal-nav-btn" aria-label="Mes anterior">&#8249;</button>
        <div class="cal-month">${MONTH_NAMES[m]} ${y}</div>
        <button id="cal-next" class="cal-nav-btn" aria-label="Mes siguiente">&#8250;</button>
      </div>
      <div class="cal-grid cal-head">
        ${['L','M','X','J','V','S','D'].map(d => `<div>${d}</div>`).join('')}
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-stats">
        <div class="stat"><div class="stat-val">${stats.streak} 🔥</div><div class="stat-lbl">Racha actual</div></div>
        <div class="stat"><div class="stat-val">${computeBestStreak()}</div><div class="stat-lbl">Mejor racha</div></div>
        <div class="stat"><div class="stat-val">${played}</div><div class="stat-lbl">Diarios jugados</div></div>
      </div>
    `;
    document.getElementById('btn-cal-close').addEventListener('click', () => {
      playClick();
      gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => { el.remove(); buildStart(); } });
    });
    document.getElementById('cal-prev').addEventListener('click', () => { playClick(); view.setMonth(view.getMonth() - 1); render(); });
    document.getElementById('cal-next').addEventListener('click', () => { playClick(); view.setMonth(view.getMonth() + 1); render(); });
  }

  render();
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
}

// ── LOGROS ───────────────────────────────────────────────────────────────────
// check(s, c, g): s = stats, c = stats.c (contadores), g = contexto de la
// partida recién terminada (o null si se comprueba fuera de una partida).

const ACHIEVEMENTS = [
  { id: 'first',      icon: '🎨', name: 'Primer Chapuzón',        desc: 'Juega tu primera partida.', ink: 20,  check: (s) => s.gamesPlayed >= 1 },
  { id: 'games10',    icon: '🖌️', name: 'Pintor Aficionado',      desc: 'Juega 10 partidas.', ink: 40,  check: (s) => s.gamesPlayed >= 10 },
  { id: 'games50',    icon: '🎭', name: 'Veterano del Color',     desc: 'Juega 50 partidas.', ink: 120, check: (s) => s.gamesPlayed >= 50 },
  { id: 'games200',   icon: '🏛️', name: 'Leyenda Viva',           desc: 'Juega 200 partidas.', ink: 400, check: (s) => s.gamesPlayed >= 200 },
  { id: 'avg7',       icon: '✨', name: 'Buen Ojo',               desc: 'Termina una partida con media 7.00 o más.', ink: 30,  check: (s, c, g) => g && g.avg >= 7 },
  { id: 'avg85',      icon: '🔮', name: 'Visión Cromática',       desc: 'Termina una partida con media 8.50 o más.', ink: 60,  check: (s, c, g) => g && g.avg >= 8.5 },
  { id: 'avg95',      icon: '🌈', name: 'Pantone Humano',         desc: 'Termina una partida con media 9.50 o más.', ink: 200, check: (s, c, g) => g && g.avg >= 9.5 },
  { id: 'perfect1',   icon: '💎', name: 'Ronda Perfecta',         desc: 'Consigue 9.50 o más en una ronda.', ink: 25,  check: (s, c) => (c.perfectRounds || 0) >= 1 },
  { id: 'perfect25',  icon: '💠', name: 'Cazador de Perfectas',   desc: 'Acumula 25 rondas de 9.50 o más.', ink: 150, check: (s, c) => (c.perfectRounds || 0) >= 25 },
  { id: 'exact10',    icon: '🎯', name: 'Diana Absoluta',         desc: 'Clava un 10.00 exacto en una ronda.', ink: 250, check: (s, c) => (c.exact10 || 0) >= 1 },
  { id: 'allgood',    icon: '🖐️', name: 'Mano Firme',             desc: 'Termina las 5 rondas con 8.00 o más.', ink: 80,  check: (s, c, g) => g && g.scores.length >= 5 && g.scores.every(x => x >= 8) },
  { id: 'streak3',    icon: '🔥', name: 'Calentando',             desc: 'Racha de 3 días en el Desafío Diario.', ink: 50,  check: (s) => s.streak >= 3 },
  { id: 'streak7',    icon: '⚡', name: 'Semana Cromática',       desc: 'Racha de 7 días en el Desafío Diario.', ink: 120, check: (s) => s.streak >= 7 },
  { id: 'streak30',   icon: '🌋', name: 'Imparable',              desc: 'Racha de 30 días en el Desafío Diario.', ink: 500, check: (s) => s.streak >= 30 },
  { id: 'daily10',    icon: '📅', name: 'Fiel al Diario',         desc: 'Juega 10 desafíos diarios.', ink: 80,  check: (s) => Object.keys(s.dailyPlayed || {}).length >= 10 },
  { id: 'surv8',      icon: '☠️', name: 'Superviviente',          desc: 'Alcanza la ronda 8 en Supervivencia.', ink: 60,  check: (s, c) => (c.bestSurvival || 0) >= 8 },
  { id: 'surv15',     icon: '💀', name: 'Inmortal',               desc: 'Alcanza la ronda 15 en Supervivencia.', ink: 150, check: (s, c) => (c.bestSurvival || 0) >= 15 },
  { id: 'combo3',     icon: '🎇', name: 'En Racha',               desc: 'Encadena un combo x3.', ink: 40,  check: (s, c) => (c.maxCombo || 0) >= 3 },
  { id: 'combo5',     icon: '🎆', name: 'Modo Dios',              desc: 'Encadena un combo x5.', ink: 120, check: (s, c) => (c.maxCombo || 0) >= 5 },
  { id: 'level5',     icon: '⭐', name: 'Subiendo',               desc: 'Alcanza el nivel 5.', ink: 50,  check: (s) => s.level >= 5 },
  { id: 'level10',    icon: '🌟', name: 'Estrella',               desc: 'Alcanza el nivel 10.', ink: 150, check: (s) => s.level >= 10 },
  { id: 'blind7',     icon: '🕶️', name: 'Sexto Sentido',          desc: 'Media de 7.00 o más en dificultad A ciegas.', ink: 180, check: (s, c, g) => g && g.blind && g.avg >= 7 },
  { id: 'ink1000',    icon: '💧', name: 'Fuente de Tinta',        desc: 'Gana 1000 gotas de tinta en total.', ink: 100, check: (s, c) => (c.inkEarned || 0) >= 1000 },
  { id: 'spender',    icon: '🛍️', name: 'Cliente VIP',            desc: 'Gasta 800 gotas en la tienda.', ink: 80,  check: (s, c) => (c.inkSpent || 0) >= 800 },
  { id: 'themes3',    icon: '🎪', name: 'Decorador',              desc: 'Posee 3 temas de la tienda.', ink: 120, check: (s) => (s.unlockedThemes || []).length >= 3 },
  { id: 'disaster',   icon: '🙈', name: 'Día de Furia',           desc: 'Puntúa menos de 2.00 en una ronda… nos pasa a todos.', ink: 15, check: (s, c, g) => g && g.scores.some(x => x < 2) },
  { id: 'challenger', icon: '⚔️', name: 'Retador',                desc: 'Juega el reto de un amigo.', ink: 40,  check: (s, c) => (c.challenges || 0) >= 1 },
  { id: 'speed',      icon: '🚀', name: 'Rayo Veloz',             desc: 'Nota 9+ con bonus de velocidad del 12% o más.', ink: 90,  check: (s, c, g) => g && g.fastNine },
  { id: 'duelist1',   icon: '⚔️', name: 'Primera Sangre',         desc: 'Gana tu primer duelo contra un amigo.', ink: 60,  check: (s, c, g) => g && g.duelWon },
  { id: 'duelist10',  icon: '🗡️', name: 'Espadachín Cromático',   desc: 'Gana 10 duelos contra amigos.', ink: 250, check: (s, c) => (c.duelsWon || 0) >= 10 },
];

function checkAchievements(g) {
  const unlocked = [];
  let inkGain = 0;
  for (const a of ACHIEVEMENTS) {
    if (stats.unlockedAch[a.id]) continue;
    let ok = false;
    try { ok = !!a.check(stats, stats.c || {}, g); } catch (_) {}
    if (ok) {
      stats.unlockedAch[a.id] = Date.now();
      inkGain += a.ink;
      unlocked.push(a);
    }
  }
  if (unlocked.length) {
    stats.ink = (stats.ink || 0) + inkGain;
    saveStats();
  }
  return unlocked;
}

function showAchToasts(list, startDelay = 1200) {
  list.forEach((a, i) => {
    setTimeout(() => {
      const t = document.createElement('div');
      t.className = 'ach-toast';
      t.innerHTML = `<span class="ach-toast-icon">${a.icon}</span>
        <span class="ach-toast-info"><strong>¡Logro desbloqueado!</strong>${a.name} <em>+${a.ink} 💧</em></span>`;
      document.body.appendChild(t);
      playSuccess();
      vibrate(40);
      gsap.fromTo(t, { y: -70, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' });
      gsap.to(t, { y: -70, opacity: 0, duration: 0.35, delay: 3, ease: 'power2.in', onComplete: () => t.remove() });
      setTimeout(() => t.remove(), 4200); // red de seguridad
    }, startDelay + i * 3400);
  });
}

function showSeasonTierToasts(list, startDelay = 1200) {
  list.forEach((tier, i) => {
    setTimeout(() => {
      const t = document.createElement('div');
      t.className = 'ach-toast';
      const label = tier.theme ? 'Tema exclusivo desbloqueado' : `Tramo ${tier.tier + 1} del Pase`;
      t.innerHTML = `<span class="ach-toast-icon">🎟️</span>
        <span class="ach-toast-info"><strong>¡Pase de Temporada!</strong>${label} <em>+${tier.ink} 💧</em></span>`;
      document.body.appendChild(t);
      playSuccess();
      vibrate(40);
      gsap.fromTo(t, { y: -70, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.8)' });
      gsap.to(t, { y: -70, opacity: 0, duration: 0.35, delay: 3, ease: 'power2.in', onComplete: () => t.remove() });
      setTimeout(() => t.remove(), 4200);
    }, startDelay + i * 3400);
  });
}

function buildAchievements() {
  const el = document.createElement('div');
  el.className = 'card shop-card';
  const total = ACHIEVEMENTS.length;
  const got = Object.keys(stats.unlockedAch || {}).length;
  const rows = ACHIEVEMENTS.map(a => {
    const un = !!stats.unlockedAch[a.id];
    return `
      <div class="ach-item${un ? ' unlocked' : ''}">
        <div class="ach-icon">${un ? a.icon : '🔒'}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${a.name}</div>
          <div class="shop-item-desc">${a.desc}</div>
        </div>
        <div class="ach-reward${un ? ' done' : ''}">${un ? '✓' : `+${a.ink} <span class="ink-drop">💧</span>`}</div>
      </div>`;
  }).join('');
  el.innerHTML = `
    <div class="shop-header">
      <div class="shop-title">Logros</div>
      <button id="btn-ach-close" class="btn-icon-close" aria-label="Cerrar logros">&times;</button>
    </div>
    <div class="ach-progress">
      <span>${got} / ${total} desbloqueados</span>
      <div class="ach-progress-bar"><div style="width:${Math.round(got / total * 100)}%"></div></div>
    </div>
    <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px;">${rows}</div>
  `;
  app.appendChild(el);
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
  const items = el.querySelectorAll('.ach-item');
  gsap.set(items, { x: 24, opacity: 0 });
  gsap.to(items, { x: 0, opacity: 1, stagger: 0.03, delay: 0.15, duration: 0.3, ease: 'power2.out' });
  document.getElementById('btn-ach-close').addEventListener('click', () => {
    playClick();
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => { el.remove(); buildStart(); } });
  });
}

// ── SHOP ─────────────────────────────────────────────────────────────────────

// Tipos de ítem "equipables" (se poseen una vez y se activan/desactivan,
// a diferencia de los consumibles que se gastan). Cada uno guarda su lista
// de desbloqueados y cuál está activo en dos claves de stats distintas.
const EQUIP_TYPES = {
  theme:      { unlockedKey: 'unlockedThemes',      activeKey: 'activeTheme'      },
  title:      { unlockedKey: 'unlockedTitles',      activeKey: 'activeTitle'      },
  uiskin:     { unlockedKey: 'unlockedSkins',       activeKey: 'activeSkin'       },
  frame:      { unlockedKey: 'unlockedFrames',      activeKey: 'activeFrame'      },
  cursor:     { unlockedKey: 'unlockedCursors',     activeKey: 'activeCursor'     },
  shareframe: { unlockedKey: 'unlockedShareFrames', activeKey: 'activeShareFrame' },
};

const SHOP_ITEMS = [
  {
    id: 'extraHint',
    name: 'Pista Extra',
    desc: 'Añade una pista adicional a tu próxima partida. Revela el Tono (H) exacto del color.',
    price: 50,
    icon: '💡',
    stat: 'extraHints',
    maxStack: 3,
    section: 'upgrades',
  },
  {
    id: 'extraTime',
    name: 'Tiempo +1s',
    desc: 'Añade 1 segundo al temporizador de memorización en tu próxima partida. Funciona en todos los modos.',
    price: 75,
    icon: '⏱️',
    stat: 'extraTime',
    maxStack: 3,
    section: 'upgrades',
  },
  {
    id: 'extraRetry',
    name: 'Segunda Oportunidad',
    desc: 'Si fallas una ronda (menos de 5.0), podrás repetirla una vez. Se consume al inicio de la partida.',
    price: 130,
    icon: '🔄',
    stat: 'extraRetry',
    maxStack: 3,
    section: 'upgrades',
  },
  {
    id: 'inkMultiplier',
    name: 'Tinta x1.5',
    desc: 'Gana 1.5× más Gotas de Tinta durante las próximas 5 partidas.',
    price: 180,
    icon: '💰',
    stat: 'inkMultiplierGames',
    perPurchase: 5,
    section: 'upgrades',
  },
  {
    id: 'xpMultiplier',
    name: 'XP x2',
    desc: 'Gana el doble de experiencia durante las próximas 3 partidas. Ideal para subir de nivel rápido.',
    price: 220,
    icon: '⚡',
    stat: 'xpMultiplierGames',
    perPurchase: 3,
    section: 'upgrades',
  },
  {
    id: 'streakShield',
    name: 'Racha Segura',
    desc: 'Si un día no juegas el Desafío Diario, tu racha no se romperá. Un escudo por compra.',
    price: 150,
    icon: '🛡️',
    stat: 'streakShield',
    maxStack: 3,
    section: 'upgrades',
  },
  {
    id: 'themeForest',
    name: 'Tema Bosque',
    desc: 'Las partículas del fondo adoptan tonos verdes. Cosmético permanente.',
    price: 350,
    icon: '🌿',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'themeOcean',
    name: 'Tema Océano',
    desc: 'Las partículas del fondo adoptan tonos azules. Cosmético permanente.',
    price: 350,
    icon: '🌊',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'themeFire',
    name: 'Tema Fuego',
    desc: 'Las partículas del fondo adoptan tonos naranja y rojo. Cosmético permanente.',
    price: 350,
    icon: '🔥',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'themeSpace',
    name: 'Tema Espacio',
    desc: 'Estrellas violeta-azuladas que titilan lentamente en el fondo. Cosmético permanente.',
    price: 380,
    icon: '✨',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'themeSakura',
    name: 'Tema Sakura',
    desc: 'Pétalos rosas que caen revoloteando por la pantalla. Cosmético permanente.',
    price: 380,
    icon: '🌸',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'themeNeon',
    name: 'Tema Neón',
    desc: 'Rombos eléctricos que ciclan de color sin parar. El más vistoso de todos.',
    price: 450,
    icon: '🟦',
    type: 'theme',
    section: 'cosmetics',
  },
  {
    id: 'tintero',
    name: 'Título: Tintero',
    desc: 'Muestra "🖊️ Maestro Tintero" como tu rango en la pantalla principal. Permanente.',
    price: 300,
    icon: '🖊️',
    type: 'title',
    titleText: '🖊️ Maestro Tintero',
    section: 'cosmetics',
  },
  {
    id: 'chromatico',
    name: 'Título: Cromático',
    desc: 'Muestra "🌈 Cromático Supreme" con efecto arcoiris en tu rango. Permanente.',
    price: 500,
    icon: '🌈',
    type: 'title',
    titleText: '🌈 Cromático Supreme',
    section: 'cosmetics',
  },
  {
    id: 'premiumConfetti',
    name: 'Confetti Premium',
    desc: 'Al terminar una partida con más de 7 puntos, el confetti usará los colores exactos que jugaste. Permanente.',
    price: 400,
    icon: '🎊',
    type: 'oneshot',
    stat: 'premiumConfetti',
    section: 'cosmetics',
  },
  {
    id: 'permHintBoost',
    name: 'Ojo Entrenado',
    desc: 'Todas tus partidas empiezan con 1 pista adicional permanente, para siempre. Se suma a la Pista Extra.',
    price: 600,
    icon: '👁️',
    type: 'oneshot',
    stat: 'permHintBoost',
    section: 'progression',
  },
  {
    id: 'permTimeBoost',
    name: 'Memoria de Hierro',
    desc: 'Todas tus partidas empiezan con 1 segundo extra de memorización, para siempre. Se suma a Tiempo +1s.',
    price: 600,
    icon: '🧠',
    type: 'oneshot',
    stat: 'permTimeBoost',
    section: 'progression',
  },
  {
    id: 'permRetryBoost',
    name: 'Manual del Maestro',
    desc: 'Todas tus partidas incluyen una Segunda Oportunidad gratis, para siempre. Se suma a las que compres.',
    price: 750,
    icon: '📖',
    type: 'oneshot',
    stat: 'permRetryBoost',
    section: 'progression',
  },
  {
    id: 'permInkBoost',
    name: 'Tintero Infinito',
    desc: 'Ganas un 10% más de Tinta en todas las partidas, para siempre. Se acumula con otros multiplicadores.',
    price: 900,
    icon: '💎',
    type: 'oneshot',
    stat: 'permInkBoost',
    section: 'progression',
  },
  {
    id: 'permXpBoost',
    name: 'Cerebro Cromático',
    desc: 'Ganas un 10% más de Experiencia en todas las partidas, para siempre. Se acumula con otros multiplicadores.',
    price: 900,
    icon: '🧬',
    type: 'oneshot',
    stat: 'permXpBoost',
    section: 'progression',
  },
  {
    id: 'skinCristal',
    name: 'Skin: Cristal',
    desc: 'Reskin completo: tarjetas de cristal pulido, transiciones de desenfoque líquido y sonidos de campanillas. Permanente.',
    price: 700,
    icon: '💎',
    type: 'uiskin',
    section: 'cosmetics',
  },
  {
    id: 'skinRetro',
    name: 'Skin: Retro Arcade',
    desc: 'Reskin completo: bordes duros estilo CRT, transición de escaneo con scanlines y sonidos 8-bit. Permanente.',
    price: 700,
    icon: '🕹️',
    type: 'uiskin',
    section: 'cosmetics',
  },
  {
    id: 'skinCyberpunk',
    name: 'Skin: Cyberpunk Neón',
    desc: 'Reskin completo: bordes glitch con separación RGB, transición de interferencia y sonidos synth. Permanente.',
    price: 700,
    icon: '🌆',
    type: 'uiskin',
    section: 'cosmetics',
  },
  {
    id: 'frameFire',
    name: 'Marco: Llamas',
    desc: 'Borde animado de fuego alrededor de tu insignia de tinta. Permanente.',
    price: 220,
    icon: '🔥',
    type: 'frame',
    section: 'cosmetics',
  },
  {
    id: 'frameIce',
    name: 'Marco: Hielo',
    desc: 'Borde animado con brillo helado alrededor de tu insignia de tinta. Permanente.',
    price: 220,
    icon: '❄️',
    type: 'frame',
    section: 'cosmetics',
  },
  {
    id: 'frameGold',
    name: 'Marco: Dorado',
    desc: 'Borde con destello dorado girando alrededor de tu insignia de tinta. Permanente.',
    price: 260,
    icon: '👑',
    type: 'frame',
    section: 'cosmetics',
  },
  {
    id: 'cursorDrop',
    name: 'Cursor: Gota',
    desc: 'El puntero del ratón se convierte en una gota de tinta. Permanente.',
    price: 150,
    icon: '💧',
    type: 'cursor',
    section: 'cosmetics',
  },
  {
    id: 'cursorStar',
    name: 'Cursor: Estrella',
    desc: 'El puntero del ratón se convierte en una estrella dorada. Permanente.',
    price: 150,
    icon: '⭐',
    type: 'cursor',
    section: 'cosmetics',
  },
  {
    id: 'cursorDiamond',
    name: 'Cursor: Diamante',
    desc: 'El puntero del ratón se convierte en un diamante cian. Permanente.',
    price: 150,
    icon: '💠',
    type: 'cursor',
    section: 'cosmetics',
  },
  {
    id: 'shareFrameGold',
    name: 'Marco de Tarjeta: Dorado',
    desc: 'Añade un marco dorado a tu tarjeta de resultado al compartirla. Permanente.',
    price: 180,
    icon: '🖼️',
    type: 'shareframe',
    section: 'cosmetics',
  },
  {
    id: 'shareFrameNeon',
    name: 'Marco de Tarjeta: Neón',
    desc: 'Añade un marco de doble línea neón a tu tarjeta de resultado. Permanente.',
    price: 180,
    icon: '🎴',
    type: 'shareframe',
    section: 'cosmetics',
  },
  {
    id: 'shareFrameFloral',
    name: 'Marco de Tarjeta: Floral',
    desc: 'Añade esquinas decoradas con flores a tu tarjeta de resultado. Permanente.',
    price: 180,
    icon: '🌸',
    type: 'shareframe',
    section: 'cosmetics',
  },
  {
    id: 'skinHalloween',
    name: 'Skin: Halloween',
    desc: 'Reskin de temporada: naranja/morado, murciélagos y sonidos siniestros. Solo disponible del 20 al 31 de octubre.',
    price: 700,
    icon: '🎃',
    type: 'uiskin',
    section: 'cosmetics',
    seasonal: { startMonth: 10, startDay: 20, endMonth: 10, endDay: 31 },
  },
  {
    id: 'skinXmas',
    name: 'Skin: Navidad',
    desc: 'Reskin de temporada: rojo/verde con nieve cayendo y campanillas. Solo disponible del 15 al 31 de diciembre.',
    price: 700,
    icon: '🎄',
    type: 'uiskin',
    section: 'cosmetics',
    seasonal: { startMonth: 12, startDay: 15, endMonth: 12, endDay: 31 },
  },
  {
    id: 'skinSummer',
    name: 'Skin: Verano',
    desc: 'Reskin de temporada: amarillo/turquesa con destellos de sol. Solo disponible del 21 de junio al 21 de septiembre.',
    price: 700,
    icon: '🏖️',
    type: 'uiskin',
    section: 'cosmetics',
    seasonal: { startMonth: 6, startDay: 21, endMonth: 9, endDay: 21 },
  },
];

// Ventana de fechas de un cosmético "de temporada" (null = sin restricción,
// siempre disponible). Soporta rangos que cruzan fin de año (ej. dic→ene).
function isSeasonalItemAvailable(item) {
  if (!item.seasonal) return true;
  const now = new Date();
  const cur = (now.getMonth() + 1) * 100 + now.getDate();
  const start = item.seasonal.startMonth * 100 + item.seasonal.startDay;
  const end = item.seasonal.endMonth * 100 + item.seasonal.endDay;
  return start <= end ? (cur >= start && cur <= end) : (cur >= start || cur <= end);
}

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
      const equip     = EQUIP_TYPES[item.type];
      const isOneshot = item.type === 'oneshot';
      const isOwned   = equip     ? (stats[equip.unlockedKey] || []).includes(item.id)
                      : isOneshot ? !!stats[item.stat]
                      : false;
      const isActive  = (equip && stats[equip.activeKey] === item.id)
                     || (isOneshot && !!stats[item.stat]);
      const owned     = (!equip && !isOneshot) ? (stats[item.stat] || 0) : 0;
      const affordable = (stats.ink || 0) >= item.price;
      const atMaxStack = item.maxStack !== undefined && owned >= item.maxStack;
      // Un cosmético "de temporada" ya comprado se conserva y se puede
      // equipar siempre — la fecha solo bloquea la COMPRA, no el uso.
      const seasonalOpen = isSeasonalItemAvailable(item);

      let btnClass = 'shop-item-btn';
      let btnDisabled = '';
      let btnLabel = `<span class="ink-drop">💧</span> ${item.price}`;

      if (equip || isOneshot) {
        if (isActive) {
          btnClass += ' active-theme'; btnDisabled = 'disabled';
          btnLabel = '✓ Activo';
        } else if (isOwned && !isOneshot) {
          btnLabel = 'Equipar';
        } else if (item.seasonal && !seasonalOpen) {
          btnClass += ' disabled'; btnDisabled = 'disabled';
          btnLabel = 'Fuera de temporada';
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
      } else if (item.seasonal && !isOwned) {
        const s = item.seasonal;
        ownedHtml = `<div class="shop-item-owned">${seasonalOpen ? '🎉 ¡Disponible ahora!' : `Disponible del ${s.startDay} de ${MONTH_NAMES[s.startMonth - 1]} al ${s.endDay} de ${MONTH_NAMES[s.endMonth - 1]}`}</div>`;
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

  const SECTIONS = [
    { id: 'upgrades',    label: 'Mejoras',    emoji: '⚡' },
    { id: 'cosmetics',   label: 'Cosmética',  emoji: '🎨' },
    { id: 'progression', label: 'Progresión', emoji: '🏆' },
  ];
  let activeSection = 'upgrades';

  function itemsForSection(id) {
    return SHOP_ITEMS.filter(i => (i.section || 'upgrades') === id);
  }

  function renderTabs() {
    return SECTIONS.map(s => `
      <button class="preset-btn shop-tab-btn${activeSection === s.id ? ' active' : ''}" data-section="${s.id}">${s.emoji}<br>${s.label}</button>
    `).join('');
  }

  function renderSection() {
    document.getElementById('shop-items').innerHTML = renderItems(itemsForSection(activeSection));
  }

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
    <div class="preset-row" id="shop-tabs" style="margin:2px 0 10px;">${renderTabs()}</div>
    <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px;">
      <div id="shop-items">${renderItems(itemsForSection(activeSection))}</div>
    </div>
  `;
  app.appendChild(el);

  gsap.fromTo(el,
    { y: 60, opacity: 0, scale: 0.97 },
    { y: 0,  opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
  );

  document.getElementById('shop-tabs').addEventListener('click', e => {
    const tabBtn = e.target.closest('.shop-tab-btn');
    if (!tabBtn || tabBtn.dataset.section === activeSection) return;
    cancelConfirm();
    playClick();
    activeSection = tabBtn.dataset.section;
    document.querySelectorAll('#shop-tabs .shop-tab-btn')
      .forEach(b => b.classList.toggle('active', b.dataset.section === activeSection));
    renderSection();
    const container = document.getElementById('shop-items');
    gsap.fromTo(container, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });
  });

  function doPurchase(btn) {
    const price       = parseInt(btn.dataset.price);
    const stat        = btn.dataset.stat;
    const perPurchase = parseInt(btn.dataset.perPurchase || '1');
    const itemId      = btn.dataset.id;
    const itemType    = btn.dataset.type;
    const itemDef     = SHOP_ITEMS.find(i => i.id === itemId);

    if (EQUIP_TYPES[itemType]) {
      const { unlockedKey, activeKey } = EQUIP_TYPES[itemType];
      const alreadyOwned = (stats[unlockedKey] || []).includes(itemId);
      if (!alreadyOwned) {
        if ((stats.ink || 0) < price) return;
        if (itemDef?.seasonal && !isSeasonalItemAvailable(itemDef)) return;
        stats.ink -= price;
        stats.c.inkSpent = (stats.c.inkSpent || 0) + price;
        stats[unlockedKey] = [...(stats[unlockedKey] || []), itemId];
      }
      stats[activeKey] = itemId;
      saveStats(); playSuccess(); vibrate(30);
      if (itemType === 'theme') updateAuroraColors();
      if (itemType === 'uiskin') applySkin();
      if (itemType === 'cursor') applyCursor();
      const pr = btn.getBoundingClientRect();
      spawnBurst(pr.left + pr.width / 2, pr.top + pr.height / 2, { count: 14, colors: ['#00d0ff', '#7ee8ff', '#ffffff'] });
      document.getElementById('shop-ink-count').textContent = renderInk();
      renderSection();
      return;
    }

    if (itemType === 'oneshot') {
      if ((stats.ink || 0) < price || stats[stat]) return;
      stats.ink -= price;
      stats.c.inkSpent = (stats.c.inkSpent || 0) + price;
      stats[stat] = true;
      saveStats(); playSuccess(); vibrate(30);
      const pr = btn.getBoundingClientRect();
      spawnBurst(pr.left + pr.width / 2, pr.top + pr.height / 2, { count: 14, colors: ['#00d0ff', '#7ee8ff', '#ffffff'] });
      document.getElementById('shop-ink-count').textContent = renderInk();
      renderSection();
      return;
    }

    if ((stats.ink || 0) < price) return;
    if (itemDef?.maxStack !== undefined && (stats[stat] || 0) >= itemDef.maxStack) return;
    stats.ink -= price;
    stats.c.inkSpent = (stats.c.inkSpent || 0) + price;
    stats[stat] = (stats[stat] || 0) + perPurchase;
    saveStats();
    playSuccess();
    vibrate(30);
    const pr = btn.getBoundingClientRect();
    spawnBurst(pr.left + pr.width / 2, pr.top + pr.height / 2, { count: 12, colors: ['#00d0ff', '#7ee8ff', '#ffffff'] });

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

  // Delegado en el contenedor (no en cada botón): las pestañas reemplazan el
  // HTML de #shop-items al cambiar de sección, y los botones nuevos deben
  // quedar clicables sin tener que volver a enlazar listeners uno a uno.
  document.getElementById('shop-items').addEventListener('click', e => {
    const btn = e.target.closest('.shop-item-btn');
    if (!btn || btn.disabled) return;
    e.stopPropagation();

    const itemId   = btn.dataset.id;
    const itemType = btn.dataset.type;
    const equip = EQUIP_TYPES[itemType];
    const isEquip = equip && (stats[equip.unlockedKey] || []).includes(itemId);

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

  el.addEventListener('click', () => cancelConfirm());

  document.getElementById('btn-shop-close').addEventListener('click', () => {
    cancelConfirm();
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => {
      el.remove();
      buildStart();
    }});
  });
}

// ── TEMPORADAS / PASE DE BATALLA ─────────────────────────────────────────────

function buildSeasonPass() {
  const { seasonNum, seasonId, daysLeft } = getSeasonInfo();
  if (stats.seasonId !== seasonId) {
    // Ver el pase sin haber jugado aún esta temporada: arranca en 0 sin
    // esperar a que termine una partida.
    stats.seasonId = seasonId;
    stats.seasonPoints = 0;
    stats.seasonClaimedTiers = [];
    saveStats();
  }

  const el = document.createElement('div');
  el.className = 'card shop-card';

  const tiers = getSeasonTiers(seasonNum);
  const claimed = stats.seasonClaimedTiers || [];
  const points = stats.seasonPoints || 0;

  function renderTiers() {
    return tiers.map((tier, i) => {
      const un = claimed.includes(i);
      const isThemeTier = !!tier.theme;
      const label = isThemeTier ? 'Tema exclusivo de la temporada' : `+${tier.ink} Tinta`;
      let extraBtn = '';
      if (isThemeTier && un) {
        const owned = (stats.unlockedThemes || []).includes(tier.theme);
        const active = stats.activeTheme === tier.theme;
        extraBtn = `<button class="shop-item-btn season-equip-btn" data-theme="${tier.theme}" ${active ? 'disabled' : ''} style="margin-left:8px; white-space:nowrap;">${active ? '✓ Activo' : 'Equipar'}</button>`;
      }
      return `
        <div class="ach-item${un ? ' unlocked' : ''}">
          <div class="ach-icon">${un ? (isThemeTier ? '🎨' : '🎟️') : '🔒'}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">Tramo ${i + 1}${isThemeTier ? ' · Exclusivo' : ''}</div>
            <div class="shop-item-desc">${tier.threshold} pts · ${label}</div>
          </div>
          ${extraBtn || `<div class="ach-reward${un ? ' done' : ''}">${un ? '✓' : `${tier.threshold - points > 0 ? tier.threshold - points : 0} pts`}</div>`}
        </div>`;
    }).join('');
  }

  const got = claimed.length;
  const total = tiers.length;

  el.innerHTML = `
    <div class="shop-header">
      <div class="shop-title">Pase de Temporada ${seasonId}</div>
      <button id="btn-season-close" class="btn-icon-close" aria-label="Cerrar pase de temporada">&times;</button>
    </div>
    <div class="ach-progress">
      <span>${points} pts · ${daysLeft} día${daysLeft === 1 ? '' : 's'} restantes</span>
      <div class="ach-progress-bar"><div style="width:${Math.round(got / total * 100)}%"></div></div>
    </div>
    <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px;" id="season-tier-list">${renderTiers()}</div>
  `;
  app.appendChild(el);
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
  const items = el.querySelectorAll('.ach-item');
  gsap.set(items, { x: 24, opacity: 0 });
  gsap.to(items, { x: 0, opacity: 1, stagger: 0.03, delay: 0.15, duration: 0.3, ease: 'power2.out' });

  el.querySelector('#season-tier-list').addEventListener('click', e => {
    const btn = e.target.closest('.season-equip-btn');
    if (!btn || btn.disabled) return;
    stats.activeTheme = btn.dataset.theme;
    saveStats(); playSuccess(); vibrate(30);
    updateAuroraColors();
    el.querySelectorAll('.season-equip-btn').forEach(b => {
      const active = b.dataset.theme === stats.activeTheme;
      b.disabled = active;
      b.textContent = active ? '✓ Activo' : 'Equipar';
    });
  });

  document.getElementById('btn-season-close').addEventListener('click', () => {
    playClick();
    gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => { el.remove(); buildStart(); } });
  });
}

// ── TABLA DE CLASIFICACIÓN GLOBAL (Desafío Diario) ──────────────────────────
// Requiere el endpoint /api/leaderboard (Vercel KV) desplegado; si no está
// configurado o no hay red, todo esto falla en silencio y el juego sigue
// funcionando exactamente igual sin tabla global.

function getPlayerId() {
  let id = localStorage.getItem('colorGamePlayerId');
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('colorGamePlayerId', id);
  }
  return id;
}

// Se llama al terminar el Desafío Diario: nunca bloquea ni afecta al flujo
// del juego si la petición falla (sin red, sin KV configurado, etc.).
function submitDailyScore(avg) {
  if (typeof fetch !== 'function') return;
  fetch('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId: getPlayerId(),
      name: stats.playerName || 'Anónimo',
      score: avg,
      date: getTodayStr(),
    }),
  }).catch(() => {});
}

function buildLeaderboard() {
  const el = document.createElement('div');
  el.className = 'card shop-card';
  const myId = getPlayerId();
  const today = getTodayStr();

  function renderNameEditor() {
    return `
      <div class="setting-row" style="margin-bottom:10px;">
        <div class="setting-info">
          <div class="setting-name">Tu nombre en la tabla</div>
          <div class="setting-desc">Se usa solo para el Desafío Diario global.</div>
        </div>
        <input id="lb-name-input" maxlength="18" placeholder="Anónimo" value="${(stats.playerName || '').replace(/"/g, '&quot;')}"
          style="width:110px; padding:8px 10px; border-radius:10px; border:1px solid #2a2a2a; background:#111; color:#fff; font-size:0.8rem; font-weight:700;">
      </div>`;
  }

  function renderBody(inner) {
    el.innerHTML = `
      <div class="shop-header">
        <div class="shop-title">Clasificación de Hoy</div>
        <button id="btn-lb-close" class="btn-icon-close" aria-label="Cerrar clasificación">&times;</button>
      </div>
      ${renderNameEditor()}
      <div class="custom-scrollbar" style="overflow-y:auto; flex:1; padding-right:4px;">${inner}</div>
    `;
    document.getElementById('btn-lb-close').addEventListener('click', () => {
      playClick();
      gsap.to(el, { y: 20, opacity: 0, duration: 0.2, onComplete: () => { el.remove(); buildStart(); } });
    });
    document.getElementById('lb-name-input').addEventListener('change', e => {
      stats.playerName = e.target.value.replace(/[<>]/g, '').slice(0, 18).trim();
      saveStats();
      playClick();
      if (stats.dailyPlayed[today] !== undefined) submitDailyScore(stats.dailyPlayed[today]);
    });
  }

  renderBody(`<div style="text-align:center; color:#666; padding:30px 0; font-size:0.85rem;">Cargando…</div>`);
  app.appendChild(el);
  gsap.fromTo(el, { y: 60, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });

  fetch(`/api/leaderboard?date=${encodeURIComponent(today)}`)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      const entries = (data.entries || []).sort((a, b) => b.score - a.score);
      if (!entries.length) {
        renderBody(`<div style="text-align:center; color:#666; padding:30px 0; font-size:0.85rem;">Nadie ha jugado el diario de hoy todavía.<br>¡Sé el primero!</div>`);
        return;
      }
      const rows = entries.map((e, i) => `
        <div class="ach-item${e.playerId === myId ? ' unlocked' : ''}">
          <div class="ach-icon" style="font-size:0.95rem;">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
          <div class="shop-item-info">
            <div class="shop-item-name">${e.name}${e.playerId === myId ? ' (tú)' : ''}</div>
          </div>
          <div class="ach-reward done" style="color:#fff;">${e.score.toFixed(2)}</div>
        </div>`).join('');
      renderBody(rows);
      gsap.set(el.querySelectorAll('.ach-item'), { x: 24, opacity: 0 });
      gsap.to(el.querySelectorAll('.ach-item'), { x: 0, opacity: 1, stagger: 0.03, duration: 0.3, ease: 'power2.out' });
    })
    .catch(() => {
      renderBody(`<div style="text-align:center; color:#666; padding:30px 0; font-size:0.8rem;">No se pudo cargar la clasificación global.<br><small>Puede que el servidor aún no esté configurado.</small></div>`);
    });
}

// ── GAME FLOW ─────────────────────────────────────────────────────────────────

function startGame(mode, opts = {}) {
  initAudio();
  G = {
    mode,
    isDaily: mode === 'daily',
    seed: mode === 'challenge' ? challengeSeed : (mode === 'daily' ? getTodayStr() : Math.random().toString().substring(2, 10)),
    round: 0,
    hints: (mode === 'survival' ? 3 : 1) + (stats.extraHints > 0 ? 1 : 0) + (stats.permHintBoost ? 1 : 0),
    hasRetry: stats.extraRetry > 0 || stats.permRetryBoost,
    retryUsed: false,
    combo: 0,
    lives: mode === 'survival' ? 3 : null,
    colors: [],
    guesses: [], scores: [],
    diffSecs: DIFFS[diffIdx].secs + (stats.extraTime > 0 ? 1 : 0) + (stats.permTimeBoost ? 1 : 0),
  };

  if (stats.extraHints > 0) { stats.extraHints--; saveStats(); }
  if (stats.extraTime > 0)  { stats.extraTime--;  saveStats(); }
  if (stats.extraRetry > 0) { stats.extraRetry--; saveStats(); }

  if (mode === 'daily') setSeed(getTodayStr());
  else if (mode === 'challenge') setSeed(challengeSeed);
  else clearSeed();

  if (mode === 'timed') {
    G.diffSecs = 1.5;                    // memorización relámpago: es contrarreloj
    G.timedEndsAt = Date.now() + 60000;  // 60 segundos globales
    startTimedHUD();
  }

  // Supervivencia y Contrarreloj generan colores sobre la marcha
  const numRounds = (mode === 'survival' || mode === 'timed') ? 1 : ROUNDS;
  if (mode === 'training' && opts.axis) {
    // Entrenamiento del punto débil: los otros dos componentes se quedan
    // fijos toda la partida, así lo ÚNICO que cambia (y lo único que hay
    // que memorizar) es justo el eje que peor se te da.
    const fixed = { h: randInt(0, 359), s: randInt(55, 90), v: randInt(45, 75) };
    for (let i = 0; i < numRounds; i++) {
      const c = { ...fixed };
      if (opts.axis === 'h') c.h = randInt(0, 359);
      else if (opts.axis === 's') c.s = randInt(5, 100);
      else c.v = randInt(15, 92);
      G.colors.push(c);
    }
  } else {
    for (let i = 0; i < numRounds; i++) {
      G.colors.push({ h: randInt(0, 359), s: randInt(40, 100), v: randInt(22, 82) });
    }
  }

  pActiveColor = null;
  buildMemorize(G.colors[0]);
}

// ── HUD del CONTRARRELOJ ─────────────────────────────────────────────────────

let timedIv = null;

function startTimedHUD() {
  stopTimedHUD();
  const hud = document.createElement('div');
  hud.className = 'timed-hud';
  hud.id = 'timed-hud';
  document.body.appendChild(hud);
  gsap.fromTo(hud, { y: -40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
  const tick = () => {
    const left = Math.max(0, (G.timedEndsAt || 0) - Date.now());
    const s = Math.ceil(left / 1000);
    hud.textContent = `⏱️ ${s}s`;
    hud.classList.toggle('urgent', s <= 10);
    if (left <= 0 && !G.timeUp) {
      G.timeUp = true;
      playBeepHigh();
      stopTimedHUD();
      // Cerrar la partida según la pantalla en la que estemos
      if (document.getElementById('screen-guess')) {
        document.getElementById('btn-submit')?.click(); // envía la selección actual
      } else if (document.getElementById('screen-mem')) {
        if (timerIv !== null) { clearInterval(timerIv); timerIv = null; }
        gsap.killTweensOf('#screen-mem');
        document.getElementById('screen-mem')?.remove();
        document.querySelector('.mem-glow')?.remove();
        buildFinal();
      }
      // Si está en la pantalla de resultado, el botón siguiente llevará al final
    }
  };
  tick();
  timedIv = setInterval(tick, 250);
}

function stopTimedHUD() {
  if (timedIv) { clearInterval(timedIv); timedIv = null; }
  const hud = document.getElementById('timed-hud');
  if (hud) gsap.to(hud, { y: -40, opacity: 0, duration: 0.3, onComplete: () => hud.remove() });
}

// ── PARTICLES SYSTEM ────────────────────────────────────────────────────────

const THEME_COLORS = {
  themeForest: '#2d6a4f',
  themeOcean:  '#0369a1',
  themeFire:   '#ea580c',
  themeSpace:  '#7c5cff',
  themeSakura: '#f472b6',
  themeNeon:   '#00e5ff',
};

const pCanvas = document.getElementById('particles-canvas');
const pCtx = pCanvas.getContext('2d');
let particles = [];
let pActiveColor = null;

function initParticles() {
  if (!pCanvas) return;
  const density = effPerf().particles;
  if (density === 'none') {
    pCanvas.width = 1;
    pCanvas.height = 1;
    pCanvas.style.display = 'none';
    particles = [];
    return;
  }
  pCanvas.style.display = '';
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  const count = density === 'low' ? 30 : density === 'ultra' ? 95 : 55;
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * pCanvas.width,
    y: Math.random() * pCanvas.height,
    // Radio y tono cuantizados en pasos: así muchas partículas comparten sprite.
    r: Math.round((Math.random() * 2.5 + 1.2) * 2) / 2,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -(Math.random() * 0.8 + 0.2),
    alpha: Math.random() * 0.5 + 0.3,
    phase: Math.random() * Math.PI * 2,
    hueOffset: Math.round(((Math.random() - 0.5) * 30) / 6) * 6 // Variación de tono para cada partícula
  }));
}

// El brillo (shadowBlur) por partícula era, con diferencia, lo más caro de
// pintar en cada frame. Ahora cada combinación forma+color+radio se rasteriza
// UNA sola vez en un mini-canvas y luego solo se copia con drawImage (barato).
const pSprites = new Map();
function getSprite(shape, color, r) {
  const key = shape + '|' + color + '|' + r;
  let sp = pSprites.get(key);
  if (sp) return sp;
  if (pSprites.size > 240) pSprites.clear();
  const blur = isMobile ? 0 : (shape === 'flame' ? 15 : 10);
  const pad = blur + 3;
  const w = Math.ceil((shape === 'leaf' ? r * 3.6 : shape === 'star' ? r * 3.2 : r * 2) + pad * 2);
  const h = Math.ceil((shape === 'leaf' ? r * 1.6 : shape === 'star' ? r * 3.2 : (shape === 'flame' ? r * 2.5 : r * 2)) + pad * 2);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = color; x.strokeStyle = color;
  x.shadowColor = color; x.shadowBlur = blur;
  const cx = w / 2, cy = h / 2;
  if (shape === 'leaf') {
    x.beginPath(); x.ellipse(cx, cy, r * 1.8, r * 0.8, 0, 0, Math.PI * 2); x.fill();
  } else if (shape === 'bubble') {
    x.lineWidth = 1.5;
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.stroke();
  } else if (shape === 'flame') {
    x.beginPath();
    x.moveTo(cx, cy - r * 1.25);
    x.lineTo(cx - r, cy + r * 1.25);
    x.lineTo(cx + r, cy + r * 1.25);
    x.closePath(); x.fill();
  } else if (shape === 'star') {
    // Destello de 4 puntas para el tema Espacio
    x.beginPath();
    x.moveTo(cx, cy - r * 1.6); x.lineTo(cx + r * 0.35, cy - r * 0.35);
    x.lineTo(cx + r * 1.6, cy); x.lineTo(cx + r * 0.35, cy + r * 0.35);
    x.lineTo(cx, cy + r * 1.6); x.lineTo(cx - r * 0.35, cy + r * 0.35);
    x.lineTo(cx - r * 1.6, cy); x.lineTo(cx - r * 0.35, cy - r * 0.35);
    x.closePath(); x.fill();
  } else if (shape === 'square') {
    // Rombo neón para el tema Neón
    x.save();
    x.translate(cx, cy); x.rotate(Math.PI / 4);
    x.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
    x.restore();
  } else { // 'dot' y burbujas rellenas
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
  }
  sp = { c, hw: w / 2, hh: h / 2 };
  pSprites.set(key, sp);
  return sp;
}

let pPaused = false;
let pLoopRunning = false;
let lastPDraw = 0;
function drawParticles(now) {
  if (!pCanvas || pPaused || effPerf().particles === 'none') { pLoopRunning = false; return; }
  pLoopRunning = true;
  requestAnimationFrame(drawParticles);

  now = now || performance.now();
  if (now - lastPDraw < 33) return; 
  lastPDraw = now;

  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  
  const theme = stats.activeTheme;
  const isSeasonTheme = !!theme && theme.startsWith('seasonTheme_');
  const seasonHue = isSeasonTheme ? (parseInt(theme.split('_')[1], 10) || 0) : 0;
  // Sin tema comprado: el fondo por defecto varía solo con la hora real —
  // luciérnagas de noche, destello dorado de día. No se aplica si hay un
  // tema activo (esos ya tienen su propia paleta deliberada).
  const curHour = new Date().getHours();
  const isNight = !theme && (curHour >= 21 || curHour < 6);
  const baseColor = pActiveColor
    ? hsvToCss(pActiveColor.h, pActiveColor.s, pActiveColor.v)
    : (isSeasonTheme ? `hsl(${seasonHue}, 85%, 65%)` : (theme ? THEME_COLORS[theme] : '#888888'));

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    pCtx.globalAlpha = p.alpha;

    // Variación de color por partícula para temas naturales
    // (luminosidad cuantizada en pasos de 5 para reutilizar sprites)
    let pColor = baseColor;
    const light = 50 + Math.round(p.alpha * 4) * 5;
    if (theme === 'themeForest' && !pActiveColor) {
      pColor = `hsl(${140 + p.hueOffset}, 45%, ${light}%)`;
    } else if (theme === 'themeFire' && !pActiveColor) {
      pColor = `hsl(${20 + p.hueOffset}, 85%, ${light}%)`;
    } else if (theme === 'themeSpace' && !pActiveColor) {
      pColor = `hsl(${245 + p.hueOffset}, 75%, ${Math.min(85, light + 15)}%)`;
    } else if (theme === 'themeSakura' && !pActiveColor) {
      pColor = `hsl(${330 + p.hueOffset}, 80%, ${light}%)`;
    } else if (theme === 'themeNeon' && !pActiveColor) {
      // Ciclo de matiz cuantizado en pasos de tiempo: da el efecto "neón
      // pulsante" reusando siempre el mismo puñado de sprites cacheados
      // en vez de generar uno nuevo por frame.
      const neonHue = Math.floor(now / 400) % 12 * 30;
      pColor = `hsl(${(neonHue + p.hueOffset) % 360}, 90%, 60%)`;
    } else if (isSeasonTheme && !pActiveColor) {
      pColor = `hsl(${(seasonHue + p.hueOffset + 360) % 360}, 85%, ${Math.min(85, light + 10)}%)`;
    } else if (!theme && !pActiveColor) {
      pColor = isNight
        ? `hsl(${70 + p.hueOffset}, 85%, ${Math.min(80, light + 10)}%)`  // luciérnagas
        : `hsl(${45 + p.hueOffset}, 90%, ${Math.min(80, light + 8)}%)`;   // sol
    }

    const sway = Math.sin(now / 1200 + p.phase) * (theme === 'themeSakura' ? 0.65 : 0.3);

    if (theme === 'themeForest') {
      // HOJAS: Elipses rotando suavemente
      const sp = getSprite('leaf', pColor, p.r);
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(p.phase + now / 1500);
      pCtx.drawImage(sp.c, -sp.hw, -sp.hh);
      pCtx.restore();
    }
    else if (theme === 'themeOcean') {
      // BURBUJAS: Círculos con borde y algunos rellenos
      const sp = getSprite(i % 2 === 0 ? 'bubble' : 'dot', pColor, p.r);
      pCtx.drawImage(sp.c, p.x - sp.hw, p.y - sp.hh);
    }
    else if (theme === 'themeFire') {
      // CHISPAS: Triángulos/Llamas que parpadean
      const flicker = Math.sin(now / 80 + p.phase) * 0.3 + 0.7;
      pCtx.globalAlpha = p.alpha * flicker;
      const sp = getSprite('flame', pColor, p.r);
      pCtx.drawImage(sp.c, p.x - sp.hw, (p.y - p.r * 1.25) - sp.hh);
    }
    else if (theme === 'themeSpace') {
      // ESTRELLAS: destellos que titilan lentamente
      const twinkle = Math.sin(now / 500 + p.phase * 3) * 0.35 + 0.65;
      pCtx.globalAlpha = p.alpha * twinkle;
      const sp = getSprite('star', pColor, p.r);
      pCtx.drawImage(sp.c, p.x - sp.hw, p.y - sp.hh);
    }
    else if (theme === 'themeSakura') {
      // PÉTALOS: caen revoloteando en vez de flotar hacia arriba
      const sp = getSprite('leaf', pColor, p.r);
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(-p.phase - now / 900);
      pCtx.drawImage(sp.c, -sp.hw, -sp.hh);
      pCtx.restore();
    }
    else if (theme === 'themeNeon') {
      // RÓMBOS: parpadeo eléctrico ligero además del ciclo de color
      const flicker = Math.sin(now / 140 + p.phase) * 0.25 + 0.75;
      pCtx.globalAlpha = p.alpha * flicker;
      const sp = getSprite('square', pColor, p.r);
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(now / 2000 + p.phase);
      pCtx.drawImage(sp.c, -sp.hw, -sp.hh);
      pCtx.restore();
    }
    else if (isSeasonTheme) {
      // DESTELLOS DE TEMPORADA: como el tema Espacio pero con el tono
      // exclusivo de la temporada y un titileo más lento y marcado.
      const twinkle = Math.sin(now / 650 + p.phase * 2) * 0.4 + 0.6;
      pCtx.globalAlpha = p.alpha * twinkle;
      const sp = getSprite('star', pColor, p.r);
      pCtx.save();
      pCtx.translate(p.x, p.y);
      pCtx.rotate(now / 3000 + p.phase);
      pCtx.drawImage(sp.c, -sp.hw, -sp.hh);
      pCtx.restore();
    }
    else {
      // PUNTOS: el efecto por defecto. De noche parpadean como luciérnagas.
      if (isNight && !pActiveColor) {
        const flicker = Math.sin(now / 700 + p.phase * 2) * 0.4 + 0.6;
        pCtx.globalAlpha = p.alpha * flicker;
      }
      const sp = getSprite('dot', pColor, p.r);
      pCtx.drawImage(sp.c, p.x - sp.hw, p.y - sp.hh);
    }

    // FÍSICA
    const speedMult = theme === 'themeFire' ? 1.8 : (theme === 'themeOcean' ? 0.7 : (theme === 'themeSpace' ? 0.45 : 1));
    const yDir = theme === 'themeSakura' ? -1 : 1; // los pétalos caen: invierte el ascenso base
    p.x += (p.vx + sway) * speedMult;
    p.y += p.vy * speedMult * yDir;

    if (p.y < -30) {
      p.y = pCanvas.height + 30;
      p.x = Math.random() * pCanvas.width;
    } else if (p.y > pCanvas.height + 30) {
      p.y = -30;
      p.x = Math.random() * pCanvas.width;
    }
    if (p.x < -30) p.x = pCanvas.width + 30;
    if (p.x > pCanvas.width + 30) p.x = -30;
  }
}

// El bucle de dibujo se detiene solo (drawParticles deja de reprogramarse)
// cuando las partículas están en "Ninguna" o la pestaña está oculta. Sin
// esto, reactivarlas desde Ajustes las dejaba inicializadas pero invisibles
// hasta recargar la página.
function ensureParticleLoop() {
  if (!pLoopRunning) drawParticles();
}

// Varios "resize" pueden llegar en el mismo frame (rotación, barra de
// direcciones móvil); se agrupan en uno solo para no reconstruir el array
// de partículas más de lo necesario.
let resizeRAF = null;
window.addEventListener('resize', () => {
  if (resizeRAF) return;
  resizeRAF = requestAnimationFrame(() => { resizeRAF = null; initParticles(); });
});
document.addEventListener('visibilitychange', () => {
  pPaused = document.hidden;
  if (!pPaused) ensureParticleLoop();
});
applyPerf();

// ── FONDO AURORA ─────────────────────────────────────────────────────────────
// Colorea las 3 manchas del fondo según el tema de partículas activo, para
// que equipar un tema (tienda o Pase de Temporada) también cambie el
// ambiente general de la app, no solo las partículas.
const AURORA_THEME_HUES = {
  themeForest: ['#2d6a4f', '#52b788', '#95d5b2'],
  themeOcean:  ['#0369a1', '#38bdf8', '#7dd3fc'],
  themeFire:   ['#ea580c', '#ff8c42', '#ffcc66'],
  themeSpace:  ['#4c1d95', '#7c5cff', '#a78bfa'],
  themeSakura: ['#db2777', '#f472b6', '#fbcfe8'],
  themeNeon:   ['#00e5ff', '#ff00e5', '#eaff00'],
};
function updateAuroraColors() {
  const blobs = document.querySelectorAll('.aurora-blob');
  if (!blobs.length) return;
  const theme = stats.activeTheme;
  let colors;
  if (theme && theme.startsWith('seasonTheme_')) {
    const hue = parseInt(theme.split('_')[1], 10) || 0;
    colors = [0, 40, -40].map(off => `hsl(${(hue + off + 360) % 360}, 80%, 60%)`);
  } else {
    colors = AURORA_THEME_HUES[theme] || ['#ff416c', '#45dcff', '#4cd964'];
  }
  blobs.forEach((b, i) => b.style.setProperty('--c', colors[i % colors.length]));
}
updateAuroraColors();

// El fondo entero se desplaza un poco hacia el puntero (escritorio) o según
// la inclinación del móvil (giróscopo): paralaje barato, un solo transform
// en el contenedor con transición CSS de retardo para que se sienta
// "flotante". Cada mancha sigue con su propia deriva CSS — transform de
// padre e hijo se combinan solos, no hay pisada de propiedades.
if (!prefersReducedMotion) {
  const auroraBg = document.getElementById('aurora-bg');
  if (auroraBg) {
    if (!isMobile) {
      let auroraRAF = null;
      window.addEventListener('pointermove', e => {
        if (auroraRAF) return;
        auroraRAF = requestAnimationFrame(() => {
          auroraRAF = null;
          const nx = (e.clientX / window.innerWidth  - 0.5) * 2;
          const ny = (e.clientY / window.innerHeight - 0.5) * 2;
          auroraBg.style.transform = `translate(${nx * 22}px, ${ny * 18}px)`;
        });
      });
    } else if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      // Solo donde el navegador NO exige un permiso explícito (iOS 13+ sí lo
      // exige): pedir permiso solo por un fondo decorativo sería demasiada
      // fricción, así que en iOS esta mejora simplemente no se activa.
      let gyroRAF = null;
      window.addEventListener('deviceorientation', e => {
        if (gyroRAF || e.beta === null || e.gamma === null) return;
        gyroRAF = requestAnimationFrame(() => {
          gyroRAF = null;
          const nx = Math.max(-1, Math.min(1, e.gamma / 30));
          const ny = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); // ~45° = móvil sujeto normal
          auroraBg.style.transform = `translate(${nx * 22}px, ${ny * 18}px)`;
        });
      });
    }
  }
}

// Tocar/hacer clic en el fondo (fuera de tarjetas y botones) suelta una
// mini explosión con los colores del tema activo — el mismo spawnBurst de
// siempre, solo que ahora también reacciona a la nada, no solo a botones.
document.addEventListener('pointerdown', e => {
  if (e.target.closest('.card, button, input, a, [role="button"]')) return;
  const theme = stats.activeTheme;
  let colors = null;
  if (theme && theme.startsWith('seasonTheme_')) {
    const hue = parseInt(theme.split('_')[1], 10) || 0;
    colors = [`hsl(${hue},85%,65%)`, '#ffffff'];
  } else if (theme && THEME_COLORS[theme]) {
    colors = [THEME_COLORS[theme], '#ffffff'];
  }
  spawnBurst(e.clientX, e.clientY, { count: 8, colors });
});

// Y TODO botón del juego suelta un chispazo al pulsarlo, esté donde esté
// (menú, tienda, ajustes, resultado…). Pequeño a propósito: los momentos
// importantes ya tienen sus explosiones grandes propias y así no compiten.
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('button, [role="button"]');
  if (!btn || btn.disabled) return;
  spawnBurst(e.clientX, e.clientY, { count: 5 });
});

// Estela de cursor permanente: apagada por defecto (activable en Ajustes),
// throttled para que no dispare spawnBurst en cada pixel de movimiento.
let lastCursorTrailTime = 0;
if (!prefersReducedMotion && !isMobile) {
  window.addEventListener('pointermove', e => {
    if (!stats.cursorTrailEnabled) return;
    const now = performance.now();
    if (now - lastCursorTrailTime < 70) return;
    lastCursorTrailTime = now;
    spawnBurst(e.clientX, e.clientY, { count: 1 });
  });
}

// ── SKINS DE INTERFAZ ────────────────────────────────────────────────────────
// Un solo atributo en <body> activa todas las reglas CSS del skin (tarjetas,
// botones, fuente…). playTone(), colorWipe() y launchConfetti() también lo
// consultan para variar sonido/transición/confeti sin más "modo" que este.
function applySkin() {
  document.body.dataset.skin = stats.activeSkin || 'default';
}
applySkin();

function applyCursor() {
  document.body.dataset.cursor = stats.activeCursor || 'default';
}
applyCursor();

// ── PWA: instalable + recordatorio del Desafío Diario ──────────────────────
// El recordatorio es "best effort": Periodic Background Sync solo lo soporta
// Chrome/Edge en Android con la PWA instalada y suficiente "engagement" con
// el sitio (el navegador decide, no hay forma de forzarlo). Sin ese soporte
// (Safari/iOS, Firefox, desktop) la app funciona igual, simplemente sin el
// aviso cuando está cerrada — no existe forma de dar push real sin backend.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

function openSWFlagsDB() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('colorGameSW', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('flags');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

// Se llama al completar el Desafío Diario y una vez al arrancar, para que el
// Service Worker (que no puede leer localStorage) sepa si ya se jugó hoy.
async function syncDailyFlagForSW() {
  if (!('indexedDB' in window)) return;
  try {
    const db = await openSWFlagsDB();
    const tx = db.transaction('flags', 'readwrite');
    const today = stats.dailyPlayed[getTodayStr()] !== undefined ? getTodayStr() : null;
    if (today) tx.objectStore('flags').put(today, 'lastPlayedDailyDate');
  } catch (_) { /* IndexedDB no disponible: sin recordatorio, el juego sigue igual */ }
}
syncDailyFlagForSW();

async function enableDailyReminder() {
  if (!('Notification' in window)) return false;
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return false;
  stats.dailyReminderEnabled = true;
  saveStats();
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await reg.periodicSync.register('daily-streak-check', { minInterval: 20 * 60 * 60 * 1000 });
      }
    }
  } catch (_) { /* sin soporte: el permiso de notificación queda igual concedido */ }
  return true;
}

function disableDailyReminder() {
  stats.dailyReminderEnabled = false;
  saveStats();
  navigator.serviceWorker?.ready
    .then(reg => reg.periodicSync?.unregister('daily-streak-check'))
    .catch(() => {});
}

// ── INIT ──────────────────────────────────────────────────────────────────────

try {
  buildStart();
} catch(e) {
  console.error('buildStart failed:', e);
  app.innerHTML = `<div class="card start-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:40px 24px;">
    <div style="font-size:3rem;font-weight:900;letter-spacing:-2px;">color</div>
    <div style="color:#888;font-size:0.85rem;text-align:center;">Error al cargar. Recarga la página.<br><small style="color:#555">${e.message}</small></div>
    <button onclick="location.reload()" style="padding:12px 28px;border-radius:50px;background:#fff;color:#111;font-weight:800;border:none;font-size:0.9rem;cursor:pointer;margin-top:8px;">Recargar</button>
  </div>`;
}
