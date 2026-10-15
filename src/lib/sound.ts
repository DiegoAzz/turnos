/**
 * Sistema de Sonido y Notificaciones en Segundo Plano para TurnoYa
 * Diseñado para sonar incluso si la pestaña está en segundo plano o minimizada.
 */

// Genera un sonido WAV en base64 de doble campana (Ding-Dong nítido y fuerte)
function createChimeWavBase64(): string {
  const sampleRate = 22050;
  const duration = 1.0; // 1 segundo
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint16(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true);

  // Generar dos tonos de campana: Tono 1 (784 Hz - G5) + Tono 2 (1046.5 Hz - C6)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Campana 1 (desde t=0s)
    if (t < 0.8) {
      const decay1 = Math.exp(-t * 5);
      sample += Math.sin(2 * Math.PI * 784 * t) * decay1 * 0.6;
      sample += Math.sin(2 * Math.PI * 1568 * t) * decay1 * 0.2; // armónico
    }

    // Campana 2 (desde t=0.18s)
    if (t > 0.18) {
      const t2 = t - 0.18;
      const decay2 = Math.exp(-t2 * 4.5);
      sample += Math.sin(2 * Math.PI * 1046.5 * t2) * decay2 * 0.7;
      sample += Math.sin(2 * Math.PI * 2093 * t2) * decay2 * 0.25; // armónico
    }

    // Limitar amplitud
    sample = Math.max(-1, Math.min(1, sample));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convertir a base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:audio/wav;base64," + btoa(binary);
}

let cachedAudioElement: HTMLAudioElement | null = null;
let sharedAudioCtx: AudioContext | null = null;

export function getOrCreateAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!cachedAudioElement) {
    try {
      const dataUri = createChimeWavBase64();
      cachedAudioElement = new Audio(dataUri);
      cachedAudioElement.volume = 1.0;
      cachedAudioElement.preload = "auto";
    } catch (e) {
      console.warn("No se pudo crear elemento de audio:", e);
    }
  }
  return cachedAudioElement;
}

// Desbloquear permisos de audio al primer toque/clic
export function unlockAudio() {
  if (typeof window === "undefined") return;

  // 1. Desbloquear HTML5 Audio
  const audio = getOrCreateAudioElement();
  if (audio) {
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
    }).catch(() => {
      // Normal si el usuario no ha hecho clic aún
    });
  }

  // 2. Desbloquear Web Audio Context
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioContextClass();
      }
      if (sharedAudioCtx.state === "suspended") {
        sharedAudioCtx.resume();
      }
    }
  } catch (_) {}
}

// Reproducir sonido garantizado (intenta Audio Element y Web Audio)
export function playAlertChime() {
  if (typeof window === "undefined") return;

  // Intento 1: HTML5 Audio (el más confiable en pestañas inactivas)
  const audio = getOrCreateAudioElement();
  if (audio) {
    try {
      audio.currentTime = 0;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn("Audio element play bloqueado:", err);
        });
      }
    } catch (err) {
      console.warn("Error con audio element:", err);
    }
  }

  // Intento 2: Web Audio API Oscillator
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!sharedAudioCtx) {
        sharedAudioCtx = new AudioContextClass();
      }
      if (sharedAudioCtx.state === "suspended") {
        sharedAudioCtx.resume();
      }

      const ctx = sharedAudioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (_) {}
}

// Solicitar permiso de notificaciones del sistema (escritorio / celular)
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  return false;
}

// Disparar notificación nativa del sistema operativo
export function showSystemNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        silent: false, // Permite que el sistema operativo emita su propio sonido si está configurado
      });
    } catch (e) {
      console.warn("No se pudo mostrar notificación del sistema:", e);
    }
  }
}
