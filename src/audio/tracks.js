// ============================================================
//  MUSIQUES — compositions originales en style chiptune.
//  Chaque piste : bpm + une fonction play(snd, pas, délai, duréeDuPas)
//  appelée à chaque croche. Pour créer une piste, copiez-en une.
// ============================================================
const N = name => { // 'A4' → 440 Hz, 'Cs5' = do dièse 5
  const m = /^([A-G])(s?)(\d)$/.exec(name);
  const i = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] ? 1 : 0) + (+m[3] - 4) * 12;
  return 440 * Math.pow(2, i / 12);
};
const B = (s, f, d, at, vol = .2) => s.tone(f, d, { type: 'triangle', vol, at, bus: s.musicIn });
const P = (s, f, d, at, vol = .035) => s.tone(f, d, { type: 'square', vol, at, bus: s.musicIn });
const S = (s, f, d, at, vol = .07) => s.tone(f, d, { type: 'sine', vol, at, bus: s.musicIn });
const A = (s, f, d, at, vol = .022) => s.acc(f, d, at, vol, s.musicIn);
const KICK = (s, at, vol = .25) => s.tone(120, .12, { type: 'sine', vol, slide: 45, at, bus: s.musicIn });
const HAT = (s, at, vol = .03) => s.noise(.03, { ftype: 'highpass', f: 7000, vol, at, bus: s.musicIn });

// Valse musette en la mineur (couloirs)
const MUSETTE = [['A2', ['A3', 'C4', 'E4'], ['E5', null, 'A5', null, 'C6', null]], ['E2', ['Gs3', 'B3', 'D4'], ['B5', null, 'Gs5', null, 'E5', null]],
                 ['A2', ['A3', 'C4', 'E4'], ['A5', null, 'C6', null, 'E6', null]], ['D2', ['D4', 'F4', 'A4'], ['D6', null, 'C6', null, 'A5', null]],
                 ['A2', ['A3', 'C4', 'E4'], ['E5', null, 'A5', null, 'C6', null]], ['D2', ['D4', 'F4', 'A4'], ['F5', null, 'A5', null, 'D6', null]],
                 ['E2', ['Gs3', 'B3', 'D4'], ['B5', null, 'Gs5', null, 'B5', null]], ['A2', ['A3', 'C4', 'E4'], ['A5', null, null, null, null, null]]];
function musette(s, i, at, d, withLead) {
  const bar = Math.floor(i / 6) % MUSETTE.length, k = i % 6, [bass, ch, lead] = MUSETTE[bar];
  if (k === 0) B(s, N(bass), d * 2.2, at);
  if (k === 2 || k === 4) ch.forEach(n => P(s, N(n), d * .9, at, .016));
  if (withLead && lead[k]) A(s, N(lead[k]), d * (lead[k + 1] === null && k === 0 && bar === 7 ? 6 : 1.9), at);
  if (!withLead && k % 2 === 1) P(s, N(ch[(i >> 1) % 3]) * 2, d * .8, at, .02);
}

// Wagon : ambiance feutrée, ré mineur, 4 temps
const LOUNGE = [['D2', ['D4', 'F4', 'A4', 'C5']], ['G2', ['F4', 'A4', 'B4', 'D5']], ['C2', ['E4', 'G4', 'B4', 'D5']], ['A2', ['Cs4', 'E4', 'G4', 'A4']]];
// Sortie : majeur, entraînant
const EXIT = [['C3', ['C4', 'E4', 'G4']], ['F2', ['F4', 'A4', 'C5']], ['G2', ['G4', 'B4', 'D5']], ['C3', ['E4', 'G4', 'C5']]];

const ENVOL = [['F2', ['F4', 'A4', 'C5'], ['F5', null, 'A5', 'C6', null, 'A5', 'F5', null]],
               ['As1', ['As4', 'D5', 'F5'], ['D6', null, 'C6', 'As5', null, 'A5', 'G5', null]],
               ['C2', ['C5', 'E5', 'G5'], ['G5', 'A5', 'C6', null, 'E6', null, 'D6', 'C6']],
               ['F2', ['F4', 'A4', 'C5'], ['F6', null, 'C6', null, 'A5', null, 'F5', null]]];

// Grève : fanfare de cortège (marche en ré mineur, caisse claire et cuivres)
const MARCHE = [['D2', ['D4', 'F4', 'A4'], ['A4', null, 'D5', null, 'F5', 'E5', 'D5', null]],
                ['A1', ['Cs4', 'E4', 'A4'], ['E5', null, 'A4', null, 'Cs5', null, 'E5', null]],
                ['D2', ['D4', 'F4', 'A4'], ['F5', null, 'G5', 'F5', 'E5', null, 'D5', null]],
                ['A1', ['Cs4', 'E4', 'G4'], ['E5', 'D5', 'Cs5', null, 'A4', null, null, null]]];
// Pandémie : ambiance inquiétante façon film de zombies (mi mineur, orgue + battements)
const SPOOKY = [['E2', ['E4', 'G4', 'B4']], ['C2', ['C4', 'E4', 'G4']], ['A1', ['A3', 'C4', 'E4']], ['B1', ['B3', 'Ds4', 'Fs4']]];
// Aura de sécurité : petite boucle « bulle » aérienne
const BULLE = ['C6', 'E6', 'G6', 'C7', 'G6', 'E6', 'D6', 'G6'];

export const TRACKS = {
  menu: { bpm: 150, play: (s, i, at, d) => musette(s, i, at, d, true) },
  corridor: { bpm: 176, play: (s, i, at, d) => { musette(s, i, at, d, Math.floor(i / 48) % 2 === 0); if (i % 6 === 0) HAT(s, at, .02); } },
  wagon: { bpm: 96, play: (s, i, at, d) => {
    const bar = Math.floor(i / 8) % LOUNGE.length, k = i % 8, [bass, ch] = LOUNGE[bar];
    if (k === 0 || k === 5) B(s, N(bass), d * 2.5, at, .17);
    if (k % 2 === 0) S(s, N(ch[(k / 2) % 4]) * 2, d * 2, at, .045);
    if (k === 4) HAT(s, at, .015);
  } },
  exit: { bpm: 138, play: (s, i, at, d) => {
    const bar = Math.floor(i / 8) % EXIT.length, k = i % 8, [bass, ch] = EXIT[bar];
    B(s, N(bass) * (k % 2 ? 2 : 1), d * .9, at, .16);
    P(s, N(ch[k % 3]) * 2, d * .8, at, .028);
    if (k % 4 === 0) KICK(s, at, .2); if (k % 2) HAT(s, at);
  } },
  // « Envol » : thème original et héroïque joué pendant l'étoile Pardon (fa majeur, fanfare rapide)
  star: { bpm: 168, play: (s, i, at, d) => {
    const bar = Math.floor(i / 8) % ENVOL.length, k = i % 8, [bass, ch, lead] = ENVOL[bar];
    B(s, N(bass) * (k % 2 ? 2 : 1), d * .9, at, .17);                       // basse qui rebondit
    if (k % 2 === 1) ch.forEach(n => s.tone(N(n), d * .7, { type: 'sawtooth', vol: .012, at, lp: 2400, bus: s.musicIn })); // cuivres
    if (lead[k]) { P(s, N(lead[k]), d * 1.6, at, .04); P(s, N(lead[k]) * 2, d * .5, at, .008); } // mélodie
    if (k === 0 || k === 4) KICK(s, at, .22);
    if (k === 2 || k === 6) s.noise(.08, { f: 1800, q: .8, vol: .1, at, bus: s.musicIn });       // caisse claire
    HAT(s, at, .02);
  } }
,
  greve: { bpm: 112, play: (s, i, at, d) => {
    const bar = Math.floor(i / 8) % MARCHE.length, k = i % 8, [bass, ch, lead] = MARCHE[bar];
    if (k % 2 === 0) B(s, N(bass) * (k % 4 ? 1.5 : 1), d * 1.5, at, .17);
    if (k % 4 === 2) ch.forEach(n => s.tone(N(n), d * .8, { type: 'sawtooth', vol: .012, at, lp: 2000, bus: s.musicIn }));
    if (lead[k] && Math.floor(i / 32) % 2 === 0) P(s, N(lead[k]), d * 1.5, at, .035);
    if (k === 0 || k === 4) KICK(s, at, .2);
    s.noise(.05, { f: 1900, q: .8, vol: k % 2 ? .03 : .07, at, bus: s.musicIn });   // roulement de caisse claire
  } },
  pandemie: { bpm: 84, play: (s, i, at, d) => {
    const bar = Math.floor(i / 8) % SPOOKY.length, k = i % 8, [bass, ch] = SPOOKY[bar];
    if (k === 0) { B(s, N(bass), d * 7, at, .16); ch.forEach(n => s.tone(N(n), d * 7, { type: 'sawtooth', vol: .008, at, lp: 900, attack: .3, bus: s.musicIn })); }
    if (k === 0 || k === 3) KICK(s, at, .16);
    if (k % 2 === 1) S(s, N(ch[(i >> 1) % 3]) * 4, d * .5, at, .025);
    if (k === 6 && bar === 3) P(s, N('Ds5'), d * 2, at, .02);
  } },
  aura: { bpm: 150, play: (s, i, at, d) => {
    const k = i % 8;
    S(s, N(BULLE[k]), d * .9, at, .05);
    if (k % 4 === 0) B(s, N(k ? 'G2' : 'C3'), d * 3, at, .14);
    HAT(s, at, .015);
  } }
};
