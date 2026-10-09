// ============================================================
//  PLATEFORME — ce qui diffère entre navigateur, Android et iOS :
//  vibrations, partage natif, bouton retour, mise en arrière-plan.
//  Sur le web, les plugins Capacitor basculent sur les API du navigateur.
// ============================================================
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { store } from '../core/storage.js';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'web' | 'android' | 'ios'

let hapticsOn = store.get('haptics', true);
export const hapticsEnabled = () => hapticsOn;
export function setHaptics(v) { hapticsOn = v; store.set('haptics', v); }

// kind : 'light' | 'medium' | 'heavy' | 'success' | 'error'
export function haptic(kind = 'medium') {
  if (!hapticsOn) return;
  try {
    if (isNative) {
      if (kind === 'success') Haptics.notification({ type: NotificationType.Success });
      else if (kind === 'error') Haptics.notification({ type: NotificationType.Error });
      else Haptics.impact({ style: { light: ImpactStyle.Light, heavy: ImpactStyle.Heavy }[kind] || ImpactStyle.Medium });
    } else if (navigator.vibrate) {
      navigator.vibrate({ light: 10, medium: 25, heavy: 60, success: [20, 40, 20], error: [70, 40, 110] }[kind] || 25);
    }
  } catch (e) { /* pas de vibreur : tant pis */ }
}

// Partage du score : feuille de partage native, sinon copie dans le presse-papiers
export async function shareText(text, onCopied) {
  try {
    const can = await Share.canShare();
    if (can.value) { await Share.share({ text }); return; }
  } catch (e) { if (/cancel/i.test(String(e))) return; }
  try { await navigator.clipboard.writeText(text); onCopied(); } catch (e) { onCopied(text); }
}

// Partage d'une image (la carte de fin de course).
// Web : feuille de partage du téléphone si elle accepte les images, sinon téléchargement (+ texte copié).
// Appli : partage du texte (le partage d'image natif demanderait un plugin de fichiers en plus).
export async function shareImage(blob, name, text, onDone) {
  if (!isNative && blob) {
    try {
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch (e) { if (/abort|cancel/i.test(String((e && e.name) || e))) return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    try { await navigator.clipboard.writeText(text); } catch (e) { /* tant pis */ }
    onDone('saved'); return;
  }
  return shareText(text, t => onDone(t ? 'text:' + t : 'copied'));
}

export function quitApp() { if (platform === 'android') App.exitApp(); }

export function initPlatform({ onPause, onResume, onBack }) {
  if (!isNative) return;
  App.addListener('pause', onPause);
  App.addListener('resume', onResume);
  App.addListener('backButton', onBack);
  StatusBar.hide().catch(() => {});
  ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
}
