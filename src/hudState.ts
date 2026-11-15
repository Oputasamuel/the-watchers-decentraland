export type ChapelScreen = 'briefing' | 'countdown' | 'playing' | 'jumpscare' | 'gameOver' | 'title' | 'transition'
export type LeaderboardEntry = { name: string; crystals: number; seconds: number }

export type ChapelHudState = {
  secured: number
  total: number
  carrying: number
  crystalPulse: number
  candleSeconds: number
  inIgnitionZone: boolean
  toast: string
  toastAlpha: number
  escaped: boolean
  screen: ChapelScreen
  scareAlpha: number
  countdownSeconds: number
  caretakerVisible: boolean
  leaderboardVisible: boolean
  leaderboardDate: string
  leaderboardEntries: LeaderboardEntry[]
  bestRun: LeaderboardEntry | null
  leaderboardStatus: string
}

export const CRYSTAL_CARRY_LIMIT = 1

const state: ChapelHudState = {
  secured: 0,
  total: 25,
  carrying: 0,
  crystalPulse: 0.72,
  candleSeconds: 0,
  inIgnitionZone: false,
  toast: '',
  toastAlpha: 0,
  escaped: false,
  screen: 'briefing',
  scareAlpha: 0,
  countdownSeconds: 5,
  caretakerVisible: false,
  leaderboardVisible: false,
  leaderboardDate: '',
  leaderboardEntries: [],
  bestRun: null,
  leaderboardStatus: 'LOADING SCORES'
}
let toastRemaining = 0
let pulseClock = 0

export function getChapelHudState(): Readonly<ChapelHudState> { return state }

export function setCrystalProgress(secured: number, carrying: number): void {
  if (state.secured !== secured) state.secured = secured
  if (state.carrying !== carrying) state.carrying = carrying
}

export function setCandleSeconds(seconds: number): void {
  const rounded = Math.max(0, Math.min(20, Math.round(seconds * 10) / 10))
  if (state.candleSeconds !== rounded) state.candleSeconds = rounded
}

export function setInIgnitionZone(inside: boolean): void {
  if (state.inIgnitionZone !== inside) state.inIgnitionZone = inside
}

export function showChapelToast(message: string, seconds = 3.5): void {
  state.toast = message
  toastRemaining = seconds
  state.toastAlpha = 1
}

export function setChapelEscaped(escaped = true): void { state.escaped = escaped }
export function setChapelScreen(screen: ChapelScreen): void {
  state.screen = screen
  if (screen !== 'playing') { state.caretakerVisible = false; state.leaderboardVisible = false }
}
export function showCaretakerDialogue(): void {
  state.caretakerVisible = true
}
export function closeCaretakerDialogue(): void { state.caretakerVisible = false }
export function openLeaderboard(): void { state.leaderboardVisible = true; state.caretakerVisible = false }
export function closeLeaderboard(): void { state.leaderboardVisible = false }
export function setLeaderboardData(date: string, entries: LeaderboardEntry[], best: LeaderboardEntry | null, status = ''): void {
  state.leaderboardDate = date
  state.leaderboardEntries = entries.slice(0, 10)
  state.bestRun = best
  state.leaderboardStatus = status
}
export function setCountdownSeconds(seconds: number): void { state.countdownSeconds = Math.max(0, Math.ceil(seconds)) }
export function setScareAlpha(alpha: number): void { state.scareAlpha = Math.max(0, Math.min(1, alpha)) }
export function clearChapelToast(): void { state.toast = ''; state.toastAlpha = 0; toastRemaining = 0 }

// Called from the scene's engine system. No browser timers or storage are used.
export function tickChapelHud(dt: number): void {
  pulseClock += dt
  state.crystalPulse = state.carrying > 0 ? 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(pulseClock * 5)) : 0.72
  if (toastRemaining <= 0) return
  toastRemaining = Math.max(0, toastRemaining - dt)
  state.toastAlpha = Math.min(1, toastRemaining / 0.5)
  if (toastRemaining === 0) state.toast = ''
}
