import { ctx } from '../core/canvas.js';
import { hash } from '../core/utils.js';
import THEME from '../theme/index.js';
import { drawTiny } from './font.js';

// ============================================================
//  PIXEL ART — sprites originaux dessinés en code (style NES).
//  Un personnage = une TÊTE (8 lignes) + un CORPS (10 lignes), 12×18 pixels.
//  Chaque lettre = une couleur de la palette :
//    K contour · H cheveux · S peau · E yeux · C haut · P pantalon · F chaussures
//    A accessoire (casquette, bonnet…) · T cravate · W blanc
//  Les minuscules (h, s, c, p, a, m) sont des ombres calculées automatiquement.
//  Pour changer une tenue : modifiez PAL. Pour une coiffure : HEADS.
// ============================================================
export const B = v => Math.round(v / 2);
export const F8 = '8px "Press Start 2P", monospace';
export const ENAMEL = THEME.colors.enamel;

export function spr(rows, map) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)), c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = map[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } } });
  return c;
}
// Assombrit une couleur #RRGGBB (k = 0.75 → 25 % plus sombre)
export function darken(hex, k = .72) {
  const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- Coiffures (8 lignes × 12) ---------- */
const HEADS = {
  short:  ['...KKKKKK...', '..KHHHHHHK..', '.KHHHHHHHhK.', '.KHSSSSSShK.', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...'],
  long:   ['...KKKKKK...', '..KHHHHHHK..', '.KHHHHHHHhK.', 'KHHSSSSSShhK', 'KHSSESSESshK', 'KHSSSSSSSshK', 'KHHKSmmSKhhK', '.KKKKssKKKK.'],
  cap:    ['...KKKKKK...', '..KAAAAAAK..', '.KAAAAAAAaK.', 'KaaaaaaaaaaK', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...'],
  bald:   ['...KKKKKK...', '..KSSSSSSK..', '.KSSSSSSSsK.', '.KHSSSSSShK.', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...'],
  bun:    ['....KKKK....', '...KHHHhK...', '..KHHHHHHK..', '.KHSSSSSShK.', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...'],
  hood:   ['...KKKKKK...', '..KCCCCCCK..', '.KCCCCCCCcK.', '.KCKSSSSKcK.', '.KCSESSEScK.', '.KCSSSSSScK.', '.KCKSmmSKcK.', '..KKKssKKK..'],
  puff:   ['..KKKKKKKK..', '.KHHHHHHHhK.', 'KHHHHHHHHHhK', 'KHHSSSSSShhK', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...'],
  beanie: ['...KKKKKK...', '..KAAAAAAK..', '.KAAAAAAAaK.', '.KaaaaaaaaK.', '.KSSESSESsK.', '.KSSSSSSSsK.', '..KSSmmSsK..', '...KKssKK...']
};
/* ---------- Corps (10 lignes × 12) : [immobile, en marche] ---------- */
const LEGS0 = ['...KPPKPpK..', '...KPPKPpK..', '...KPPKPpK..', '...KFFKFFK..'];
const LEGS1 = ['..KPPKKPpK..', '..KPPK.KpPK.', '.KPPK..KpPK.', '.KFFK...KFFK'];
const TORSO = ['..KKCCCCKK..', '.KCCCCCCCcK.', 'KCCKCCCCcKcK', 'KCCKCCCCcKcK', 'KSSKCCCCcKsK'];
const TIE = ['..KKCWWCKK..', '.KCCCTTCCcK.', 'KCCKCTTCcKcK', 'KCCKCTTCcKcK', 'KSSKCTTCcKsK'];
const BODIES = {
  std:  [TORSO.concat(['.KKKPPPPpKK.'], LEGS0), TORSO.concat(['.KKKPPPPpKK.'], LEGS1)],
  coat: [TORSO.concat(['.KCCCCCCCcK.', '..KCCCCCcK..'], LEGS0.slice(1)), TORSO.concat(['.KCCCCCCCcK.', '..KCCCCCcK..'], LEGS1.slice(1))],
  tie:  [TIE.concat(['.KKKPPPPpKK.'], LEGS0), TIE.concat(['.KKKPPPPpKK.'], LEGS1)],
  robe: [TORSO.concat(['.KCCCCCCCcK.', '.KCCCCCCCcK.', 'KCCCCCCCCccK', 'KKKKKKKKKKKK', '...KFK.KFK..']),
         TORSO.concat(['.KCCCCCCCcK.', '.KCCCCCCCcK.', 'KCCCCCCCCccK', 'KKKKKKKKKKKK', '..KFK..KFK..'])]
};
const SIT_LEGS = ['.KKPPPPPpKK.', '..KFFKKFFK..'];
/* ---------- Enfant (9×13) ---------- */
const KTOP = ['..KKKKK..', '.KHHHHHK.', 'KHHHHHHhK', 'KHSSSSShK', 'KSESSSEsK', '.KSSmSsK.', '..KKsKK..', '.KCCCCcK.', 'KCKCCCKcK', 'KSKCCCKsK', '.KPPPPpK.'];
const KID = [KTOP.concat(['.KPK.KpK.', '.KFK.KFK.']), KTOP.concat(['KPK...KpK', 'KFK...KFK'])];

/* ---------- Palettes : tenues parisiennes ---------- */
export const PAL = {
  player:       { H: '#5A3A20', S: '#F0D0B0', C: '#F8B800', P: '#0000BC', F: '#F8F8F8', A: '#0058F8', head: 'cap' },
  shlagg:       { H: '#8A6A3A', S: '#E8C090', C: '#6B6B3A', P: '#4A3A2A', F: '#2A2018', head: 'long', body: 'coat' },
  shlagg_rolex: { H: '#8A6A3A', S: '#E8C090', C: '#5A2A5A', P: '#4A3A2A', F: '#C8A030', head: 'long', body: 'coat' },
  shiny0:       { H: '#F8D878', S: '#FCE8C0', C: '#F8B800', P: '#E8A030', F: '#F8F8F8', E: '#A83800', head: 'long', body: 'coat' },
  shiny1:       { H: '#F878F8', S: '#FCE0F0', C: '#E040C0', P: '#A040A0', F: '#F8F8F8', E: '#5A0050', head: 'long', body: 'coat' },
  shiny2:       { H: '#78F8F8', S: '#E0FCFC', C: '#3CBCFC', P: '#0078C8', F: '#F8F8F8', E: '#003860', head: 'long', body: 'coat' },
  shiny3:       { H: '#B8F818', S: '#F0FCD0', C: '#58D854', P: '#00A844', F: '#F8F8F8', E: '#005000', head: 'long', body: 'coat' },
  tchipeur:     { H: '#2A1A10', S: '#F0C8A0', C: '#D8432F', P: '#202020', F: '#F8F8F8', A: '#202020', head: 'beanie' },
  frotteur:     { H: '#9A9A9A', S: '#F0C8A0', C: '#B8A070', P: '#5A4A3A', F: '#101010', head: 'bald', body: 'coat' },
  susu:         { H: '#101010', S: '#F0C8A0', C: '#A8C8E8', P: '#2A3A5A', F: '#F8F8F8', head: 'short' },
  theologiste:  { H: '#C8C8C8', S: '#F0C8A0', C: '#F0F0E8', P: '#F0F0E8', F: '#5A3A20', head: 'bald', body: 'robe' },
  voleur:       { H: '#202020', S: '#F0C8A0', C: '#303038', P: '#202020', F: '#101010', head: 'hood' },
  artiste:      { H: '#E8B830', S: '#F0C8A0', C: '#9B2D8A', P: '#202020', F: '#F8F8F8', head: 'puff' },
  enfant:       { H: '#C8501E', S: '#F0C8A0', C: '#F2C230', P: '#2E5FA8', F: '#F8F8F8' },
  poussette:    { H: '#5A3A20', S: '#F0C8A0', C: '#C86A8A', P: '#2A2A3A', F: '#101010', head: 'long' },
  encombrant:   { H: '#E8D8B0', S: '#F0A890', C: '#4AA8D8', P: '#C8B080', F: '#F8F8F8', A: '#F8F8F8', head: 'cap' },
  runner:       { H: '#101010', S: '#F0C8A0', C: '#3AB86A', P: '#101010', F: '#F8F8F8', head: 'short' },
  controleur:   { H: '#1D2A5C', S: '#F0C8A0', C: '#1D2A5C', P: '#101828', F: '#101010', A: '#1D2A5C', T: '#2FD0A8', W: '#F8F8F8', head: 'cap', body: 'tie' },
  manifestant:  { H: '#3A2A1A', S: '#F0C8A0', C: '#F07D19', P: '#2A3A5A', F: '#101010', A: '#E83A2A', head: 'beanie' },
  trottinette:  { H: '#2A1A10', S: '#F0C8A0', C: '#3A3A48', P: '#202020', F: '#F8F8F8', A: '#101010', head: 'cap' },
  tousseur:     { H: '#7A6A5A', S: '#F0C8A0', C: '#7A8A5A', P: '#3A3A3A', F: '#2A2A2A', head: 'short', body: 'coat' },
  zombie:       { H: '#3A4A2A', S: '#8CB070', C: '#5A5A6A', P: '#3A3A4A', F: '#2A2A2A', E: '#F83800', head: 'short' },
  mendiant:     { H: '#6A6A6A', S: '#B87A4A', C: '#6A3A2A', P: '#3A3A3A', F: '#2A2A2A', A: '#3A5A3A', head: 'beanie', body: 'coat' },
  dame:         { H: '#F0F0F0', S: '#F0C8A0', C: '#B07AA0', P: '#5A4A7A', F: '#101010', head: 'bun', body: 'robe' },
  // La foule (wagon, groupes) : deb0…deb7
  deb0: { H: '#2A1A10', S: '#F0C8A0', C: '#1C2440', P: '#3A3A3A', F: '#101010', head: 'short' },
  deb1: { H: '#101010', S: '#7A4A2A', C: '#5A5A5A', P: '#2A3A5A', F: '#F8F8F8', head: 'short' },
  deb2: { H: '#C8A060', S: '#F0C8A0', C: '#B8A070', P: '#2A2A2A', F: '#5A3A20', head: 'long', body: 'coat' },
  deb3: { H: '#5A3020', S: '#C88050', C: '#7A1A2A', P: '#202020', F: '#101010', A: '#202020', head: 'cap' },
  deb4: { H: '#101010', S: '#5A3018', C: '#E8E0D0', P: '#3A4A6A', F: '#F8F8F8', head: 'puff' },
  deb5: { H: '#8A8A8A', S: '#F0C8A0', C: '#2A5A3A', P: '#3A3A3A', F: '#3A2A1A', head: 'bald', body: 'coat' },
  deb6: { H: '#D8A040', S: '#F8D8B8', C: '#202020', P: '#101010', F: '#F8F8F8', head: 'long' },
  deb7: { H: '#3A2A1A', S: '#B87A4A', C: '#4A7AB8', P: '#2A2A2A', F: '#101010', A: '#C83A3A', head: 'beanie' }
};
// Joueur pendant le Pardon : la tenue change de couleur en boucle
['#F83800', '#58D854', '#F8F8F8', '#3CBCFC'].forEach((c, i) => { PAL['pstar' + i] = Object.assign({}, PAL.player, { C: c, A: c }); });
export const SKINS = ['#F0C8A0', '#E0A878', '#B87A4A', '#7A4A2A'];
// Personnages négatifs (ceux qui font perdre de la sérénité) : uniquement les teintes claires
export const NEG_SKINS = [0, 1];
// Personnages bienveillants : toutes les teintes
export const KIND = ['mendiant', 'dame'];
// Tenues de foule (deb0…deb7) utilisées par les gêneurs : seulement celles à peau claire
export const LIGHT_DEB = [0, 2, 5, 6];
export const SKINNED = ['tchipeur', 'voleur', 'shlagg', 'shlagg_rolex', 'susu', 'frotteur', 'runner', 'artiste', 'mendiant', 'theologiste', 'encombrant',
                        'poussette', 'controleur', 'dame', 'manifestant', 'trottinette', 'tousseur'];

/* ---------- Fabrication des sprites (mis en cache) ---------- */
const CACHE = new Map();
function colorMap(pal) {
  const m = { K: '#000000', W: '#F8F8F8', E: pal.E || '#000000', T: pal.T || '#C8102E' };
  for (const k of ['H', 'S', 'C', 'P', 'F', 'A']) if (pal[k]) { m[k] = pal[k]; m[k.toLowerCase()] = darken(pal[k], k === 'S' ? .82 : .72); }
  m.m = darken(pal.S, .62);
  return m;
}
function palOf(key, skin) { const p = PAL[key] || PAL.deb0; return skin === undefined ? p : Object.assign({}, p, { S: SKINS[skin] }); }
// Personnage debout. key : clé de PAL · skin : index de SKINS (ou undefined) · frame : 0 ou 1
export function body(key, skin, frame = 0) {
  const id = 'b|' + key + '|' + skin + '|' + frame;
  let c = CACHE.get(id); if (c) return c;
  const p = palOf(key, skin);
  c = spr(HEADS[p.head || 'short'].concat(BODIES[p.body || 'std'][frame]), colorMap(p)); CACHE.set(id, c); return c;
}
// Personnage assis (12×15)
export function seated(key, skin) {
  const id = 's|' + key + '|' + skin;
  let c = CACHE.get(id); if (c) return c;
  const p = palOf(key, skin), bd = p.body === 'tie' ? TIE : TORSO;
  c = spr(HEADS[p.head || 'short'].concat(bd, SIT_LEGS), colorMap(p)); CACHE.set(id, c); return c;
}
// Enfant (9×13) ; sit = assis
export function kid(key, frame = 0, sit = false) {
  const id = 'k|' + key + '|' + frame + '|' + sit;
  let c = CACHE.get(id); if (c) return c;
  c = spr(sit ? KTOP.slice(0, 10) : KID[frame], colorMap(PAL[key])); CACHE.set(id, c); return c;
}

export const SP = {};
export function buildSprites() {
  const cm = { K: '#000000', Y: '#F8B800', W: '#F8F8F8', O: '#AC7C00' };
  SP.coin = [spr(['.KKKK.', 'KYWYYK', 'KWYYOK', 'KYYYOK', 'KYYOOK', '.KKKK.'], cm), spr(['..KK..', '.KYWK.', '.KYYK.', '.KYOK.', '.KYOK.', '..KK..'], cm)];
  SP.leaf = spr(['....KK.', '..KKGK.', '.KGGGK.', 'KGLGGK.', 'KGGLK..', '.KKK...', 'K......'], { K: '#000000', G: '#00A800', L: '#58D854' });
  // Pardon : deux mains jointes (11×12) et sa version mini pour le HUD (7×7)
  const HANDS = ['.....K.....', '....KYK....', '...KYKOK...', '...KYKOK...', '..KYYKOOK..', '..KYYKOOK..', '.KYYYKOOOK.', '.KYYYKOOOK.',
                 'KYYYYKOOOOK', 'KYYYKKKOOOK', 'KWWWK.KWWWK', 'KKKKK.KKKKK'];
  SP.hands = [spr(HANDS, { K: '#000000', Y: '#F8D878', O: '#E0A040', W: '#F8F8F8' }), spr(HANDS, { K: '#000000', Y: '#FCE8A8', O: '#F8B800', W: '#F8F8F8' })];
  SP.handsMini = spr(['...K...', '..KYK..', '.KYKOK.', '.KYKOK.', 'KYYKOOK', 'KWWKWWK', 'KKK.KKK'], { K: '#000000', Y: '#F8D878', O: '#E0A040', W: '#F8F8F8' });
  // Aura de sécurité : la bulle (9×9) et sa version mini (7×7)
  const bm = { K: '#000000', C: '#7FE0F8', c: '#3CA8D8', W: '#F8F8F8' };
  SP.bubble = spr(['..KKKKK..', '.KCCCCCK.', 'KCWWCCCCK', 'KCWCCCCCK', 'KCCCCCCCK', 'KCCCCCCcK', 'KCCCCCccK', '.KCCcccK.', '..KKKKK..'], bm);
  SP.bubbleMini = spr(['.KKKKK.', 'KCWCCCK', 'KWCCCCK', 'KCCCCCK', 'KCCCCcK', 'KCCCccK', '.KKKKK.'], bm);
  SP.gel = spr(['..KKK..', '..KRK..', '.KKKKK.', '.KWWWK.', 'KCCCCCK', 'KCWCCCK', 'KCWGGCK', 'KCCGGCK', 'KCCCCCK', '.KKKKK.'],
               { K: '#000000', R: '#E83A2A', W: '#F8F8F8', C: '#A8E0F0', G: '#2E8BD8' });
  SP.pq = spr(['.KKKKKKK.', 'KWWWWWWKK', 'KWWWWWKWK', 'KWWWWWKGK', 'KWWWWWKWK', 'KLLLLLLKK', '.KKKKKKK.'], { K: '#000000', W: '#F8F8F8', L: '#C8C8C8', G: '#8A8A8A' });
  SP.hstar = spr(['...K...', '..KGK..', 'KKKGKKK', 'KGGWGGK', '.KGGGK.', '.KGKGK.', '.KK.KK.'], { K: '#000000', G: '#2FD0A8', W: '#F8F8F8' });
  SP.pole = spr(['.KKKK.', 'KWWLLK', 'KWLLLK', 'KLLLGK', 'KLLGGK', '.KKKK.'], { K: '#000000', W: '#F8F8F8', L: '#BCBCBC', G: '#7C7C7C' });
  SP.stroller = spr(['..KKKKK..', '.KHHHHHK.', 'KHHKKKHHK', 'KBBBBBBBK', 'KBBBBBBBK', '.KKKKKKK.', '..K...K..', '.KWK.KWK.', '..K...K..'], { K: '#000000', H: '#6A6A80', B: '#3A3A48', W: '#BCBCBC' });
  SP.suit = spr(['..KKK..', '..K.K..', 'KKKKKKK', 'KRRRRRK', 'KRWRRRK', 'KRRRRRK', 'KRRRRWK', 'KKKKKKK'], { K: '#000000', R: '#2E7BC8', W: '#F2C230' });
  const pg = { K: '#000000', G: '#8A8C98', D: '#5A5C68', V: '#4AA87A', Y: '#E8A030' };
  SP.pigeon = [spr(['.KK.....', 'KGVK....', 'YKGGKKK.', '.KGGDDGK', '..KKGGK.', '...K..K.'], pg),
               spr(['K......K', 'DK.KK.KD', '.DKGVKD.', '..YGGGK.', '..KGDDK.', '...KKK..'], pg)];
  SP.rat = [spr(['.KK......', 'KGGKKKK..', 'KGGGGGGK.', '.K.K.K.KK'], { K: '#000000', G: '#6A5A4A' }),
            spr(['.KK......', 'KGGKKKK..', 'KGGGGGGKK', '..K.K.K..'], { K: '#000000', G: '#6A5A4A' })];
  SP.puff = [spr(['..KKK..', '.KWWWK.', 'KWWLWWK', 'KWLLLWK', 'KWWLWWK', '.KWWWK.', '..KKK..'], { K: '#000000', W: '#F8F8F8', L: '#BCBCBC' }),
             spr(['.K...K.', 'KWK.KWK', '.K.K.K.', '..KWK..', '.K.K.K.', 'KWK.KWK', '.K...K.'], { K: '#000000', W: '#F8F8F8' })];
}

/* ---------- Décor : carreaux, sol, affiches ---------- */
const COL = THEME.colors;
export function faience(g, x0, y0, w, h) {
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = COL.grout; g.fillRect(x0, y0, w, h);
  for (let row = 0; row * 4 < h; row++) {
    const off = row % 2 ? -3 : 0;
    for (let col = 0; col * 6 + off < w; col++) {
      const x = x0 + col * 6 + off, y = y0 + row * 4;
      g.fillStyle = COL.tile; g.fillRect(x, y, 5, 3);
      g.fillStyle = COL.tileHi; g.fillRect(x, y, 5, 1);
      g.fillStyle = COL.tileLo; g.fillRect(x, y + 2, 5, 1);
    }
  }
  g.restore();
}
export function floorTiles(g, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y += 8) for (let x = x0; x < x0 + w; x += 8) {
    const r = hash(x, y);
    g.fillStyle = ((x + y) / 8) % 2 ? COL.floorA : COL.floorB; g.fillRect(x, y, 8, 8);
    g.fillStyle = COL.floorLine; g.fillRect(x, y, 8, 1); g.fillRect(x, y, 1, 8);
    if (r < .09) { g.fillStyle = '#55574F'; g.fillRect(x + 2 + Math.floor(r * 50) % 4, y + 3, 2, 2); }   // chewing-gums
    if (r > .985) { g.fillStyle = '#F2F2F2'; g.fillRect(x + 3, y + 2, 3, 2); g.fillStyle = '#C8C8C8'; g.fillRect(x + 3, y + 4, 3, 1); }   // ticket par terre
  }
}
export function poster(g, x, y, i) {
  const P = COL.posters;
  g.fillStyle = '#000'; g.fillRect(x, y, 10, 22);
  g.fillStyle = P[i % P.length]; g.fillRect(x + 1, y + 1, 8, 20);
  g.fillStyle = '#F8F8F8'; g.fillRect(x + 2, y + 3, 6, 6);
  g.fillStyle = '#000'; g.fillRect(x + 3 + (i % 3), y + 5, 2, 2);
  g.fillStyle = '#F8F8F8'; g.fillRect(x + 2, y + 12, 6, 1); g.fillRect(x + 2, y + 15, 4, 1); g.fillRect(x + 2, y + 18, 5, 1);
}
export function wall(g, x, y, h, left) {
  faience(g, x, y, 12, h);
  g.fillStyle = COL.frieze; g.fillRect(left ? x + 10 : x, y, 2, h);
  g.fillStyle = '#3A3A3A'; g.fillRect(left ? x + 12 : x - 1, y, 1, h);
}
export function makeBG() {
  const c = document.createElement('canvas'); c.width = 180; c.height = 384; const g = c.getContext('2d');
  floorTiles(g, 12, 0, 156, 384);
  wall(g, 0, 0, 384, true); wall(g, 168, 0, 384, false);
  for (let k = 0; k < 4; k++) { poster(g, 0, 20 + k * 96, k); poster(g, 170, 68 + k * 96, k + 3); }
  return c;
}
export function dither(col) { const c = document.createElement('canvas'); c.width = 2; c.height = 2; const g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, 1, 1); g.fillRect(1, 1, 1, 1); return ctx.createPattern(c, 'repeat'); }
export function cssTiles() {
  const a = document.createElement('canvas'); a.width = 24; a.height = 8; faience(a.getContext('2d'), 0, 0, 24, 8);
  const b = document.createElement('canvas'); b.width = 6; b.height = 6; const g = b.getContext('2d');
  g.fillStyle = darken(COL.frieze, .7); g.fillRect(0, 0, 6, 6); g.fillStyle = COL.frieze; g.fillRect(0, 0, 5, 5); g.fillStyle = '#F8A050'; g.fillRect(0, 0, 5, 1);
  document.documentElement.style.setProperty('--bricks', `url(${a.toDataURL()})`);
  document.documentElement.style.setProperty('--blocks', `url(${b.toDataURL()})`);
}
export function sparkle(c, x, y, t, col = '#F8D878', r = 9) {
  c.fillStyle = col;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 2, s = (i + Math.floor(t * 6)) % 2 ? 1 : 2; c.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), s, s); }
}
// Petite étoile scintillante en croix
function twinkle(c, x, y, col) { c.fillStyle = col; c.fillRect(x, y - 1, 1, 3); c.fillRect(x - 1, y, 3, 1); }

/* ---------- Accessoires dessinés par-dessus ---------- */
// Masque (mode Pandémie) : 'on' = bien porté, 'nose' = sous le nez (classique)
export function drawMask(c, x, y, m) {
  if (!m) return;
  c.fillStyle = '#000'; c.fillRect(x - 5, y - 8, 1, 1); c.fillRect(x + 4, y - 8, 1, 1);
  c.fillStyle = '#BFE6F5';
  if (m === 'on') { c.fillRect(x - 4, y - 7, 8, 2); c.fillStyle = '#8CC8E0'; c.fillRect(x - 4, y - 6, 8, 1); }
  else { c.fillRect(x - 3, y - 6, 6, 2); c.fillStyle = '#8CC8E0'; c.fillRect(x - 3, y - 5, 6, 1); }
}
function crowdBits(c, x, y, v) {
  if (v % 3 === 0) { c.fillStyle = '#202020'; c.fillRect(x - 5, y - 12, 10, 1); c.fillStyle = '#E83A2A'; c.fillRect(x - 6, y - 10, 1, 3); c.fillRect(x + 5, y - 10, 1, 3); }   // casque audio
  else if (v % 3 === 1) { c.fillStyle = '#000'; c.fillRect(x + 4, y - 2, 3, 4); c.fillStyle = '#8CE0FF'; c.fillRect(x + 5, y - 1, 1, 2); }                            // téléphone
}

// Dessine un personnage ou un objet. (px, py) : position en pixels (par défaut celle de l'entité)
export function drawEnt(c, e, t, px, py) {
  const K = e.type, x = px ?? B(e.x), y = py ?? B(e.y), f2 = n => Math.floor(t * n) % 2;
  switch (K) {
    case 'piece': c.drawImage(SP.coin[Math.floor(t * 5 + (e.x || 0)) % 2], x - 3, y - 3); return;
    case 'feuille': c.drawImage(SP.leaf, x - 3, y - 3 + f2(3)); return;
    case 'pardon': c.drawImage(SP.hands[f2(8)], x - 5, y - 6); if (f2(4)) { twinkle(c, x - 7, y - 6, '#F8F8F8'); twinkle(c, x + 7, y - 3, '#F8D878'); } return;
    case 'aura': c.drawImage(SP.bubble, x - 4, y - 4 + f2(3)); if (f2(5)) twinkle(c, x + 5, y - 5, '#F8F8F8'); return;
    case 'gel': c.drawImage(SP.gel, x - 3, y - 5); if (f2(4)) twinkle(c, x + 4, y - 5, '#A8E0F0'); return;
    case 'pq': c.drawImage(SP.pq, x - 4, y - 3); if (f2(3)) twinkle(c, x + 5, y - 4, '#F8D878'); return;
    case 'pigeon': { const f = e.fly ? f2(10) : 0; c.drawImage(SP.pigeon[e.fly ? f : 0], x - 4, y - 3 - (!e.fly && Math.floor(t * 2) % 3 === 0 ? 1 : 0)); return; }
    case 'rambarde': c.drawImage(SP.pole, x - 3, y - 3); c.fillStyle = '#58D854'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + t * 2; c.fillRect(Math.round(x + Math.cos(a) * 5), Math.round(y + Math.sin(a) * 5), 1, 1); } return;
    case 'enfant': c.drawImage(kid('enfant', f2(12)), x - 4, y - 7); c.fillStyle = '#E83A2A'; c.fillRect(x - 1, y - 9, 3, 1); c.fillStyle = f2(10) ? '#F8F8F8' : '#3CBCFC'; c.fillRect(x - 3 + f2(10) * 2, y - 10, 3, 1); drawMask(c, x, y + 2, e.mask && 'nose'); return;
  }
  if (K === 'debout' || K === 'basique') {
    const v = e.v || 0, sx = K === 'debout' && !e.go ? Math.round(Math.sin(t * 2 + (e.ph || 0)) * .8) : 0;
    const f = K === 'debout' && !e.go ? 0 : f2(6);
    c.drawImage(body('deb' + v, undefined, f), x - 6 + sx, y - 12);
    crowdBits(c, x + sx, y, v); drawMask(c, x + sx, y, e.mask);
    return;
  }
  const still = K === 'theologiste' || K === 'artiste' || K === 'mendiant' || K === 'controleur' || K === 'trottinette';
  const f = still ? 0 : f2(K === 'runner' ? 12 : K === 'zombie' ? 3 : 6);
  let key = K;
  if (K === 'shlagg_shiny') key = 'shiny' + Math.floor(t * 6) % 4;
  const img = body(key, e.skin, f);
  if (K === 'poussette') { c.drawImage(img, x - 9, y - 12); c.drawImage(SP.stroller, x + 1, y - 4); drawMask(c, x - 3, y, e.mask); return; }
  if (K === 'encombrant') { c.drawImage(img, x - 8, y - 12); c.drawImage(SP.suit, x + 3, y - 3); c.fillStyle = '#000'; c.fillRect(x - 11, y - 6, 4, 8); c.fillStyle = '#E83A2A'; c.fillRect(x - 10, y - 5, 2, 6); drawMask(c, x - 2, y, e.mask); return; }
  if (K === 'trottinette') {
    const sx = e.vx < 0 ? -1 : 1;
    c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 3; i++) c.fillRect(x - sx * (9 + i * 2), y - 6 + i * 4, 4, 1);   // traînée de vitesse
    c.drawImage(img, x - 6, y - 14);
    c.fillStyle = '#000'; c.fillRect(x + sx * 5, y - 6, 1, 12); c.fillRect(x + sx * 5 - 2, y - 6, 5, 1);   // guidon
    c.fillStyle = '#7C8088'; c.fillRect(x - 6, y + 4, 12, 2);                                                 // planche
    c.fillStyle = '#000'; c.fillRect(x - 7, y + 5, 3, 3); c.fillRect(x + 4, y + 5, 3, 3);                       // roues
    drawMask(c, x, y - 2, e.mask); return;
  }
  c.drawImage(img, x - 6, y - 12);
  switch (K) {
    case 'voleur': c.fillStyle = '#000'; c.fillRect(x - 4, y - 9, 8, 2); c.fillStyle = '#F8F8F8'; c.fillRect(x - 2, y - 8, 1, 1); c.fillRect(x + 1, y - 8, 1, 1); break;
    case 'controleur': c.fillStyle = '#2FD0A8'; c.fillRect(x - 1, y - 11, 2, 1); c.fillStyle = '#F8F8F8'; c.fillRect(x + 3, y - 3, 2, 1); break;
    case 'theologiste': c.fillStyle = '#000'; c.fillRect(x + 4, y - 3, 5, 6); c.fillStyle = '#A81000'; c.fillRect(x + 5, y - 2, 3, 4); c.fillStyle = '#F2C230'; c.fillRect(x + 6, y - 1, 1, 2); break;
    case 'artiste': c.fillStyle = '#000'; c.fillRect(x - 7, y - 4, 14, 7); c.fillStyle = '#D82800'; c.fillRect(x - 6, y - 3, 3, 5); c.fillRect(x + 3, y - 3, 3, 5);
      c.fillStyle = '#F8F8F8'; for (let k = -2; k < 3; k++) c.fillRect(x + k, y - 3 + f2(8), 1, 4);
      c.fillStyle = '#F878F8'; for (let i = 0; i < 2; i++) { const a = t * 3 + i * 3, nx = Math.round(x + Math.cos(a) * 10), ny = Math.round(y - 16 + Math.sin(a * 1.3) * 3); c.fillRect(nx, ny, 1, 4); c.fillRect(nx - 2, ny + 3, 2, 2); c.fillRect(nx + 1, ny, 2, 1); } break;
    case 'shlagg': c.fillStyle = '#B8F818'; for (let i = -1; i <= 1; i++) for (let k = 0; k < 4; k++) c.fillRect(x + i * 3 + ((Math.floor(t * 6) + k + i + 2) % 2), y - 15 - k * 2, 1, 1); break;
    case 'shlagg_rolex': // lunettes de soleil, chaîne en or et Rolex qui brille
      c.fillStyle = '#000'; c.fillRect(x - 4, y - 8, 8, 1); c.fillRect(x - 4, y - 8, 3, 2); c.fillRect(x + 1, y - 8, 3, 2);
      c.fillStyle = '#F8D878'; c.fillRect(x - 3, y - 4, 6, 1); c.fillRect(x - 1, y - 3, 2, 1);
      c.fillStyle = '#F8B800'; c.fillRect(x - 6, y - 1, 3, 1); c.fillRect(x + 3, y - 1, 3, 1);
      if (f2(3)) { twinkle(c, x - 7, y - 2, '#F8F8F8'); } else twinkle(c, x + 7, y - 2, '#F8F8F8');
      c.fillStyle = '#B8F818'; for (let k = 0; k < 3; k++) c.fillRect(x + ((Math.floor(t * 6) + k) % 2) * 2 - 1, y - 15 - k * 2, 1, 1); break;
    case 'shlagg_shiny': { // aura scintillante arc-en-ciel
      const cols = ['#F8F8F8', '#F8D878', '#F878F8', '#78F8F8'];
      for (let i = 0; i < 6; i++) { const a = i * 1.047 + t * 3, r = 10 + f2(4); twinkle(c, Math.round(x + Math.cos(a) * r), Math.round(y - 3 + Math.sin(a) * r), cols[(i + Math.floor(t * 8)) % 4]); }
      break; }
    case 'susu': c.fillStyle = '#A4E4FC'; for (let i = 0; i < 3; i++) c.fillRect(x - 6 + i * 6, y - 12 + Math.floor((t * 12 + i * 4) % 14), 1, 2); break;
    case 'tchipeur': if (((e.t || 0) % 2.4) < .55) { c.fillStyle = '#000'; c.fillRect(x + 3, y - 21, 23, 9); c.fillStyle = '#F8F8F8'; c.fillRect(x + 4, y - 20, 21, 7); c.fillRect(x + 4, y - 13, 2, 2); drawTiny(c, 'TCHIP', x + 5, y - 19, '#000000', 'left', null); } break;
    case 'runner': c.fillStyle = '#F8F8F8'; c.fillRect(x - 4, y - 10, 8, 1); c.fillStyle = '#3AB86A'; c.fillRect(x - 3, y - 18, 1, 3); c.fillRect(x, y - 19, 1, 3); c.fillRect(x + 3, y - 18, 1, 3); break;
    case 'mendiant': c.fillStyle = '#000'; c.fillRect(x - 10, y - 1, 5, 5); c.fillStyle = '#F8F8F8'; c.fillRect(x - 9, y, 3, 3); if (!e.done) sparkle(c, x, y - 3, t); break;
    case 'dame': c.fillStyle = '#503000'; c.fillRect(x + 6, y - 2, 1, 8); c.fillRect(x + 5, y - 2, 1, 1); if (!e.done) sparkle(c, x, y - 3, t); break;
    case 'manifestant':
      c.fillStyle = '#F8F8F8'; c.fillRect(x - 5, y - 2, 10, 1);   // bande réfléchissante
      if (e.flag) { c.fillStyle = '#000'; c.fillRect(x + 5, y - 20, 1, 20); c.fillStyle = '#E83A2A'; c.fillRect(x + 6, y - 20, 6 + f2(4), 4); }
      break;
    case 'tousseur': if (((e.t || 0) % 1.8) < .6) { c.fillStyle = '#B8C8A0'; const k = Math.floor(((e.t || 0) % 1.8) * 10); c.fillRect(x + 4 + k, y - 8 - k, 3, 2); c.fillRect(x + 6 + k, y - 5 - k / 2, 2, 2); c.fillRect(x + 2 + k, y - 11 - k, 2, 2); } break;
    case 'zombie': { // bras tendus, bave, lambeaux
      const b = f2(3);
      c.fillStyle = '#000'; c.fillRect(x - 9, y - 6 + b, 4, 3); c.fillRect(x + 5, y - 6 + (1 - b), 4, 3);
      c.fillStyle = '#8CB070'; c.fillRect(x - 8, y - 5 + b, 2, 1); c.fillRect(x + 6, y - 5 + (1 - b), 2, 1);
      c.fillStyle = '#5A5A6A'; c.fillRect(x - 7, y - 4 + b, 2, 2); c.fillRect(x + 5, y - 4 + (1 - b), 2, 2);
      c.fillStyle = '#A8E0A0'; if (f2(2)) c.fillRect(x, y - 5, 1, 2);
      c.fillStyle = '#000'; c.fillRect(x - 3, y + 1, 1, 1); c.fillRect(x + 2, y - 2, 1, 1);
      break; }
  }
  if (K !== 'zombie') drawMask(c, x, y, e.mask);
}
