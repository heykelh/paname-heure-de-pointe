// Sauvegarde locale (réglages, langue…)
export const store = {
  get(k, d) { try { const v = localStorage.getItem('phdp:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('phdp:' + k, JSON.stringify(v)); } catch (e) {} }
};
