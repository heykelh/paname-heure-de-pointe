// ============================================================
//  SON — synthétisé en direct (WebAudio). Des sons enregistrés optionnels
//  peuvent remplacer n'importe quel bruitage (voir loadSamples plus bas).
//  Trois bus indépendants : musique, bruitages, ambiance.
//  - play(nom)       : bruitage ponctuel (voir la liste SFX plus bas)
//  - hit(type)       : collision avec un personnage (son « signature »)
//  - music(piste)    : change la musique ('menu', 'corridor', 'wagon', 'exit')
//  - override(piste, s) : musique temporaire (ex. 'star' pendant le Pardon)
//  - ambience(mode)  : fond sonore ('menu', 'corridor', 'wagon', 'none')
//  - frame(dt, ctx)  : appelé à chaque image, adapte l'ambiance à la situation
// ============================================================
import { store } from '../core/storage.js';
import { TRACKS } from './tracks.js';

const rand = (a, b) => a + Math.random() * (b - a);

export const Snd = {
  ac: null,
  on: { music: store.get('music', true), sfx: store.get('sfx', true), amb: store.get('amb', true) },
  trackName: 'menu', ovr: null, paused: false, mode: 'none', samples: {},
  _step: 0, _next: 0, _timer: null,
  st: { stepT: 0, beatT: 0, clackT: 0, trainT: 8, tenseT: 0, crowd: 0 },

  init() {
    if (this.ac) { this.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ac = this.ac = new AC();
    // chaîne : bus → filtre maître (étouffé en pause) → compresseur → sortie
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
    this.master = ac.createGain(); this.master.gain.value = .8;
    this.mFilter = ac.createBiquadFilter(); this.mFilter.type = 'lowpass'; this.mFilter.frequency.value = 20000;
    this.master.connect(this.mFilter); this.mFilter.connect(comp);
    const bus = () => { const g = ac.createGain(); g.connect(this.master); return g; };
    this.sfxBus = bus(); this.ambBus = bus();
    // musique : gain de « ducking » + filtre de stress
    this.musicBus = bus(); this.duckG = ac.createGain(); this.stressF = ac.createBiquadFilter(); this.stressF.type = 'lowpass'; this.stressF.frequency.value = 20000;
    this.musicIn = ac.createGain(); this.musicIn.gain.value = .55; this.musicIn.connect(this.stressF); this.stressF.connect(this.duckG); this.duckG.connect(this.musicBus);
    this.applyOn();
    // bruits de base
    const mk = (sec, brown) => { const n = ac.sampleRate * sec, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let last = 0;
      for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; } return b; };
    this.white = mk(2, false); this.brown = mk(4, true);
    // couches d'ambiance permanentes (volume piloté dans frame)
    const loop = (buf, ftype, freq, q) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; if (q) f.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.ambBus); s.start(); return { g, f }; };
    this.crowd = loop(this.white, 'bandpass', 650, .8);
    this.rumble = loop(this.brown, 'lowpass', 150);
    const hum = ac.createOscillator(); hum.type = 'sawtooth'; hum.frequency.value = 98; const hf = ac.createBiquadFilter(); hf.type = 'lowpass'; hf.frequency.value = 240; const hg = ac.createGain(); hg.gain.value = 0;
    hum.connect(hf); hf.connect(hg); hg.connect(this.ambBus); hum.start(); this.hum = { g: hg, o: hum };
    const wh = ac.createOscillator(); wh.type = 'triangle'; wh.frequency.value = 320; const wg = ac.createGain(); wg.gain.value = 0; wh.connect(wg); wg.connect(this.ambBus); wh.start(); this.whine = { g: wg, o: wh };
    // déblocage iOS : jouer un son vide pendant le geste de l'utilisateur
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0);
    this._timer = setInterval(() => this._sched(), 25);
    this._next = ac.currentTime + .1;
    this.loadSamples();
  },

  /* ---------- sons enregistrés (optionnels) ----------
     Déposez un fichier .mp3 dans public/sounds/ et ajoutez son nom dans public/sounds/index.json :
     il remplace alors le son synthétisé. Exemples de noms : "hit-tchipeur", "hit-shlagg", "coin", "star". */
  async loadSamples() {
    try {
      const r = await fetch('./sounds/index.json');
      if (!r.ok) return;
      const names = await r.json();
      for (const n of names) {
        try {
          const f = await fetch(`./sounds/${n}.mp3`);
          if (f.ok) this.samples[n] = await this.ac.decodeAudioData(await f.arrayBuffer());
        } catch (e) { /* fichier absent ou illisible : on garde le son synthétisé */ }
      }
    } catch (e) { /* pas de dossier sounds : tout est synthétisé */ }
  },
  sample(name, vol = 1) {
    const b = this.samples[name]; if (!b || !this.ac) return false;
    const s = this.ac.createBufferSource(), g = this.ac.createGain();
    s.buffer = b; s.playbackRate.value = rand(.96, 1.04); g.gain.value = vol;
    s.connect(g); g.connect(this.sfxBus); s.start(); return true;
  },
  resume() { if (this.ac && this.ac.state !== 'running') this.ac.resume(); },
  suspend() { if (this.ac && this.ac.state === 'running') this.ac.suspend(); },
  applyOn() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    this.musicBus.gain.setTargetAtTime(this.on.music ? 1 : 0, t, .05);
    this.sfxBus.gain.setTargetAtTime(this.on.sfx ? 1 : 0, t, .05);
    this.ambBus.gain.setTargetAtTime(this.on.amb ? 1 : 0, t, .05);
  },
  setOn(kind, v) { this.on[kind] = v; store.set(kind, v); this.applyOn(); },

  /* ---------- briques de base ---------- */
  tone(f, d, o = {}) {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime + (o.at || 0), osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'square'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + d);
    if (o.detune) osc.detune.value = o.detune;
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + .05); }
    const v = o.vol ?? .12, a = o.attack ?? .005;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
    if (o.hold) g.gain.setValueAtTime(v, t + o.hold);
    g.gain.exponentialRampToValueAtTime(.0001, t + d);
    let out = g;
    if (o.lp) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = o.lp; g.connect(f2); out = f2; }
    osc.connect(g); out.connect(o.bus || this.sfxBus); osc.start(t); osc.stop(t + d + .05);
  },
  noise(d, o = {}) {
    if (!this.ac) return;
    const ac = this.ac, t = ac.currentTime + (o.at || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = o.brown ? this.brown : this.white; s.playbackRate.value = o.rate || 1;
    f.type = o.ftype || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); f.Q.value = o.q ?? 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + d);
    const v = o.vol ?? .2;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack ?? .004)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus); s.start(t, Math.random() * 1.5); s.stop(t + d + .05);
  },
  // son d'accordéon : deux dents de scie légèrement désaccordées
  acc(f, d, at, vol = .03, bus) { this.tone(f, d, { type: 'sawtooth', vol, at, detune: -7, lp: 2200, attack: .02, bus }); this.tone(f, d, { type: 'sawtooth', vol, at, detune: 7, lp: 2200, attack: .02, bus }); },
  duck(level = .35, sec = 2.5) {
    if (!this.ac) return; const t = this.ac.currentTime;
    this.duckG.gain.cancelScheduledValues(t); this.duckG.gain.setTargetAtTime(level, t, .08); this.duckG.gain.setTargetAtTime(1, t + sec, .4);
  },

  /* ---------- bruitages ---------- */
  play(name) {
    if (!this.ac) return;
    if (this.sample(name)) return;
    const r = rand(.94, 1.06);
    switch (name) {
      case 'tap': this.tone(1046 * r, .05, { vol: .06 }); break;
      case 'select': this.tone(784, .06, { vol: .07 }); this.tone(1175, .09, { vol: .07, at: .05 }); break;
      case 'coin': { // « ding » à deux notes façon console 8 bits
        const ac = this.ac, t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = 'square';
        o.frequency.setValueAtTime(987.77, t); o.frequency.setValueAtTime(1318.51, t + .083);
        g.gain.setValueAtTime(.09, t); g.gain.setValueAtTime(.09, t + .083); g.gain.linearRampToValueAtTime(.075, t + .2); g.gain.exponentialRampToValueAtTime(.0001, t + .62);
        o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + .65); break; }
      case 'shrink': [880, 740, 622, 523, 440].forEach((f, i) => this.tone(f, .07, { vol: .08, at: i * .055 })); break;
      case 'grow': [440, 523, 622, 740, 880].forEach((f, i) => this.tone(f, .07, { vol: .07, at: i * .055 })); break;
      case 'star': [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, .1, { vol: .06, at: i * .045 })); this.noise(.4, { f: 6000, q: 2, vol: .05, ftype: 'highpass' }); break;
      case 'hero': [523, 659, 784, 1047].forEach((f, i) => { this.tone(f, .18, { type: 'triangle', vol: .16, at: i * .08 }); this.tone(f * 1.5, .14, { vol: .03, at: i * .08 }); }); this.tone(1047, .5, { type: 'triangle', vol: .12, at: .32 }); break;
      case 'thanks': this.tone(659, .12, { type: 'sine', vol: .12 }); this.tone(880, .3, { type: 'sine', vol: .12, at: .1 }); break;
      case 'steal': this.noise(.25, { f: 800, to: 5000, q: 1.5, vol: .2 }); [988, 784, 523].forEach((f, i) => this.tone(f, .08, { vol: .06, at: .15 + i * .07 })); break;
      case 'fine': this.tone(2200, .18, { type: 'sine', vol: .18, vib: [28, 120] }); this.tone(2200, .45, { type: 'sine', vol: .18, vib: [28, 120], at: .24 }); this.duck(.3, 1.2); break;
      case 'seat': this.noise(.25, { ftype: 'lowpass', f: 500, vol: .2, brown: true }); this.tone(392, .25, { type: 'sine', vol: .12, at: .05 }); this.tone(523, .5, { type: 'sine', vol: .12, at: .16 }); break;
      case 'strap': this.tone(190, .25, { type: 'sawtooth', vol: .05, slide: 140, vib: [30, 15], lp: 900 }); this.noise(.08, { f: 300, vol: .15, at: .2 }); break;
      case 'glare': this.noise(.35, { f: 3500, q: 4, vol: .12, to: 2500 }); this.tone(196, .4, { type: 'triangle', vol: .1, slide: 160, at: .1 }); break;
      case 'brake': this.tone(rand(1700, 2100), .9, { type: 'sawtooth', vol: .035, slide: 1300, vib: [11, 40], lp: 4000 }); this.noise(.8, { f: 3200, q: 5, vol: .12, to: 2600 }); this.noise(.5, { ftype: 'lowpass', f: 200, vol: .25, brown: true, at: .1 }); break;
      case 'chime': this.duck(.3, 2.2); [784, 1047, 1319].forEach((f, i) => { this.tone(f, 1.2, { type: 'sine', vol: .1, at: i * .28 }); this.tone(f * 2.01, .6, { type: 'sine', vol: .02, at: i * .28 }); }); break;
      case 'doorsOpen': this.play('chime'); this.noise(.6, { ftype: 'highpass', f: 1800, vol: .18, at: .5, attack: .02 }); this.tone(90, .2, { type: 'triangle', vol: .12, at: .5 }); break;
      case 'doorsClose': for (let i = 0; i < 4; i++) this.tone(440, .12, { vol: .05, at: i * .16 }); this.noise(.3, { ftype: 'highpass', f: 1500, vol: .15, at: .7 }); this.tone(70, .25, { type: 'square', vol: .1, at: .95, lp: 300 }); break;
      case 'runnerWarn': this.tone(1320, .06, { vol: .07 }); this.tone(1320, .06, { vol: .07, at: .1 }); break;
      case 'coo': this.tone(430 * r, .12, { type: 'sine', vol: .12, slide: 360 }); this.tone(390 * r, .18, { type: 'sine', vol: .12, slide: 330, at: .14 }); break;
      case 'flap': for (let i = 0; i < 6; i++) this.noise(.05, { f: 1500, q: .7, vol: .12, at: i * .05 }); break;
      case 'phase': this.noise(.5, { f: 400, to: 3000, q: .8, vol: .1 }); [523, 659, 784].forEach((f, i) => this.tone(f, .3, { type: 'triangle', vol: .1, at: .2 + i * .06 })); break;
      case 'win': this.music('none'); [523, 659, 784, 659, 784, 1047, 1047].forEach((f, i) => { this.tone(f, .22, { type: 'square', vol: .07, at: i * .13 }); this.tone(f / 2, .22, { type: 'triangle', vol: .14, at: i * .13 }); }); break;
      case 'over': this.music('none'); [392, 370, 349, 330, 262].forEach((f, i) => this.tone(f, .38, { type: 'sawtooth', vol: .06, at: i * .25, lp: 1800 })); this.tone(120, .8, { type: 'sine', vol: .2, slide: 50, at: 1.2 }); break;
      case 'pause': this.tone(660, .08, { vol: .07 }); this.tone(440, .12, { vol: .07, at: .08 }); break;
      case 'unpause': this.tone(440, .08, { vol: .07 }); this.tone(660, .12, { vol: .07, at: .08 }); break;
      case 'aura': this.acc(rand(300, 420), .5, 0, .02); break;
      case 'navigo': this.tone(1760, .07, { type: 'sine', vol: .14 }); this.tone(2349, .14, { type: 'sine', vol: .14, at: .08 }); break;   // bip de validation
      case 'turnstile': this.noise(.05, { f: 2500, q: 3, vol: .25 }); this.tone(110, .12, { type: 'square', vol: .1, slide: 70, lp: 500, at: .03 }); this.noise(.08, { ftype: 'lowpass', f: 300, vol: .25, brown: true, at: .05 }); break; // clac du bras
      case 'jump': this.tone(260, .28, { vol: .07, slide: 900 }); this.tone(520, .2, { vol: .03, slide: 1400, at: .05 }); break;   // « boïng » du saut
      case 'crowdOh': for (let i = 0; i < 4; i++) this.tone(rand(230, 330), .7, { type: 'sawtooth', vol: .025, slide: rand(160, 200), lp: 900, attack: .08, at: .15 + i * .03 }); this.noise(.6, { f: 700, q: .8, vol: .08, at: .15, attack: .1 }); break; // « ohhh ! » de la foule
    }
  },
  // « tchiiip » : petit claquement de langue, puis l'air aspiré entre les dents
  tchip(r = 1) {
    const ac = this.ac;
    this.noise(.012, { ftype: 'highpass', f: 3000, vol: .4 });          // claquement
    this.noise(.05, { f: 2300 * r, q: 2, vol: .35, at: .01 });          // « tch »
    const t = ac.currentTime + .05, s = ac.createBufferSource(), f = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.white; f.type = 'bandpass'; f.Q.value = 12;
    f.frequency.setValueAtTime(2800 * r, t); f.frequency.linearRampToValueAtTime(3900 * r, t + .34);   // « iiip » qui monte
    f2.type = 'highpass'; f2.frequency.value = 1500;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(1.6, t + .07); g.gain.setValueAtTime(1.6, t + .28); g.gain.exponentialRampToValueAtTime(.0001, t + .38);
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(this.sfxBus); s.start(t, Math.random()); s.stop(t + .42);
    this.tone(3000 * r, .3, { type: 'sine', vol: .03, slide: 3700 * r, at: .08, attack: .06 });   // léger sifflement
  },
  // collision : un petit choc + le bruitage « signature » (et drôle) du personnage
  hit(type) {
    if (!this.ac) return;
    if (this.sample('hit-' + type)) return;
    const r = rand(.92, 1.08);
    this.tone(150 * r, .1, { vol: .08, slide: 80 }); this.noise(.06, { f: 500, vol: .14 });
    switch (type) {
      case 'basique': // « oh, pardon ! »
        this.tone(620 * r, .12, { type: 'triangle', vol: .14, slide: 520, at: .03 }); this.tone(470 * r, .22, { type: 'triangle', vol: .14, slide: 400, at: .16 }); break;
      case 'tchipeur': this.tchip(r); break;
      case 'shlagg': // un rot bien gras
        this.tone(170 * r, .55, { type: 'sawtooth', vol: .1, slide: 75, vib: [22, 30], lp: 600, at: .03 }); this.noise(.5, { ftype: 'lowpass', f: 380, vol: .22, brown: true, at: .03 }); break;
      case 'frotteur': // rire de vilain « hé hé hé » + sifflet qui monte
        for (let i = 0; i < 3; i++) this.tone(270 * r, .09, { type: 'square', vol: .05, slide: 220, lp: 1200, at: .04 + i * .13 });
        this.tone(500, .4, { type: 'sine', vol: .08, slide: 1500, at: .45 }); break;
      case 'susu': // « splotch » + gouttes
        this.noise(.18, { ftype: 'lowpass', f: 700, vol: .32, brown: true }); [900, 1300, 1700].forEach((f, i) => this.tone(f * r, .06, { type: 'sine', vol: .11, slide: f * 1.6, at: .14 + i * .09 })); break;
      case 'theologiste': // sermon « bla bla bla » + cloche
        for (let i = 0; i < 5; i++) this.tone(rand(150, 240), .09, { type: 'triangle', vol: .11, at: .03 + i * .1, lp: 900, slide: rand(120, 200) });
        this.tone(880, .9, { type: 'sine', vol: .07, at: .58 }); this.tone(1777, .5, { type: 'sine', vol: .02, at: .58 }); break;
      case 'voleur': // « zwip ! » + la pièce qui file
        this.noise(.2, { f: 600, to: 6000, q: 2, vol: .28 }); this.tone(400, .18, { vol: .05, slide: 1600 });
        [1319, 988, 784, 523].forEach((f, i) => this.tone(f, .06, { vol: .05, at: .22 + i * .06 })); break;
      case 'artiste': // fausse note d'accordéon
        [262, 277, 311, 233].forEach((f, i) => this.acc(f * r, .22, .03 + i * .08, .03)); this.acc(185, .6, .36, .03); break;
      case 'enfant': // « hihihi »
        for (let i = 0; i < 5; i++) this.tone((1400 - i * 90) * r, .07, { vol: .05, at: .03 + i * .08, vib: [30, 60] }); break;
      case 'poussette': // roue qui grince + « ouinnn »
        this.tone(1600 * r, .25, { type: 'sine', vol: .06, vib: [22, 150] }); this.tone(480, .6, { type: 'sawtooth', vol: .05, at: .22, slide: 380, vib: [7, 40], lp: 1600 }); break;
      case 'encombrant': // valise qui roule + « ouf »
        for (let i = 0; i < 6; i++) this.noise(.03, { f: 1000, vol: .1, at: i * .045 });
        this.noise(.3, { ftype: 'lowpass', f: 220, vol: .35, brown: true, at: .27 }); this.tone(200, .2, { type: 'triangle', vol: .1, slide: 120, at: .29 }); break;
      case 'runner': // « vroum » de dessin animé
        this.noise(.3, { f: 300, to: 3000, q: 1.2, vol: .25 }); for (let i = 0; i < 4; i++) this.noise(.03, { ftype: 'highpass', f: 2500, vol: .08, at: .05 + i * .05 });
        this.tone(300, .3, { vol: .04, slide: 900, at: .05 }); break;
      case 'rambarde': // « boïng » métallique + microbes
        this.tone(220, .5, { type: 'triangle', vol: .14, slide: 440, vib: [14, 25] }); this.tone(1840, .4, { type: 'sine', vol: .05 }); this.noise(.12, { f: 900, q: 3, vol: .1, at: .22 }); break;
      case 'debout': // « hmpf »
        this.tone(200 * r, .14, { type: 'triangle', vol: .09, slide: 160 }); this.noise(.08, { ftype: 'lowpass', f: 500, vol: .1 }); break;
      default: this.tone(260 * r, .1, { type: 'triangle', vol: .08, slide: 200, at: .03 });
    }
  },

  /* ---------- musique ---------- */
  music(name) { if (name === this.trackName) return; this.trackName = name; this._step = 0; if (this.ac) this._next = this.ac.currentTime + .08; },
  override(name, sec) { if (!this.ac) return; this.ovr = { name, until: this.ac.currentTime + sec }; this._step = 0; },
  _sched() {
    if (!this.ac || this.paused || this.ac.state !== 'running') return;
    const now = this.ac.currentTime;
    if (this.ovr && now > this.ovr.until) { this.ovr = null; this._step = 0; }
    const tr = TRACKS[this.ovr ? this.ovr.name : this.trackName];
    if (this._next < now) this._next = now + .02;
    if (!tr) return;
    const stepDur = 60 / tr.bpm / 2; // croches
    while (this._next < now + .15) { tr.play(this, this._step, this._next - now, stepDur); this._next += stepDur; this._step++; }
  },

  /* ---------- pause : tout s'étouffe ---------- */
  setPaused(p) {
    this.paused = p; if (!this.ac) return;
    const t = this.ac.currentTime;
    this.mFilter.frequency.setTargetAtTime(p ? 450 : 20000, t, .1);
    this.master.gain.setTargetAtTime(p ? .5 : .8, t, .1);
    if (!p) this._next = t + .05;
  },

  /* ---------- ambiance selon la situation ---------- */
  ambience(mode) { this.mode = mode; },
  // ctx : { moving, boost, crowd (0..1), ser, doorsOpen, escalator, nearCtrl (0..1), wagonSpeed (0..1) }
  frame(dt, c = {}) {
    if (!this.ac || this.paused) return;
    const t = this.ac.currentTime, st = this.st, set = (node, v) => node.g.gain.setTargetAtTime(v, t, .3);
    st.crowd += ((c.crowd ?? .3) - st.crowd) * Math.min(1, dt * 2);
    const m = this.mode;
    if (m === 'corridor') {
      set(this.crowd, .05 + .14 * st.crowd); set(this.rumble, .06); set(this.hum, c.escalator ? .05 : 0); set(this.whine, 0);
      // un train passe au loin de temps en temps
      if ((st.trainT -= dt) <= 0) { st.trainT = rand(9, 16); this.rumble.g.gain.setTargetAtTime(.35, t, 1.2); this.rumble.g.gain.setTargetAtTime(.06, t + 3, 1.5); this.noise(2.5, { ftype: 'bandpass', f: 2800, q: 6, vol: .015, at: 1, attack: .8 }); }
    } else if (m === 'wagon') {
      const sp = c.doorsOpen ? 0 : (c.wagonSpeed ?? 1);
      set(this.crowd, .04 + .06 * st.crowd); set(this.rumble, .1 + .3 * sp); set(this.hum, .02 * sp); set(this.whine, .012 * sp);
      this.whine.o.frequency.setTargetAtTime(240 + 260 * sp, t, .5);
      // « ta-dam ta-dam » des rails
      if (sp > .2 && (st.clackT -= dt) <= 0) { st.clackT = .95 / sp; for (const d of [0, .11]) this.noise(.07, { ftype: 'lowpass', f: 380, vol: .35, brown: true, at: d, bus: this.ambBus }); }
    } else if (m === 'menu') {
      set(this.crowd, .05); set(this.rumble, .04); set(this.hum, 0); set(this.whine, 0);
    } else { set(this.crowd, 0); set(this.rumble, 0); set(this.hum, 0); set(this.whine, 0); }

    // pas du joueur
    if (c.moving && (st.stepT -= dt) <= 0) {
      st.stepT = c.boost ? .17 : .28; st.foot = !st.foot;
      this.noise(.045, { ftype: 'highpass', f: st.foot ? 2600 : 2200, vol: m === 'wagon' ? .04 : .07 });
    }
    // sérénité basse : battements de cœur + musique étouffée
    const ser = c.ser ?? 100;
    this.stressF.frequency.setTargetAtTime(ser < 30 ? 700 + ser * 40 : 20000, t, .3);
    if (ser < 30 && (st.beatT -= dt) <= 0) {
      st.beatT = .55 + ser / 60;
      const v = .25 + (30 - ser) / 60;
      this.tone(62, .12, { type: 'sine', vol: v }); this.tone(55, .14, { type: 'sine', vol: v * .8, at: .16 });
    }
    // contrôleur tout proche : tension (grésillement de radio + pulsation)
    if (c.nearCtrl > 0 && (st.tenseT -= dt) <= 0) {
      st.tenseT = .7 - c.nearCtrl * .35;
      this.tone(110, .1, { type: 'square', vol: .03 + .05 * c.nearCtrl, lp: 400 });
      if (Math.random() < .3) this.noise(.25, { f: 1800, q: 1, vol: .04 });
    }
  }
};
