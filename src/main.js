// ============================================================
//  POINT D'ENTRÉE — initialise tout et lance la boucle d'affichage.
// ============================================================
import '@fontsource/press-start-2p';
import './styles.css';
import { Snd } from './audio/audio.js';
import { game } from './core/state.js';
import { makeAmbient, pause, updateAmbient } from './game/run.js';
import { update } from './game/update.js';
import { applyDom } from './i18n/i18n.js';
import { initInput, resize } from './input.js';
import { initPlatform, isNative } from './platform/native.js';
import { render } from './render/renderer.js';
import { F8, buildSprites, cssTiles, dither, makeBG } from './render/sprites.js';
import { buildMap, goBack, initScreens, show } from './ui/screens.js';

let last = performance.now();
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (game.state === 'play' && game.run) update(dt);
  else if (game.state === 'menu' && game.phase && game.phase.kind === 0) { updateAmbient(dt); Snd.frame(dt, { crowd: .3 }); }
  render();
  requestAnimationFrame(loop);
}

// Démarrage
applyDom();
resize(); buildSprites();
game.BGC = makeBG(); game.PAT = { red: dither('#F83800'), grey: dither('#7C7C7C') };
cssTiles(); buildMap(); makeAmbient();
initInput(); initScreens();
initPlatform({ onPause: () => { pause(); Snd.suspend(); }, onResume: () => Snd.resume(), onBack: goBack });
// Le son ne peut démarrer qu'après un premier contact de l'utilisateur (règle des navigateurs et d'iOS)
document.addEventListener('pointerdown', () => { Snd.init(); Snd.music('menu'); Snd.ambience('menu'); }, { once: true });
const fontLoad = document.fonts ? document.fonts.load(F8).catch(() => {}) : Promise.resolve();
Promise.race([fontLoad, new Promise(r => setTimeout(r, 1500))]).then(() => requestAnimationFrame(loop));
show('title');

// Version web : installable et jouable hors ligne (PWA)
if (!isNative && 'serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Mode test : ouvrez le jeu avec ?debug à la fin de l'adresse pour manipuler l'état dans la console
// (ex. game.run.ser = 100, game.phase.prog = game.phase.len pour sauter à la fin d'une phase)
if (new URLSearchParams(location.search).has('debug')) window.game = game;
