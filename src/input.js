// ============================================================
//  ENTRÉES : doigt / souris (glisser) et clavier. Taille de l'écran.
// ============================================================
import { Snd } from './audio/audio.js';
import { cv, stage } from './core/canvas.js';
import { game } from './core/state.js';
import { $, H, W } from './core/utils.js';
import { pause, resume } from './game/run.js';

export const input = { drag: false, off: { x: 0, y: 0 }, tgt: null, keys: {} };

// Le jeu garde un format 9:16 ; on agrandit par multiples entiers quand c'est possible (pixels nets)
export function resize() {
  const app = $('#app'), aw = app.clientWidth, ah = app.clientHeight, m = aw <= 480 ? 0 : 28;
  let w = Math.min(aw - m, (ah - m) * 9 / 16, 560);
  const k = w / 180; if (k >= 2) w = 180 * Math.floor(k);
  stage.style.width = Math.floor(w) + 'px'; stage.style.height = Math.floor(w * 16 / 9) + 'px';
}
const toLogical = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
const endDrag = () => { input.drag = false; input.tgt = null; };

export function initInput() {
  addEventListener('resize', resize);
  // Le doigt peut être posé n'importe où : le personnage suit le mouvement relatif
  cv.addEventListener('pointerdown', e => {
    Snd.init();
    if (!game.run || game.state !== 'play') return;
    const p = toLogical(e), pl = game.phase.pl;
    input.drag = true; input.off = { x: pl.x - p.x, y: pl.y - p.y }; input.tgt = { x: pl.x, y: pl.y };
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => { if (!input.drag) return; const p = toLogical(e); input.tgt = { x: p.x + input.off.x, y: p.y + input.off.y }; });
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); input.keys[k] = true;
    if ((k === 'p' || k === 'escape') && game.run) { if (game.state === 'play') pause(); else if (game.state === 'pause') resume(); }
    if (k.startsWith('arrow') && game.state === 'play') e.preventDefault();
  });
  addEventListener('keyup', e => { input.keys[e.key.toLowerCase()] = false; });
  // Mise en arrière-plan : pause automatique
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (game.state === 'play') pause(); Snd.suspend(); } else Snd.resume();
  });
  addEventListener('blur', () => { if (game.state === 'play') pause(); });
}
