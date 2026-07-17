// Tabla de clasificación del Desafío Diario, respaldada por Vercel KV
// (Redis gestionado). Como todo el mundo juega los mismos colores ese día
// (misma semilla), comparar puntuaciones es justo — a diferencia de un
// "mejor puntuación histórica" que mezclaría dificultades distintas.
//
// Aviso de seguridad: no hay autenticación de usuarios, así que esto es
// honestidad, no un sistema anti-trampas — cualquiera con conocimientos
// técnicos podría llamar a este endpoint directamente y mandar una
// puntuación falsa. Para un juego casual es un riesgo aceptable, pero no
// lo trates como una clasificación "oficial" a prueba de manipulación.
import { kv } from '@vercel/kv';

const MAX_NAME_LEN = 18;
const MAX_ENTRIES = 20;
const DATE_RE = /^\d{4}-\d{1,2}-\d{1,2}$/;

function sanitizeName(raw) {
  const cleaned = String(raw || '').replace(/[<>]/g, '').trim().slice(0, MAX_NAME_LEN);
  return cleaned || 'Anónimo';
}

// @vercel/kv ha cambiado la forma exacta que devuelve zrange con
// withScores entre versiones (array plano vs array de objetos); esto
// soporta ambas para no depender de una versión concreta del paquete.
function parseZRangeResult(raw) {
  const entries = [];
  if (!Array.isArray(raw)) return entries;
  if (raw.length && typeof raw[0] === 'object' && raw[0] !== null && 'member' in raw[0]) {
    for (const { member, score } of raw) entries.push({ member: String(member), score: Number(score) });
  } else {
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({ member: String(raw[i]), score: Number(raw[i + 1]) });
    }
  }
  return entries;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const date = String(req.query.date || '');
      if (!DATE_RE.test(date)) return res.status(400).json({ error: 'bad date' });

      const key = `lb:${date}`;
      const raw = await kv.zrange(key, 0, MAX_ENTRIES - 1, { rev: true, withScores: true });
      const entries = parseZRangeResult(raw).map(({ member, score }) => {
        const sep = member.indexOf('::');
        return {
          playerId: sep === -1 ? member : member.slice(0, sep),
          name: sep === -1 ? 'Anónimo' : member.slice(sep + 2),
          score,
        };
      });
      return res.status(200).json({ date, entries });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { playerId, name, score, date } = body || {};

      if (typeof playerId !== 'string' || !playerId || playerId.length > 40) {
        return res.status(400).json({ error: 'bad playerId' });
      }
      if (!DATE_RE.test(date || '')) return res.status(400).json({ error: 'bad date' });
      const numScore = Number(score);
      if (!Number.isFinite(numScore) || numScore < 0 || numScore > 10) {
        return res.status(400).json({ error: 'bad score' });
      }

      const key = `lb:${date}`;
      const member = `${playerId}::${sanitizeName(name)}`;
      const current = await kv.zscore(key, member);
      if (current === null || current === undefined || numScore > Number(current)) {
        await kv.zadd(key, { score: numScore, member });
      }
      await kv.expire(key, 60 * 60 * 24 * 3); // autolimpieza: 3 días

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    // Si Vercel KV no está configurado todavía (faltan las variables de
    // entorno de la integración), esto falla limpio en vez de tirar un
    // stack trace crudo al cliente.
    return res.status(500).json({ error: 'leaderboard unavailable' });
  }
}
