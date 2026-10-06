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

export function quitApp() { if (platform === 'android') App.exitApp(); }

export function initPlatform({ onPause, onResume, onBack }) {
  if (!isNative) return;
  App.addListener('pause', onPause);
  App.addListener('resume', onResume);
  App.addListener('backButton', onBack);
  StatusBar.hide().catch(() => {});
  ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
}
