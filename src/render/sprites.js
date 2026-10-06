import { ctx } from '../core/canvas.js';
import { hash } from '../core/utils.js';

// ============================================================
//  PIXEL ART — sprites originaux dessinés en code.
//  Chaque sprite est une grille de lettres ; chaque lettre = une couleur
//  de la palette (K = contour noir, H = cheveux, S = peau, C = haut,
//  P = pantalon, F = chaussures). Modifiez PAL pour changer les tenues.
// ============================================================
export const B = v => Math.round(v / 2);
export const F8 = '8px "Press Start 2P", monospace';
export const ENAMEL = '#1D2A5C';
export function spr(rows, map) {
  const h = rows.length, w = rows[0].length, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  rows.forEach((r, y) => { for (let x = 0; x < w; x++) { const col = map[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } } });
  return c;
}
export const TOP = ['...KKKK...', '..KHHHHK..', '.KHHHHHHK.', '.KSSSSSSK.', '.KSKSSKSK.', '.KSSSSSSK.', '..KKKKKK..',
             '.KCCCCCCK.', 'KCCCCCCCCK', 'KSKCCCCKSK', 'KKKCCCCKKK', '..KPPPPK..'];
export const BODY = [TOP.concat(['..KPKKPK..', '..KPKKPK..', '..KFKKFK..']), TOP.concat(['..KPKKPK..', '.KPK..KPK.', '.KFK..KFK.'])];
export const KTOP = ['..KKKK..', '.KHHHHK.', 'KHSSSSHK', 'KSKSSKSK', '.KSSSSK.', '.KCCCCK.', 'KSCCCCSK', '.KCCCCK.', '.KPKKPK.'];
export const KID = [KTOP.concat(['.KPKKPK.', '.KFKKFK.']), KTOP.concat(['KPK..KPK', 'KFK..KFK'])];
// Tenues parisiennes : manteaux sombres, trench beige, doudounes, jeans
export const PAL = {
  player:     { H: '#0058F8', S: '#F0D0B0', C: '#F8B800', P: '#0000BC', F: '#F8F8F8' },
  basique:    { H: '#2A1A10', S: '#F0C8A0', C: '#1C2440', P: '#3A3A3A', F: '#101010' },
  shlagg:     { H: '#8A6A3A', S: '#E8C090', C: '#6B6B3A', P: '#4A3A2A', F: '#2A2018' },
  tchipeur:   { H: '#101010', S: '#7A4A2A', C: '#D8432F', P: '#202020', F: '#F8F8F8' },
  frotteur:   { H: '#9A9A9A', S: '#F0C8A0', C: '#B8A070', P: '#5A4A3A', F: '#101010' },
  susu:       { H: '#101010', S: '#C88050', C: '#A8C8E8', P: '#2A3A5A', F: '#F8F8F8' },
  theologiste:{ H: '#C8C8C8', S: '#F0C8A0', C: '#F0F0E8', P: '#F0F0E8', F: '#5A3A20' },
  voleur:     { H: '#202020', S: '#C88050', C: '#303038', P: '#202020', F: '#101010' },
  artiste:    { H: '#E8B830', S: '#5A3018', C: '#9B2D8A', P: '#202020', F: '#F8F8F8' },
  enfant:     { H: '#C8501E', S: '#F0C8A0', C: '#F2C230', P: '#2E5FA8', F: '#F8F8F8' },
  poussette:  { H: '#5A3A20', S: '#F0C8A0', C: '#C86A8A', P: '#2A2A3A', F: '#101010' },
  encombrant: { H: '#E8D8B0', S: '#F0A890', C: '#4AA8D8', P: '#C8B080', F: '#F8F8F8' },
  runner:     { H: '#101010', S: '#7A4A2A', C: '#3AB86A', P: '#101010', F: '#F8F8F8' },
  controleur: { H: '#1D2A5C', S: '#F0C8A0', C: '#1D2A5C', P: '#101828', F: '#101010' },
  mendiant:   { H: '#6A6A6A', S: '#B87A4A', C: '#6A3A2A', P: '#3A3A3A', F: '#2A2A2A' },
  dame:       { H: '#F0F0F0', S: '#F0C8A0', C: '#B07AA0', P: '#5A4A7A', F: '#101010' },
  deb0: { H: '#2A1A10', S: '#F0C8A0', C: '#1C2440', P: '#3A3A3A', F: '#101010' },
  deb1: { H: '#101010', S: '#7A4A2A', C: '#5A5A5A', P: '#2A3A5A', F: '#F8F8F8' },
  deb2: { H: '#C8A060', S: '#F0C8A0', C: '#B8A070', P: '#2A2A2A', F: '#5A3A20' },
  deb3: { H: '#5A3020', S: '#C88050', C: '#7A1A2A', P: '#202020', F: '#101010' },
  deb4: { H: '#101010', S: '#5A3018', C: '#E8E0D0', P: '#3A4A6A', F: '#F8F8F8' },
  deb5: { H: '#8A8A8A', S: '#F0C8A0', C: '#2A5A3A', P: '#3A3A3A', F: '#3A2A1A' },
  deb6: { H: '#D8A040', S: '#F8D8B8', C: '#202020', P: '#101010', F: '#F8F8F8' },
  deb7: { H: '#3A2A1A', S: '#B87A4A', C: '#4A7AB8', P: '#2A2A2A', F: '#101010' }
};
export const SP = {};
export const SKINS = ['#F0C8A0', '#E0A878', '#B87A4A', '#7A4A2A'];
export const SKINNED = ['tchipeur', 'voleur', 'shlagg', 'susu', 'frotteur', 'runner', 'artiste', 'mendiant', 'theologiste', 'encombrant', 'poussette', 'controleur', 'dame'];
export function buildSprites() {
  const K = { K: '#000000' };
  SP.p = {}; SP.sit = {};
  for (const k in PAL) { const m = Object.assign({}, K, PAL[k]); SP.p[k] = BODY.map(f => spr(f, m)); SP.sit[k] = spr(TOP.slice(0, 11), m); }
  SP.enfant = KID.map(f => spr(f, Object.assign({}, K, PAL.enfant)));
  SP.mini = KID.map(f => spr(f, Object.assign({}, K, PAL.player)));
  SP.miniSit = spr(KTOP.slice(0, 8), Object.assign({}, K, PAL.player));
  // Les personnages « à comportement » ont une couleur de peau tirée au hasard : seule la tenue les identifie
  SP.ps = {};
  SKINNED.forEach(k => { SP.ps[k] = SKINS.map(sk => BODY.map(f => spr(f, Object.assign({}, K, PAL[k], { S: sk })))); });
  SP.star = ['#F83800', '#58D854', '#F8F8F8', '#3CBCFC'].map(c => BODY.map(f => spr(f, Object.assign({}, K, PAL.player, { C: c, H: c }))));
  const cm = { K: '#000000', Y: '#F8B800', W: '#F8F8F8', O: '#AC7C00' };
  SP.coin = [spr(['.KKKK.', 'KYWYYK', 'KWYYOK', 'KYYYOK', 'KYYOOK', '.KKKK.'], cm), spr(['..KK..', '.KYWK.', '.KYYK.', '.KYOK.', '.KYOK.', '..KK..'], cm)];
  SP.leaf = spr(['....KK.', '..KKGK.', '.KGGGK.', 'KGLGGK.', 'KGGLK..', '.KKK...', 'K......'], { K: '#000000', G: '#00A800', L: '#58D854' });
  const STAR = ['....K....', '...KYK...', 'KKKKYKKKK', 'KYYYWYYYK', '.KYYWYYK.', '..KYYYK..', '.KYYKYYK.', '.KYK.KYK.', '.KK...KK.'];
  SP.pstar = [spr(STAR, { K: '#000000', Y: '#F8D878', W: '#F8F8F8' }), spr(STAR, { K: '#000000', Y: '#F8B800', W: '#F8D878' })];
  SP.hstar = spr(['...K...', '..KGK..', 'KKKGKKK', 'KGGWGGK', '.KGGGK.', '.KGKGK.', '.KK.KK.'], { K: '#000000', G: '#2FD0A8', W: '#F8F8F8' });
  SP.pole = spr(['.KKKK.', 'KWWLLK', 'KWLLLK', 'KLLLGK', 'KLLGGK', '.KKKK.'], { K: '#000000', W: '#F8F8F8', L: '#BCBCBC', G: '#7C7C7C' });
  SP.stroller = spr(['..KKKKK..', '.KHHHHHK.', 'KHHKKKHHK', 'KBBBBBBBK', 'KBBBBBBBK', '.KKKKKKK.', '..K...K..', '.KWK.KWK.', '..K...K..'], { K: '#000000', H: '#6A6A80', B: '#3A3A48', W: '#BCBCBC' });
  SP.suit = spr(['..KKK..', '..K.K..', 'KKKKKKK', 'KRRRRRK', 'KRWRRRK', 'KRRRRRK', 'KRRRRWK', 'KKKKKKK'], { K: '#000000', R: '#2E7BC8', W: '#F2C230' });
  const pg = { K: '#000000', G: '#8A8C98', D: '#5A5C68', V: '#4AA87A', Y: '#E8A030' };
  SP.pigeon = [spr(['.KK.....', 'KGVK....', 'YKGGKKK.', '.KGGDDGK', '..KKGGK.', '...K..K.'], pg),
               spr(['K......K', 'DK.KK.KD', '.DKGVKD.', '..YGGGK.', '..KGDDK.', '...KKK..'], pg)];
  SP.rat = [spr(['.KK......', 'KGGKKKK..', 'KGGGGGGK.', '.K.K.K.KK'], { K: '#000000', G: '#6A5A4A' }),
            spr(['.KK......', 'KGGKKKK..', 'KGGGGGGKK', '..K.K.K..'], { K: '#000000', G: '#6A5A4A' })];
}
// Carreaux biseautés blancs du métro
export function faience(g, x0, y0, w, h) {
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.fillStyle = '#A8ACA4'; g.fillRect(x0, y0, w, h);
  for (let row = 0; row * 4 < h; row++) {
    const off = row % 2 ? -3 : 0;
    for (let col = 0; col * 6 + off < w; col++) {
      const x = x0 + col * 6 + off, y = y0 + row * 4;
      g.fillStyle = '#F4F4EC'; g.fillRect(x, y, 5, 3);
      g.fillStyle = '#FFFFFF'; g.fillRect(x, y, 5, 1);
      g.fillStyle = '#D8DCD0'; g.fillRect(x, y + 2, 5, 1);
    }
  }
  g.restore();
}
// Carrelage gris du sol, avec quelques chewing-gums
export function floorTiles(g, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y += 8) for (let x = x0; x < x0 + w; x += 8) {
    const r = hash(x, y);
    g.fillStyle = ((x + y) / 8) % 2 ? '#8C8E88' : '#979993'; g.fillRect(x, y, 8, 8);
    g.fillStyle = '#7A7C76'; g.fillRect(x, y, 8, 1); g.fillRect(x, y, 1, 8);
    if (r < .09) { g.fillStyle = '#55574F'; g.fillRect(x + 2 + Math.floor(r * 50) % 4, y + 3, 2, 2); }
    if (r > .985) { g.fillStyle = '#F2F2F2'; g.fillRect(x + 3, y + 2, 3, 2); g.fillStyle = '#C8C8C8'; g.fillRect(x + 3, y + 4, 3, 1); }
  }
}
export const POSTERS = ['#E83A6A', '#2E8BD8', '#F2C230', '#3AB86A', '#F07D19', '#8C4FBF'];
export function poster(g, x, y, i) {
  g.fillStyle = '#000'; g.fillRect(x, y, 10, 22);
  g.fillStyle = POSTERS[i % POSTERS.length]; g.fillRect(x + 1, y + 1, 8, 20);
  g.fillStyle = '#F8F8F8'; g.fillRect(x + 2, y + 3, 6, 6);
  g.fillStyle = '#000'; g.fillRect(x + 3 + (i % 3), y + 5, 2, 2);
  g.fillStyle = '#F8F8F8'; g.fillRect(x + 2, y + 12, 6, 1); g.fillRect(x + 2, y + 15, 4, 1); g.fillRect(x + 2, y + 18, 5, 1);
}
export function wall(g, x, y, h, left) {
  faience(g, x, y, 12, h);
  g.fillStyle = '#F07D19'; g.fillRect(left ? x + 10 : x, y, 2, h);
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
  g.fillStyle = '#B85A10'; g.fillRect(0, 0, 6, 6); g.fillStyle = '#F07D19'; g.fillRect(0, 0, 5, 5); g.fillStyle = '#F8A050'; g.fillRect(0, 0, 5, 1);
  document.documentElement.style.setProperty('--bricks', `url(${a.toDataURL()})`);
  document.documentElement.style.setProperty('--blocks', `url(${b.toDataURL()})`);
}
export function sparkle(c, x, y, t) {
  c.fillStyle = '#F8D878';
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 2, s = (i + Math.floor(t * 6)) % 2 ? 1 : 2; c.fillRect(Math.round(x + Math.cos(a) * 9), Math.round(y + Math.sin(a) * 9), s, s); }
}
export function drawEnt(c, e, t) {
  const K = e.type, x = B(e.x), y = B(e.y);
  if (K === 'piece') { c.drawImage(SP.coin[Math.floor(t * 5 + e.x) % 2], x - 3, y - 3); return; }
  if (K === 'feuille') { c.drawImage(SP.leaf, x - 3, y - 3 + (Math.floor(t * 3) % 2)); return; }
  if (K === 'pardon') { c.drawImage(SP.pstar[Math.floor(t * 8) % 2], x - 4, y - 4); return; }
  if (K === 'pigeon') { const f = e.fly ? Math.floor(t * 10) % 2 : 0; c.drawImage(SP.pigeon[e.fly ? f : 0], x - 4, y - 3 - (!e.fly && Math.floor(t * 2) % 3 === 0 ? 1 : 0)); return; }
  if (K === 'rambarde') { c.drawImage(SP.pole, x - 3, y - 3); c.fillStyle = '#58D854'; for (let i = 0; i < 4; i++) { const a = i * 1.57 + t * 2; c.fillRect(Math.round(x + Math.cos(a) * 5), Math.round(y + Math.sin(a) * 5), 1, 1); } return; }
  if (K === 'debout' || K === 'basique') {
    const v = e.v || 0, sx = K === 'debout' ? Math.round(Math.sin(t * 2 + (e.ph || 0)) * .8) : 0;
    const f = K === 'debout' ? 0 : Math.floor(t * 6) % 2;
    c.drawImage(SP.p['deb' + v][f], x - 5 + sx, y - 9);
    if (v % 3 === 0) { c.fillStyle = '#E83A2A'; c.fillRect(x - 6 + sx, y - 7, 1, 3); c.fillRect(x + 5 + sx, y - 7, 1, 3); c.fillStyle = '#202020'; c.fillRect(x - 5 + sx, y - 9, 10, 1); }
    else if (v % 3 === 1) { c.fillStyle = '#8CE0FF'; c.fillRect(x + 3 + sx, y - 1, 2, 2); }
    return;
  }
  const FR = e.skin !== undefined && SP.ps[K] ? SP.ps[K][e.skin] : SP.p[K];
  const still = K === 'theologiste' || K === 'artiste' || K === 'mendiant' || K === 'controleur';
  const f = still ? 0 : Math.floor(t * (K === 'runner' || K === 'enfant' ? 12 : 6)) % 2;
  if (K === 'enfant') { c.drawImage(SP.enfant[f], x - 4, y - 5); return; }
  if (K === 'poussette') { c.drawImage(FR[f], x - 9, y - 9); c.drawImage(SP.stroller, x + 1, y - 3); return; }
  if (K === 'encombrant') { c.drawImage(FR[f], x - 7, y - 9); c.drawImage(SP.suit, x + 2, y - 2); c.fillStyle = '#000'; c.fillRect(x - 10, y - 5, 4, 7); c.fillStyle = '#E83A2A'; c.fillRect(x - 9, y - 4, 2, 5); return; }
  c.drawImage(FR[f], x - 5, y - 9);
  switch (K) {
    case 'voleur': c.fillStyle = '#000'; c.fillRect(x - 4, y - 5, 8, 1); c.fillStyle = '#F8F8F8'; c.fillRect(x - 2, y - 5, 1, 1); c.fillRect(x + 1, y - 5, 1, 1); break;
    case 'controleur': c.fillStyle = '#000'; c.fillRect(x - 5, y - 6, 10, 1); c.fillStyle = '#F8F8F8'; c.fillRect(x - 3, y - 1, 2, 1); c.fillStyle = '#2FD0A8'; c.fillRect(x - 1, y - 9, 2, 1); break;
    case 'theologiste': c.fillStyle = '#000'; c.fillRect(x + 4, y - 1, 4, 5); c.fillStyle = '#A81000'; c.fillRect(x + 5, y, 2, 3); break;
    case 'artiste': c.fillStyle = '#000'; c.fillRect(x - 6, y - 2, 12, 6); c.fillStyle = '#D82800'; c.fillRect(x - 5, y - 1, 3, 4); c.fillRect(x + 2, y - 1, 3, 4); c.fillStyle = '#F8F8F8'; for (let k = -2; k < 2; k++) c.fillRect(x + k, y - 1 + (Math.floor(t * 8) % 2), 1, 3);
      c.fillStyle = '#F878F8'; for (let i = 0; i < 2; i++) { const a = t * 3 + i * 3, nx = Math.round(x + Math.cos(a) * 9), ny = Math.round(y - 12 + Math.sin(a * 1.3) * 3); c.fillRect(nx, ny, 1, 4); c.fillRect(nx - 2, ny + 3, 2, 2); c.fillRect(nx + 1, ny, 2, 1); } break;
    case 'shlagg': c.fillStyle = '#B8F818'; for (let i = -1; i <= 1; i++) for (let k = 0; k < 4; k++) c.fillRect(x + i * 3 + ((Math.floor(t * 6) + k + i + 2) % 2), y - 12 - k * 2, 1, 1); break;
    case 'susu': c.fillStyle = '#A4E4FC'; for (let i = 0; i < 3; i++) c.fillRect(x - 5 + i * 5, y - 10 + Math.floor((t * 12 + i * 4) % 12), 1, 2); break;
    case 'tchipeur': if (((e.t || 0) % 2.4) < .5) { c.fillStyle = '#000'; c.fillRect(x + 4, y - 16, 12, 7); c.fillStyle = '#F8F8F8'; c.fillRect(x + 5, y - 15, 10, 5); c.fillRect(x + 5, y - 10, 2, 2); c.fillStyle = '#000'; c.fillRect(x + 7, y - 13, 1, 1); c.fillRect(x + 9, y - 14, 1, 1); c.fillRect(x + 11, y - 13, 1, 1); c.fillRect(x + 13, y - 14, 1, 1); } break;
    case 'runner': c.fillStyle = '#F8F8F8'; c.fillRect(x - 4, y - 7, 8, 1); c.fillStyle = '#3AB86A'; c.fillRect(x - 3, y - 15, 1, 3); c.fillRect(x, y - 16, 1, 3); c.fillRect(x + 3, y - 15, 1, 3); break;
    case 'mendiant': c.fillStyle = '#000'; c.fillRect(x - 9, y - 1, 5, 5); c.fillStyle = '#F8F8F8'; c.fillRect(x - 8, y, 3, 3); if (!e.done) sparkle(c, x, y - 2, t); break;
    case 'dame': c.fillStyle = '#503000'; c.fillRect(x + 5, y - 1, 1, 8); c.fillRect(x + 4, y - 1, 1, 1); if (!e.done) sparkle(c, x, y - 2, t); break;
  }
}

