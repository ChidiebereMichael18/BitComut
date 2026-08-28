"use client"

const SOUND_PREF = "bitcomut:sound-alerts"

export function getSoundAlertsEnabled(): boolean {
  if (typeof window === "undefined") return true
  try {
    return window.localStorage.getItem(SOUND_PREF) !== "off"
  } catch {
    return true
  }
}

export function setSoundAlertsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SOUND_PREF, enabled ? "on" : "off")
  } catch {
    // ignore storage errors
  }
}

let audioCtx: AudioContext | null = null

function ensureAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {
      // browsers may keep the context suspended until the user interacts
    })
  }
  return audioCtx
}

function tone(
  context: AudioContext,
  freq: number,
  offset: number,
  duration: number,
  volume: number
): void {
  const t0 = context.currentTime + offset
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = "sine"
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Two-tone ascending chime for incoming settled transactions. */
export function playSettlementChime(): void {
  if (!getSoundAlertsEnabled()) return
  const context = ensureAudioContext()
  if (!context) return
  tone(context, 660, 0, 0.18, 0.18)
  tone(context, 880, 0.12, 0.22, 0.16)
}