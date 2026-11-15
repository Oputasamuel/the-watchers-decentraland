import { engine, PlayerIdentityData, Transform } from '@dcl/sdk/ecs'
import { Storage } from '@dcl/sdk/server'
import { scoreRoom } from './scoreMessages'

type Score = { id: string; name: string; crystals: number; seconds: number }
type Session = { name: string; started: number; crystals: number; returned: Set<number> }
const BEST_KEY = 'watchers-personal-best-v1'
const sessions = new Map<string, Session>()
const bests = new Map<string, Score | null>()
const dirtyBests = new Set<string>()
let date = ''
let daily: Score[] = []
let loaded = false
let dirty = false
let dailyVersion = 0
let flushing = false
let flushRemaining = 20
let dayCheckRemaining = 10

function today(): string { return new Date().toISOString().slice(0, 10) }
function key(day: string): string { return `watchers-daily-v1-${day}` }
function better(a: Score, b: Score | null): boolean {
  return !b || a.crystals > b.crystals || (a.crystals === b.crystals && a.seconds < b.seconds)
}
function clean(value: unknown): Score | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<Score>
  if (typeof row.id !== 'string' || typeof row.name !== 'string' ||
    !Number.isInteger(row.crystals) || !Number.isFinite(row.seconds) ||
    row.crystals! < 0 || row.crystals! > 25 || row.seconds! < 0) return null
  return { id: row.id, name: row.name.slice(0, 12), crystals: row.crystals!, seconds: Math.floor(row.seconds!) }
}
function top(): Score[] {
  return [...daily].sort((a, b) => b.crystals - a.crystals || a.seconds - b.seconds).slice(0, 10)
}
function playerNearAltar(address: string): boolean {
  const root = engine.getEntityOrNullByName('Resize')
  const transform = root ? Transform.getOrNull(root) : null
  const altarX = transform ? transform.position.x + (80.75 - 38) * transform.scale.x / 0.5 : 80.75
  const altarZ = transform ? transform.position.z + (72.5 - 55.5) * transform.scale.z / 0.5 : 72.5
  for (const [entity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
    if (identity.address.toLowerCase() !== address) continue
    const player = Transform.getOrNull(entity)?.position
    return !!player && (player.x - altarX) ** 2 + (player.z - altarZ) ** 2 <= 36
  }
  return false
}
async function loadDay(): Promise<void> {
  const newDate = today()
  if (loaded && date === newDate) return
  if (loaded && dirty) {
    await flush()
    if (dirty) return
  }
  const stored = await Storage.get<unknown>(key(newDate), { fresh: true })
  date = newDate
  daily = Array.isArray(stored) ? stored.map(clean).filter((score): score is Score => score !== null) : []
  loaded = true
  dirty = false
}
async function loadBest(address: string): Promise<Score | null> {
  if (bests.has(address)) return bests.get(address) ?? null
  const value = await Storage.player.get<unknown>(address, BEST_KEY)
  const best = clean(value)
  bests.set(address, best)
  return best
}
async function sendSnapshot(address: string): Promise<void> {
  if (!loaded) {
    await scoreRoom.send('scoreSnapshot', { json: JSON.stringify({ date: '', entries: [], best: null, status: 'SCORES UNAVAILABLE' }) }, { to: [address] })
    return
  }
  try {
    const best = await loadBest(address)
    await scoreRoom.send('scoreSnapshot', { json: JSON.stringify({ date, entries: top(), best }) }, { to: [address] })
  } catch (error) {
    console.error('Could not load personal best', error)
    await scoreRoom.send('scoreSnapshot', { json: JSON.stringify({ date, entries: top(), best: null, status: 'PERSONAL BEST UNAVAILABLE' }) }, { to: [address] })
  }
}
async function flush(): Promise<void> {
  if (flushing) return
  flushing = true
  try {
  if (loaded && dirty) {
    const version = dailyVersion
    const snapshot = [...daily]
    const ok = await Storage.set(key(date), snapshot)
    if (ok && version === dailyVersion) dirty = false
    else console.error('Daily leaderboard was not saved; retrying')
  }
  for (const address of dirtyBests) {
    const best = bests.get(address)
    if (!best) { dirtyBests.delete(address); continue }
    const ok = await Storage.player.set(address, BEST_KEY, best)
    if (ok && bests.get(address) === best) dirtyBests.delete(address)
    else console.error('Personal best was not saved; retrying')
  }
  } finally { flushing = false }
}
export async function startScoreServer(): Promise<void> {
  try { await loadDay() } catch (error) { console.error('Could not load daily leaderboard', error) }
  scoreRoom.onMessage('runStart', (data, context) => {
    if (!context || !loaded) return
    const address = context.from.toLowerCase()
    const name = data.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 12) || 'PLAYER'
    void loadBest(address).then(() => {
      sessions.set(address, { name, started: Date.now(), crystals: 0, returned: new Set() })
      return sendSnapshot(address)
    }).catch(error => console.error('Could not load player best', error))
  })
  scoreRoom.onMessage('crystalReturned', (data, context) => {
    if (!context || !loaded) return
    const address = context.from.toLowerCase()
    const session = sessions.get(address)
    const index = data.crystalIndex
    if (!session || !Number.isInteger(index) || index < 0 || index >= 25 || session.returned.has(index) ||
      !playerNearAltar(address)) return
    session.returned.add(index)
    session.crystals++
    const score: Score = { id: address, name: session.name, crystals: session.crystals,
      seconds: Math.max(1, Math.round((Date.now() - session.started) / 1000)) }
    const previous = daily.find(entry => entry.id === address) ?? null
    if (better(score, previous)) {
      daily = daily.filter(entry => entry.id !== address)
      daily.push(score)
      dirty = true
      dailyVersion++
    }
    const personal = bests.get(address) ?? null
    if (better(score, personal)) { bests.set(address, score); dirtyBests.add(address) }
    void sendSnapshot(address).catch(error => console.error('Could not send score snapshot', error))
  })
  scoreRoom.onMessage('scoreRequest', (_data, context) => {
    if (context) void sendSnapshot(context.from.toLowerCase()).catch(error => console.error('Could not send scores', error))
  })
  scoreRoom.onMessage('runEnd', (_data, context) => {
    if (!context) return
    const address = context.from.toLowerCase()
    sessions.delete(address)
    void flush().catch(error => console.error('Daily leaderboard save failed', error))
  })
  engine.addSystem(dt => {
    flushRemaining -= dt
    dayCheckRemaining -= dt
    if (dayCheckRemaining <= 0) {
      dayCheckRemaining = 10
      if (!loaded || date !== today()) void loadDay().catch(error => console.error('Daily leaderboard refresh failed', error))
    }
    if (flushRemaining <= 0) {
      flushRemaining = 20
      void flush().catch(error => console.error('Daily leaderboard save failed', error))
    }
  })
}
