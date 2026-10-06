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
  star: { bpm: 200, play: (s, i, at, d) => {
    const ch = [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['F4', 'A4', 'C5']][Math.floor(i / 8) % 4], k = i % 8;
    P(s, N(ch[k % 3]) * (k < 4 ? 2 : 4), d * .7, at, .035); if (k % 2 === 0) B(s, N(ch[0]) / 2, d, at, .15); if (k % 2) HAT(s, at);
  } }
};
