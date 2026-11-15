import { AudioSource, Billboard, BillboardMode, CameraModeArea, CameraType, engine, getWorldPosition, GltfContainer, InputAction, InputModifier, LightSource, Material, MaterialTransparencyMode, MeshCollider, MeshRenderer, RealmInfo, ColliderLayer, TextShape, Transform, pointerEventsSystem, type Entity } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { Font } from '@dcl/sdk/ecs'
import { isServer as isServerApi } from '~system/EngineApi'
import { movePlayerTo, stopEmote, triggerEmote, triggerSceneEmote } from '~system/RestrictedActions'
import { isStateSyncronized, myProfile, syncEntity } from '@dcl/sdk/network'
import { getPlayer, onLeaveScene } from '@dcl/sdk/players'
import { CRYSTAL_CARRY_LIMIT, clearChapelToast, getChapelHudState, setCandleSeconds, setChapelEscaped, setChapelScreen, setCountdownSeconds, setCrystalProgress, setInIgnitionZone, setLeaderboardData, setScareAlpha, showCaretakerDialogue, showChapelToast, tickChapelHud } from './hudState'
import { ChapelRun, SharedCrystal } from './sharedChapelState'
import { scoreRoom } from './scoreMessages'
import { setupChapelUi } from './ui'
import { setCaptureActions } from './ui/ChapelHud'
import { bodyFont, titleFont } from './ui/theme'

const CRYSTAL = 'assets/asset-packs/red_crystal/Crystal_02/Crystal_02.glb'
const CRYSTAL_COUNT = 25
const IGNITER = 'assets/asset-packs/grave__34/HWN20_Grave_34.glb'
const PICKUP_EMOTE = 'assets/animations/PickUp_Anim_emote.glb'
const PICKUP_DURATION = 0.97
const MAX_LIGHT_SECONDS = 20
const LIGHT_REFILL_PER_SECOND = 2
const IGNITION_RADIUS = 2.6
const WATCHER_SPEED = 0.9
const GHOST_MODEL = 'assets/asset-packs/ghost_01/HWN20_Ghost_01.glb'
const GHOST_NOTICE_RADIUS = 16
const GHOST_LOSE_RADIUS = 24
const GHOST_SPEED = 1.15
const GHOST_CATCH_RADIUS = 1.6
const GHOST_WHISPER = 'assets/audio/ghost-whisper.mp3'
const GHOST_WHISPER_CYCLE = 2.904 + 3
const CHANT_AUDIO = 'assets/audio/chapel-monk-chant.mp3'
const GHOST_AUDIO = 'assets/audio/chapel-ghost-ambience.mp3'
const JUMPSCARE_AUDIO = 'assets/audio/jumpscare-screech.mp3'
const ANGEL_SCRAPE_AUDIO = 'assets/audio/angel-stone-scrape.mp3'
const CRYSTAL_PICKUP_AUDIO = 'assets/audio/orb-pickup.ogg'
const CRYSTAL_RETURN_AUDIO = 'assets/audio/vault-deposit.ogg'
const START_COUNTDOWN_SECONDS = 5
const FOG_TEXTURE = 'assets/images/chapel-fog.png'
const DECOR_MODELS = {
  bones: 'assets/asset-packs/skeleton_couple/skeleton_couple/skeleton_couple.glb',
  searching: 'assets/asset-packs/searching_skeleton/searching_skeleton/searching_skeleton.glb',
  skullA: 'assets/asset-packs/skull&candles/HWN20_Skull&Candles_01.glb',
  skullB: 'assets/asset-packs/skull&candles/HWN20_Skull&Candles_02.glb'
} as const
const WATCHER_MODEL = 'assets/models/model_(17)/model_(17).glb'
const SCARE_HOLD_SECONDS = 1.6
const SCARE_FADE_SECONDS = 0.9
const KNOCKOUT_SECONDS = 2.2
// World coordinates here describe the current Creator Hub layout, whose Resize
// group is at (38, 55.5) with scale 0.5. layoutPoint() keeps these spots attached
// if that entire group is moved or scaled again.
const referenceRoot = { x: 38, z: 55.5, scale: 0.5 }
let layoutRoot: Entity | null = null
let layoutStamp = ''
let altar = Vector3.Zero()
let altarReturn = Vector3.Zero()
let entrance = Vector3.Zero()
let exit = Vector3.Zero()
// Crystal locations are shuffled within each walkable area every run.
const spawnZones = [
  { crystals: 2, spots: [[78.4,72.2], [83.8,72.2], [81.7,73.5]] }, // altar
  { crystals: 8, spots: [[78,78], [83,78], [78,83], [83,83], [78,88], [83,88], [78,93], [83,93], [80.8,99]] }, // nave
  { crystals: 2, spots: [[47,63], [48,71.5], [53,68]] }, // coffin room
  { crystals: 2, spots: [[75,59], [90,59], [82,60.5]] }, // rear tunnel
  { crystals: 4, spots: [[43,89], [55,89], [43,99], [55,99], [49,94]] }, // cemetery
  { crystals: 7, spots: [[48,108], [43,113], [58,117], [67,117], [86,118], [96,120], [104,113], [105,104], [72,110]] } // compound
] as const
const igniterLocations = [
  [77, 76], [84, 76], [77, 96], [84, 96], // four chapel corners
  [49, 69], // coffin room
  [50, 110], [101, 111] // outside compound
] as const
type Area = 'cemetery' | 'compoundLeft' | 'compoundRight' | 'churchLeft' | 'churchRight' | 'roomTunnel'
type Watcher = { entity: Entity; home: Vector3; worldHome: Vector3; area: Area;
  lastWorldPosition: Vector3; soundActive: boolean }
type Ghost = { entity: Entity; home: Vector3; worldHome: Vector3; chasing: boolean; whisperTimer: number; whisperActive: boolean }
type ParticleMote = { entity: Entity; kind: 'ghost' | 'igniter' | 'altar'; phase: number; index: number }
const watcherNames: { name: string; area: Area }[] = [
  { name: 'Watcher1 for compound', area: 'cemetery' },
  { name: 'Watcher2 ftor compound', area: 'compoundLeft' },
  { name: 'Watcher3 for compound', area: 'compoundRight' },
  { name: 'Watcher ftor Church1', area: 'churchLeft' },
  { name: 'Watcher for church2', area: 'churchRight' },
  { name: 'Watcher for room and tunnel', area: 'roomTunnel' }
]
const crystals: {entity: Entity; hitbox: Entity}[] = []
const altarCrystals: Entity[] = []
const crystalPoints: Vector3[] = []
const crystalHitboxPoints: Vector3[] = []
const igniters: Entity[] = []
const igniterPoints: Vector3[] = []
const igniterLights: Entity[] = []
const houseIgniters: Entity[] = []
const fogSheets: { entity: Entity; x: number; z: number; y: number; drift: number; speed: number; bob: number; phase: number }[] = []
const scatteredDecor: { entity: Entity; x: number; z: number }[] = []
const watchers: Watcher[] = []
const ghosts: Ghost[] = []
const particleMotes: ParticleMote[] = []
const carriedCrystals: number[] = []
let secured = 0
let lightRemaining = MAX_LIGHT_SECONDS
let catchCooldown = 0
let escaped = false
let gate: Entity | null = null
let gateStartY = 0
let gateRise = 0
let status: Entity
let pickupRemaining = 0
let captureElapsed = 0
let knockoutRemaining = 0
let jumpscareAudio: Entity
let pickupAudio: Entity
let returnAudio: Entity
let caretakerHouse: Entity | null = null
let countdownRemaining = START_COUNTDOWN_SECONDS
let runEntity: Entity
let currentSeed = 1
let syncWaitSeconds = 0
let localOnlyRun = false
let fallbackPlayerId = 'local-player'
let wasLeaderboardOpen = false
let leaderboardRefreshRemaining = 0
function currentPlayerId(): string { return localOnlyRun ? fallbackPlayerId : myProfile.userId || 'local-player' }
function runStateReady(): boolean { return isStateSyncronized() || localOnlyRun }
function layoutPoint(x: number, z: number, y = 0): Vector3 {
  const root = layoutRoot ? Transform.get(layoutRoot) : null
  if (!root) return Vector3.create(x, y, z)
  return Vector3.create(
    root.position.x + (x - referenceRoot.x) * root.scale.x / referenceRoot.scale,
    root.position.y + y,
    root.position.z + (z - referenceRoot.z) * root.scale.z / referenceRoot.scale
  )
}
function referencePosition(point: Vector3): { x: number; z: number } {
  const root = layoutRoot ? Transform.get(layoutRoot) : null
  if (!root) return point
  return {
    x: referenceRoot.x + (point.x - root.position.x) * referenceRoot.scale / root.scale.x,
    z: referenceRoot.z + (point.z - root.position.z) * referenceRoot.scale / root.scale.z
  }
}
function refreshLayoutAnchors(): boolean {
  const root = layoutRoot ? Transform.get(layoutRoot) : null
  const stamp = root ? `${root.position.x},${root.position.y},${root.position.z},${root.scale.x},${root.scale.y},${root.scale.z}` : 'no-root'
  if (stamp === layoutStamp) return false
  layoutStamp = stamp
  altar = layoutPoint(80.75, 68.25)
  altarReturn = layoutPoint(80.75, 72.5)
  entrance = layoutPoint(80.75, 121.75, 1)
  exit = layoutPoint(80.75, 129.7)
  altarCrystals.forEach((entity, index) => {
    const column = index % 5
    const row = Math.floor(index / 5)
    Transform.getMutable(entity).position = Vector3.create(
      altar.x + (column - 2) * 0.42,
      altar.y + 1.25,
      altar.z + (row - 2) * 0.42
    )
  })
  if (status) Transform.getMutable(status).position = Vector3.create(altar.x, altar.y + 2.8, altar.z)
  for (const fog of fogSheets) Transform.getMutable(fog.entity).position = layoutPoint(fog.x, fog.z, fog.y)
  for (const prop of scatteredDecor) Transform.getMutable(prop.entity).position = layoutPoint(prop.x, prop.z)
  return true
}
function buildChapelFog(): void {
  // Soft, non-colliding planes make depth haze without tinting the HUD.
  const regions = [
    { minX: 40, maxX: 108, minZ: 102, maxZ: 126, count: 20, outside: false }, // front compound and gate
    { minX: 40, maxX: 59, minZ: 85, maxZ: 103, count: 8, outside: false }, // cemetery
    { minX: 62, maxX: 99, minZ: 65, maxZ: 102, count: 20, outside: false }, // chapel nave
    { minX: 41, maxX: 60, minZ: 57, maxZ: 78, count: 5, outside: false }, // coffin room
    { minX: 60, maxX: 100, minZ: 55, maxZ: 65, count: 5, outside: false }, // rear tunnel
    { minX: 8, maxX: 30, minZ: 24, maxZ: 137, count: 18, outside: true }, // beyond west fence
    { minX: 119, maxX: 139, minZ: 24, maxZ: 137, count: 18, outside: true }, // beyond east fence
    { minX: 30, maxX: 119, minZ: 7, maxZ: 46, count: 18, outside: true }, // behind chapel
    { minX: 30, maxX: 119, minZ: 131, maxZ: 141, count: 18, outside: true } // beyond front gate
  ]
  let seed = 0x6742b9
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (const region of regions) for (let i = 0; i < region.count; i++) {
    const x = region.minX + random() * (region.maxX - region.minX)
    const z = region.minZ + random() * (region.maxZ - region.minZ)
    const y = region.outside ? 5.2 + random() * 1.3 : 3 + random() * 0.9
    const entity = engine.addEntity()
    Transform.create(entity, { position: layoutPoint(x, z, y), scale: region.outside
      ? Vector3.create(13 + random() * 6, 10 + random() * 3, 1)
      : Vector3.create(7 + random() * 4, 6 + random() * 2, 1) })
    MeshRenderer.setPlane(entity)
    Billboard.create(entity, { billboardMode: BillboardMode.BM_Y })
    Material.setPbrMaterial(entity, {
      texture: Material.Texture.Common({ src: FOG_TEXTURE }),
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
      albedoColor: region.outside
        ? Color4.create(0.48, 0.43, 0.42, 1)
        : Color4.create(0.72, 0.65, 0.59, 0.45),
      castShadows: false, roughness: 1, metallic: 0
    })
    fogSheets.push({ entity, x, z, y,
      drift: region.outside ? 0.8 + random() * 1.4 : 0.15 + random() * 0.25,
      speed: region.outside ? 0.24 + random() * 0.18 : 0.13 + random() * 0.08,
      bob: region.outside ? 0.5 : 0.18, phase: random() * Math.PI * 2 })
  }
  let elapsed = 0
  engine.addSystem((dt) => {
    elapsed += dt
    for (const fog of fogSheets) {
      const transform = Transform.getMutable(fog.entity)
      const center = layoutPoint(fog.x, fog.z, fog.y)
      transform.position.x = center.x + Math.sin(elapsed * fog.speed + fog.phase) * fog.drift
      transform.position.z = center.z + Math.cos(elapsed * fog.speed * 0.7 + fog.phase) * fog.drift
      transform.position.y = center.y + Math.sin(elapsed * fog.speed * 0.5 + fog.phase) * fog.bob
    }
  })
}
function scatterChapelRemains(): void {
  // Locations follow the church layout, leaving the entrance and main aisle clear.
  const placements: { kind: keyof typeof DECOR_MODELS; x: number; z: number; scale: number; yaw: number }[] = [
    { kind: 'bones', x: 46, z: 107, scale: 0.7, yaw: 35 },
    { kind: 'searching', x: 101, z: 120, scale: 1, yaw: 220 },
    { kind: 'bones', x: 96, z: 106, scale: 0.7, yaw: 145 },
    { kind: 'searching', x: 52, z: 118, scale: 1, yaw: 65 },
    { kind: 'skullA', x: 43, z: 116, scale: 1, yaw: 0 },
    { kind: 'skullB', x: 61, z: 120, scale: 1, yaw: 40 },
    { kind: 'skullA', x: 94, z: 117, scale: 1, yaw: 90 },
    { kind: 'skullB', x: 105, z: 110, scale: 1, yaw: 155 },
    { kind: 'skullA', x: 57, z: 106, scale: 1, yaw: 210 },
    { kind: 'skullB', x: 98, z: 103, scale: 1, yaw: 300 },
    { kind: 'bones', x: 42.5, z: 91, scale: 0.7, yaw: 75 },
    { kind: 'searching', x: 56, z: 98, scale: 1, yaw: 265 },
    { kind: 'bones', x: 43, z: 100, scale: 0.7, yaw: 170 },
    { kind: 'skullA', x: 56.5, z: 88.5, scale: 1, yaw: 30 },
    { kind: 'skullB', x: 42.5, z: 96, scale: 1, yaw: 120 },
    { kind: 'skullA', x: 55, z: 101, scale: 1, yaw: 230 },
    { kind: 'bones', x: 65, z: 79, scale: 0.7, yaw: 40 },
    { kind: 'searching', x: 96, z: 89, scale: 1, yaw: 235 },
    { kind: 'bones', x: 96, z: 70, scale: 0.7, yaw: 115 },
    { kind: 'searching', x: 65, z: 95, scale: 1, yaw: 280 },
    { kind: 'skullA', x: 65, z: 71, scale: 1, yaw: 15 },
    { kind: 'skullB', x: 96, z: 78, scale: 1, yaw: 110 },
    { kind: 'skullA', x: 65, z: 87, scale: 1, yaw: 195 },
    { kind: 'skullB', x: 96, z: 98, scale: 1, yaw: 275 },
    { kind: 'skullA', x: 75, z: 69, scale: 1, yaw: 55 },
    { kind: 'skullB', x: 87, z: 69, scale: 1, yaw: 315 },
    { kind: 'bones', x: 44, z: 67, scale: 0.7, yaw: 50 },
    { kind: 'searching', x: 56, z: 75, scale: 1, yaw: 200 },
    { kind: 'skullA', x: 56, z: 61, scale: 1, yaw: 0 },
    { kind: 'skullB', x: 44, z: 74, scale: 1, yaw: 160 },
    { kind: 'bones', x: 68, z: 59, scale: 0.7, yaw: 85 },
    { kind: 'searching', x: 94, z: 59, scale: 1, yaw: 255 },
    { kind: 'skullA', x: 78, z: 59, scale: 1, yaw: 125 },
    { kind: 'skullB', x: 87, z: 59, scale: 1, yaw: 305 }
  ]
  for (const prop of placements) {
    const entity = engine.addEntity()
    Transform.create(entity, { position: layoutPoint(prop.x, prop.z),
      rotation: Quaternion.fromEulerDegrees(0, prop.yaw, 0), scale: Vector3.create(prop.scale, prop.scale, prop.scale) })
    GltfContainer.create(entity, { src: DECOR_MODELS[prop.kind], visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 3 })
    scatteredDecor.push({ entity, x: prop.x, z: prop.z })
  }
}
function enableNormalMovement(): void {
  InputModifier.deleteFrom(engine.PlayerEntity)
}
function beginCountdown(): void {
  countdownRemaining = START_COUNTDOWN_SECONDS
  setCountdownSeconds(countdownRemaining)
  InputModifier.createOrReplace(engine.PlayerEntity, { mode: InputModifier.Mode.Standard({ disableAll: true }) })
  setChapelScreen('countdown')
}

function playerPosition(): Vector3 | null { return Transform.getOrNull(engine.PlayerEntity)?.position ?? null }
function near(point: Vector3, radius: number): boolean {
  const p = playerPosition()
  return !!p && (p.x-point.x)**2 + (p.z-point.z)**2 <= radius**2
}
function inArea(area: Area, point: Vector3): boolean {
  const { x, z } = referencePosition(point)
  if (area === 'cemetery') return x >= 40 && x <= 59 && z >= 86.5 && z <= 103
  if (area === 'compoundLeft') return x >= 40 && x <= 80 && z >= 103.5 && z <= 125
  if (area === 'compoundRight') return x >= 80 && x <= 109 && z >= 103.5 && z <= 125
  if (area === 'churchLeft') return x >= 61 && x <= 80.5 && z >= 65 && z <= 102
  if (area === 'churchRight') return x >= 81 && x <= 100.5 && z >= 65 && z <= 102
  return (x >= 39.5 && x <= 61 && z >= 56.5 && z <= 79)
    || (x >= 59.5 && x <= 100 && z >= 56.5 && z <= 64.5)
}
function moveWatcher(watcher: Watcher, target: Vector3, dt: number): number {
  const current = getWorldPosition(engine, watcher.entity)
  let goal = target
  if (watcher.area === 'roomTunnel') {
    const watcherInRoom = referencePosition(current).x < 60
    const targetInRoom = referencePosition(target).x < 60
    if (watcherInRoom !== targetInRoom) goal = layoutPoint(60, 62)
  }
  const dx = goal.x-current.x, dz = goal.z-current.z
  const distance = Math.hypot(dx,dz)
  if (distance < 0.01) return Math.hypot(target.x-current.x,target.z-current.z)
  const step = Math.min(distance, WATCHER_SPEED * dt)
  const next = Vector3.create(current.x+dx/distance*step, current.y, current.z+dz/distance*step)
  if (!inArea(watcher.area,next)) return Math.hypot(target.x-current.x,target.z-current.z)
  const transform = Transform.getMutable(watcher.entity)
  const parentScale = transform.parent ? (Transform.getOrNull(transform.parent)?.scale ?? Vector3.One()) : Vector3.One()
  transform.position = Vector3.create(
    transform.position.x + (next.x-current.x)/parentScale.x,
    transform.position.y,
    transform.position.z + (next.z-current.z)/parentScale.z
  )
  return Math.hypot(target.x-next.x,target.z-next.z)
}
function updateWatcherSounds(): void {
  const mayMove = getChapelHudState().screen === 'playing' && lightRemaining <= 0 && catchCooldown <= 0 && !escaped
  for (const watcher of watchers) {
    const position = getWorldPosition(engine, watcher.entity)
    const moved = Math.hypot(position.x - watcher.lastWorldPosition.x,
      position.z - watcher.lastWorldPosition.z) > 0.003
    if (mayMove && moved && !watcher.soundActive) {
      AudioSource.playSound(watcher.entity, ANGEL_SCRAPE_AUDIO, true)
      watcher.soundActive = true
    } else if ((!mayMove || !moved) && watcher.soundActive) {
      AudioSource.stopSound(watcher.entity, true)
      watcher.soundActive = false
    }
    watcher.lastWorldPosition = Vector3.clone(position)
  }
}
function moveGhost(ghost: Ghost, player: Vector3, dt: number): number {
  const current = getWorldPosition(engine, ghost.entity)
  const playerDistance = Math.hypot(player.x - current.x, player.z - current.z)
  if (ghost.chasing && playerDistance > GHOST_LOSE_RADIUS) ghost.chasing = false
  else if (!ghost.chasing && playerDistance < GHOST_NOTICE_RADIUS) ghost.chasing = true
  const target = ghost.chasing ? player : ghost.worldHome
  const dx = target.x - current.x, dz = target.z - current.z
  const distance = Math.hypot(dx, dz)
  const step = Math.min(distance, (ghost.chasing ? GHOST_SPEED : GHOST_SPEED * 0.65) * dt)
  const transform = Transform.getMutable(ghost.entity)
  const parentScale = transform.parent ? (Transform.getOrNull(transform.parent)?.scale ?? Vector3.One()) : Vector3.One()
  if (distance > 0.01) {
    transform.position.x += dx / distance * step / parentScale.x
    transform.position.z += dz / distance * step / parentScale.z
  }
  const desiredY = ghost.chasing ? player.y + 2.1 : ghost.worldHome.y
  transform.position.y += (desiredY - current.y) * Math.min(1, dt * 0.8) / parentScale.y
  return Math.max(0, playerDistance - step)
}
function updateGhostWhispers(dt: number): void {
  const player = getChapelHudState().screen === 'playing' && !escaped ? playerPosition() : null
  for (const ghost of ghosts) {
    const position = getWorldPosition(engine, ghost.entity)
    const inRange = !!player && Math.hypot(player.x - position.x, player.z - position.z) <= GHOST_NOTICE_RADIUS
    if (!inRange) {
      if (ghost.whisperActive) AudioSource.stopSound(ghost.entity, true)
      ghost.whisperActive = false
      ghost.whisperTimer = 0
      continue
    }
    ghost.whisperTimer -= dt
    if (ghost.whisperTimer <= 0) {
      AudioSource.playSound(ghost.entity, GHOST_WHISPER, true)
      ghost.whisperActive = true
      ghost.whisperTimer = GHOST_WHISPER_CYCLE
    }
  }
}
function addParticleMote(kind: ParticleMote['kind'], index: number, phase: number, parent?: Entity): void {
  const entity = engine.addEntity()
  const size = kind === 'ghost' ? 0.07 : kind === 'igniter' ? 0.055 : 0.06
  Transform.create(entity, { position: Vector3.Zero(), scale: Vector3.create(size, size, size), ...(parent === undefined ? {} : { parent }) })
  MeshRenderer.setSphere(entity)
  const color = kind === 'ghost' ? Color4.create(0.55, 0.72, 1, 0.85)
    : kind === 'igniter' ? Color4.create(1, 0.48, 0.16, 0.9)
      : Color4.create(0.9, 0.1, 0.16, 0.85)
  Material.setPbrMaterial(entity, { albedoColor: color, emissiveColor: color,
    emissiveIntensity: kind === 'ghost' ? 5 : 7, roughness: 0.2, metallic: 0 })
  particleMotes.push({ entity, kind, phase, index })
}
function buildChapelParticles(): void {
  ghosts.forEach((ghost, index) => {
    for (let mote = 0; mote < 4; mote++) addParticleMote('ghost', index, (index * 4 + mote) * 2.4, ghost.entity)
  })
  igniters.forEach((_, index) => {
    for (let mote = 0; mote < 2; mote++) addParticleMote('igniter', index, (index * 2 + mote) * 2.7)
  })
  for (let mote = 0; mote < 6; mote++) addParticleMote('altar', 0, mote * Math.PI / 3)
  let elapsed = 0
  engine.addSystem((dt) => {
    elapsed += dt
    for (const mote of particleMotes) {
      const phase = mote.phase + elapsed * (mote.kind === 'ghost' ? 0.9 : 1.4)
      const transform = Transform.getMutable(mote.entity)
      if (mote.kind === 'ghost') {
        transform.position = Vector3.create(Math.cos(phase) * 0.6, Math.sin(phase * 1.2) * 0.6,
          Math.sin(phase) * 0.6)
      } else if (mote.kind === 'igniter') {
        const point = igniterPoints[mote.index]
        if (point) transform.position = Vector3.create(point.x + Math.cos(phase) * 0.35,
          point.y + 0.65 + (phase % 2.5) * 0.35, point.z + Math.sin(phase) * 0.35)
      } else {
        transform.position = Vector3.create(altar.x + Math.cos(phase) * 0.75,
          altar.y + 1.3 + Math.sin(phase * 1.4) * 0.35, altar.z + Math.sin(phase) * 0.75)
      }
    }
  })
}
function startChapelAmbience(): void {
  // Separate sources let both layers loop together while respecting the player's
  // Decentraland sound settings.
  for (const [clip, volume] of [[CHANT_AUDIO, 0.68], [GHOST_AUDIO, 0.48]] as const) {
    const source = engine.addEntity()
    AudioSource.create(source, { audioClipUrl: clip, playing: true, loop: true, volume, global: true })
  }
}
function say(value: string): void {
  showChapelToast(value)
}
function model(src: string, x: number, y: number, z: number, size: number): Entity {
  const e = engine.addEntity()
  Transform.create(e, { position: Vector3.create(x,y,z), scale: Vector3.create(size,size,size) })
  GltfContainer.create(e, { src, visibleMeshesCollisionMask: 1, invisibleMeshesCollisionMask: 0 })
  return e
}
function enableArchitectureCollisions(): void {
  // Creator Hub imported these meshes with visibleMeshesCollisionMask = 0.
  for (const [entity, container] of engine.getEntitiesWith(GltfContainer)) {
    if (container.src.startsWith('assets/models/') && container.src !== WATCHER_MODEL) {
      GltfContainer.getMutable(entity).visibleMeshesCollisionMask = 3
    }
  }
}
function randomizeRunSpawns(seed: number): void {
  let randomState = seed >>> 0
  const random = () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0
    return randomState / 4294967296
  }
  let crystalIndex = 0
  for (const zone of spawnZones) {
    const spots = [...zone.spots]
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[spots[i], spots[j]] = [spots[j], spots[i]]
    }
    spots.forEach(([x, z], index) => {
      if (index < zone.crystals) {
        const crystal = crystals[crystalIndex++]
        const point = layoutPoint(x, z, 0.5)
        crystalPoints[crystalIndex - 1] = point
        crystalHitboxPoints[crystalIndex - 1] = layoutPoint(x, z, 1.25)
        Transform.getMutable(crystal.entity).position = point
        Transform.getMutable(crystal.hitbox).position = crystalHitboxPoints[crystalIndex - 1]
      }
    })
  }
  igniterPoints.length = 0
  igniterLocations.forEach(([x, z], index) => {
    const point = layoutPoint(x, z)
    Transform.getMutable(igniters[index]).position = point
    Transform.getMutable(igniterLights[index]).position = layoutPoint(x, z, 1.5)
    igniterPoints.push(point)
  })
  for (const entity of houseIgniters) igniterPoints.push(getWorldPosition(engine, entity))
}
function keepSharedLayoutInPlace(): void {
  crystals.forEach((crystal, index) => {
    const point = crystalPoints[index]
    if (!point) return
    const modelPosition = Transform.get(crystal.entity).position
    if (modelPosition.x !== point.x || modelPosition.y !== point.y || modelPosition.z !== point.z) {
      Transform.getMutable(crystal.entity).position = Vector3.clone(point)
    }
    const hitboxPosition = Transform.get(crystal.hitbox).position
    const hitboxPoint = crystalHitboxPoints[index]
    if (hitboxPosition.x !== hitboxPoint.x || hitboxPosition.y !== hitboxPoint.y || hitboxPosition.z !== hitboxPoint.z) {
      Transform.getMutable(crystal.hitbox).position = hitboxPoint
    }
  })
}
function syncSharedCrystals(): void {
  if (!crystals.every(crystal => SharedCrystal.has(crystal.entity))) return
  const previousSecured = secured
  secured = 0
  carriedCrystals.length = 0
  crystals.forEach((crystal, index) => {
    const state = SharedCrystal.get(crystal.entity)
    if (state.phase === 0) {
      if (!GltfContainer.has(crystal.entity)) GltfContainer.create(crystal.entity, { src: CRYSTAL, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
      if (!MeshCollider.has(crystal.hitbox)) MeshCollider.setBox(crystal.hitbox, ColliderLayer.CL_POINTER)
    } else {
      if (GltfContainer.has(crystal.entity)) GltfContainer.deleteFrom(crystal.entity)
      if (MeshCollider.has(crystal.hitbox)) MeshCollider.deleteFrom(crystal.hitbox)
    }
    if (state.phase === 1 && state.owner === currentPlayerId()) carriedCrystals.push(index)
    if (state.phase === 2) {
      secured++
      if (!GltfContainer.has(altarCrystals[index])) GltfContainer.create(altarCrystals[index], { src: CRYSTAL, visibleMeshesCollisionMask: 0, invisibleMeshesCollisionMask: 0 })
    } else if (GltfContainer.has(altarCrystals[index])) {
      GltfContainer.deleteFrom(altarCrystals[index])
    }
  })
  setCrystalProgress(secured, carriedCrystals.length)
  if (secured !== previousSecured) {
    TextShape.getMutable(status).text = secured === crystals.length
      ? 'ALL 25 CRYSTALS RETURNED. ENTRANCE GATE OPEN'
      : `${secured}/${CRYSTAL_COUNT} CRYSTALS SECURED. RETURN THEM TO THE ALTAR`
  }
}
function releaseCrystalsHeldBy(userId: string): void {
  if (!userId) return
  for (const crystal of crystals) {
    const state = SharedCrystal.getOrNull(crystal.entity)
    if (state?.phase === 1 && state.owner === userId) {
      SharedCrystal.createOrReplace(crystal.entity, { phase: 0, owner: '' })
    }
  }
  syncSharedCrystals()
}
function prepareSharedRun(): boolean {
  const layoutChanged = refreshLayoutAnchors()
  if (layoutChanged && crystals.length > 0) randomizeRunSpawns(currentSeed)
  if (!runStateReady()) return false
  if (!ChapelRun.has(runEntity)) {
    ChapelRun.create(runEntity, { seed: 1 + Math.floor(Math.random() * 2147483646) })
  }
  for (const crystal of crystals) {
    if (!SharedCrystal.has(crystal.entity)) SharedCrystal.create(crystal.entity, { phase: 0, owner: '' })
  }
  const seed = ChapelRun.get(runEntity).seed
  if (seed !== currentSeed) {
    randomizeRunSpawns(seed)
    currentSeed = seed
  }
  keepSharedLayoutInPlace()
  syncSharedCrystals()
  return true
}
function deposit(): void {
  if (!runStateReady() || getChapelHudState().screen !== 'playing' || carriedCrystals.length === 0) return
  const returned = carriedCrystals.length
  for (const index of carriedCrystals) SharedCrystal.createOrReplace(crystals[index].entity, { phase: 2, owner: '' })
  for (const index of carriedCrystals) void scoreRoom.send('crystalReturned', { crystalIndex: index })
  syncSharedCrystals()
  AudioSource.playSound(returnAudio, CRYSTAL_RETURN_AUDIO, true)
  say(secured === crystals.length ? 'ALL 25 CRYSTALS RETURNED. ENTRANCE GATE OPEN' : `${returned} CRYSTAL${returned === 1 ? '' : 'S'} RETURNED. ${secured}/${CRYSTAL_COUNT} SECURED`)
}
function caught(): void {
  if (catchCooldown > 0 || escaped || getChapelHudState().screen !== 'playing') return
  void scoreRoom.send('runEnd', { reason: 'caught' })
  releaseCrystalsHeldBy(currentPlayerId())
  captureElapsed = 0
  knockoutRemaining = 0
  pickupRemaining = 0
  clearChapelToast()
  InputModifier.createOrReplace(engine.PlayerEntity, { mode: InputModifier.Mode.Standard({ disableAll: true }) })
  AudioSource.playSound(jumpscareAudio, JUMPSCARE_AUDIO, true)
  setScareAlpha(1)
  setChapelScreen('jumpscare')
}
function resetCompletedRun(): void {
  if (!runStateReady() || !ChapelRun.has(runEntity) || secured !== CRYSTAL_COUNT) return
  const seed = 1 + Math.floor(Math.random() * 2147483646)
  ChapelRun.createOrReplace(runEntity, { seed })
  for (const crystal of crystals) SharedCrystal.createOrReplace(crystal.entity, { phase: 0, owner: '' })
  currentSeed = seed
  randomizeRunSpawns(seed)
  syncSharedCrystals()
  gateRise = 0
  if (gate) Transform.getMutable(gate).position.y = gateStartY
}
async function resumeFromCapture(): Promise<void> {
  const previousScreen = getChapelHudState().screen
  if (previousScreen !== 'gameOver' && previousScreen !== 'title' && previousScreen !== 'briefing' && !escaped) return
  setChapelScreen('transition')
  knockoutRemaining = 0
  try {
    await stopEmote({})
  } catch (error) {
    console.error('Could not stop the fallen avatar emote', error)
  }
  // The capture disables all input. Restore it before requesting a move, and
  // never strand the player in the menu if the client rejects that request.
  enableNormalMovement()
  try {
    const result = await movePlayerTo({ newRelativePosition: entrance })
    if (!result.success) console.error('Checkpoint movement was rejected by the client')
  } catch (error) {
    console.error('Checkpoint movement failed', error)
  } finally {
    releaseCrystalsHeldBy(currentPlayerId())
    resetCompletedRun()
    escaped = false
    setChapelEscaped(false)
    lightRemaining = MAX_LIGHT_SECONDS
    setCandleSeconds(lightRemaining)
    setInIgnitionZone(false)
    catchCooldown = 4
    clearChapelToast()
    for (const watcher of watchers) Transform.getMutable(watcher.entity).position = Vector3.clone(watcher.home)
    for (const ghost of ghosts) {
      Transform.getMutable(ghost.entity).position = Vector3.clone(ghost.home)
      ghost.chasing = false
    }
    beginCountdown()
  }
}
function buildCaretaker(): void {
  caretakerHouse = engine.getEntityOrNullByName('Caretaker house ')
  const caretaker = engine.getEntityOrNullByName('caretaker.glb')
  if (!caretaker) return
  const hitbox = engine.addEntity()
  Transform.create(hitbox, { parent: caretaker, position: Vector3.Zero(),
    scale: Vector3.create(0.55, 0.55, 0.55) })
  MeshCollider.setBox(hitbox, ColliderLayer.CL_POINTER)
  pointerEventsSystem.onPointerDown({ entity: hitbox,
    opts: { button: InputAction.IA_PRIMARY, hoverText: 'TALK TO THE CARETAKER', maxDistance: 5 } }, () => {
    if (getChapelHudState().screen === 'playing') showCaretakerDialogue()
  })
}

function insideCaretakerHouse(point: Vector3): boolean {
  if (!caretakerHouse) return false
  const center = getWorldPosition(engine, caretakerHouse)
  const houseScale = Transform.get(caretakerHouse).scale
  const rootScale = layoutRoot ? Transform.get(layoutRoot).scale : Vector3.One()
  return Math.abs(point.x - center.x) < houseScale.x * rootScale.x * 1.55 &&
    Math.abs(point.z - center.z) < houseScale.z * rootScale.z * 1.55 &&
    Math.abs(point.y - center.y) < houseScale.y * rootScale.y * 1.5
}

export async function main(): Promise<void> {
  if ((await isServerApi({})).isServer) {
    const { startScoreServer } = await import('./serverScores')
    await startScoreServer()
    return
  }
  setupChapelUi()
  const thirdPersonArea = engine.addEntity()
  Transform.create(thirdPersonArea, { position: Vector3.create(72, 20, 72) })
  CameraModeArea.create(thirdPersonArea, { area: Vector3.create(144, 100, 144), mode: CameraType.CT_THIRD_PERSON })
  scoreRoom.onMessage('scoreSnapshot', data => {
    try {
      const payload = JSON.parse(data.json)
      if (typeof payload.date === 'string' && Array.isArray(payload.entries)) {
        setLeaderboardData(payload.date, payload.entries, payload.best ?? null, payload.status ?? '')
      }
    } catch (error) { console.error('Invalid leaderboard snapshot', error) }
  })
  startChapelAmbience()
  jumpscareAudio = engine.addEntity()
  AudioSource.create(jumpscareAudio, { audioClipUrl: JUMPSCARE_AUDIO, playing: false,
    loop: false, volume: 0.6, global: true })
  pickupAudio = engine.addEntity()
  AudioSource.create(pickupAudio, { audioClipUrl: CRYSTAL_PICKUP_AUDIO, playing: false,
    loop: false, volume: 0.75, global: true })
  returnAudio = engine.addEntity()
  AudioSource.create(returnAudio, { audioClipUrl: CRYSTAL_RETURN_AUDIO, playing: false,
    loop: false, volume: 0.8, global: true })
  setCaptureActions({
    retry: () => { void resumeFromCapture() },
    checkpoint: () => { void resumeFromCapture() },
    menu: () => { if (getChapelHudState().screen === 'gameOver') setChapelScreen('briefing') },
    start: () => { void resumeFromCapture() }
  })
  enableArchitectureCollisions()
  layoutRoot = engine.getEntityOrNullByName('Resize')
  refreshLayoutAnchors()
  buildCaretaker()
  buildChapelFog()
  scatterChapelRemains()
  setCandleSeconds(lightRemaining)
  InputModifier.createOrReplace(engine.PlayerEntity, { mode: InputModifier.Mode.Standard({ disableAll: true }) })
  setChapelScreen('briefing')
  status = engine.addEntity()
  Transform.create(status, { position: Vector3.create(altar.x,2.8,altar.z) })
  TextShape.create(status, { text: 'FIND 25 RED CRYSTALS. RETURN THEM TO THE ALTAR', fontSize: 1.2, textColor: Color4.White(), outlineColor: Color4.Black(), outlineWidth: 0.15 })
  for (const [x, z, range] of [[80, 75, 17], [80, 91, 18], [80, 110, 20], [50, 96, 16], [48, 67, 13], [80, 59, 15]] as const) {
    const light = engine.addEntity()
    Transform.create(light, { position: layoutPoint(x, z, 3.8) })
    LightSource.create(light, { active: true, color: { r: 0.78, g: 0.36, b: 0.16 }, intensity: 950, range, shadow: false, type: LightSource.Type.Point({}) })
  }
  runEntity = engine.addEntity()
  syncEntity(runEntity, [ChapelRun.componentId], 100)
  const howToPlayText = engine.getEntityOrNullByName('How to play text')
  if (howToPlayText) TextShape.createOrReplace(howToPlayText, {
    text: 'HOW TO PLAY\nFIND 25 RED CRYSTALS\nCARRY ONE AT A TIME\nE: TAKE / RETURN\nSTAY NEAR IGNITERS\nKEEP YOUR LIGHT ALIVE\nESCAPE THROUGH THE GATE',
    font: Font.F_SERIF, fontSrc: bodyFont, fontSize: 0.35, fontAutoSize: true,
    textWrapping: false, width: 3.1, height: 2.5,
    textColor: Color4.create(0.94, 0.84, 0.68, 1), outlineColor: Color4.Black(), outlineWidth: 0.1
  })

  // Keep the Creator Hub samples for editing, but replace them with runtime objects.
  // Their imported transforms are outside the chapel's gameplay coordinates.
  const original = engine.getEntityOrNullByName('Red Crystal')
  if (original) GltfContainer.deleteFrom(original)
  for (let index = 0; index < CRYSTAL_COUNT; index++) {
    const entity = model(CRYSTAL, 0, 0.5, 0, 0.22)
    const altarCrystal = engine.addEntity()
    Transform.create(altarCrystal, { position: Vector3.Zero(), scale: Vector3.create(0.22, 0.22, 0.22) })
    altarCrystals.push(altarCrystal)
    const hitbox = engine.addEntity()
    Transform.create(hitbox, { position: Vector3.create(0, 1.25, 0),
      scale: Vector3.create(2, 2, 2) })
    MeshCollider.setBox(hitbox, ColliderLayer.CL_POINTER)
    crystals.push({entity, hitbox})
    GltfContainer.getMutable(entity).visibleMeshesCollisionMask = 0
    syncEntity(entity, [SharedCrystal.componentId], 200 + index)
    pointerEventsSystem.onPointerDown({ entity: hitbox, opts: { button: InputAction.IA_PRIMARY, hoverText: 'TAKE RED CRYSTAL', maxDistance: 5 } }, () => {
      if (escaped) return
      if (getChapelHudState().screen !== 'playing') { showChapelToast('WAIT FOR THE COUNTDOWN'); return }
      if (!runStateReady()) { showChapelToast('CONNECTING TO THE CHAPEL'); return }
      if (SharedCrystal.getOrNull(entity)?.phase !== 0) return
      if (pickupRemaining > 0) { showChapelToast('FINISHING PICKUP'); return }
      if (carriedCrystals.length >= CRYSTAL_CARRY_LIMIT) { say('CARRY LIMIT REACHED. RETURN TO ALTAR'); return }
      SharedCrystal.createOrReplace(entity, { phase: 1, owner: currentPlayerId() })
      syncSharedCrystals()
      AudioSource.playSound(pickupAudio, CRYSTAL_PICKUP_AUDIO, true)
      pickupRemaining = PICKUP_DURATION
      InputModifier.createOrReplace(engine.PlayerEntity, { mode: InputModifier.Mode.Standard({ disableWalk: true, disableJog: true, disableRun: true, disableJump: true }) })
      void triggerSceneEmote({ src: PICKUP_EMOTE, loop: false })
      say(`CRYSTAL FOUND. CARRY ${carriedCrystals.length}/${CRYSTAL_CARRY_LIMIT}`)
    })
  }
  altarCrystals.forEach((entity, index) => {
    const column = index % 5
    const row = Math.floor(index / 5)
    Transform.getMutable(entity).position = Vector3.create(
      altar.x + (column - 2) * 0.42,
      altar.y + 1.25,
      altar.z + (row - 2) * 0.42
    )
  })
  for (const name of ['igniter_2', 'igniter_3', 'igniter_4', 'igniter_5']) {
    const entity = engine.getEntityOrNullByName(name)
    if (!entity) continue
    houseIgniters.push(entity)
    const light = engine.addEntity()
    Transform.create(light, { parent: entity, position: Vector3.create(0, 1.5, 0) })
    LightSource.create(light, { active: true, color: { r: 1, g: 0.49, b: 0.18 },
      intensity: 700, range: 6, shadow: false, type: LightSource.Type.Point({}) })
  }
  const placedIgniters = [...engine.getEntitiesWith(GltfContainer)]
    .filter(([entity, container]) => container.src === IGNITER && !houseIgniters.includes(entity))
    .map(([entity]) => entity)
  for (const entity of placedIgniters) GltfContainer.deleteFrom(entity)
  for (let index = 0; index < igniterLocations.length; index++) {
    igniters.push(model(IGNITER, 0, 0, 0, 0.3))
    const light = engine.addEntity()
    Transform.create(light, { position: Vector3.Zero() })
    LightSource.create(light, { active: true, color: { r: 1, g: 0.49, b: 0.18 }, intensity: 700, range: 6, shadow: false, type: LightSource.Type.Point({}) })
    igniterLights.push(light)
  }
  randomizeRunSpawns(currentSeed)
  onLeaveScene(userId => {
    if (runStateReady()) releaseCrystalsHeldBy(userId)
  })
  const altarModel = engine.getEntityOrNullByName('model_(10).glb')
  if (altarModel) {
    GltfContainer.getMutable(altarModel).visibleMeshesCollisionMask = 3
    pointerEventsSystem.onPointerDown({ entity: altarModel, opts: { button: InputAction.IA_PRIMARY, hoverText: 'RETURN CARRIED CRYSTAL', maxDistance: 5 } }, deposit)
  }

  const sceneCandle = engine.getEntityOrNullByName('candle')
  if (sceneCandle) GltfContainer.deleteFrom(sceneCandle)
  for (const { name, area } of watcherNames) {
    const entity = engine.getEntityOrNullByName(name)
    if (!entity) continue
    const position = Transform.get(entity).position
    const worldHome = getWorldPosition(engine, entity)
    watchers.push({ entity, area, home: Vector3.create(position.x,position.y,position.z),
      worldHome, lastWorldPosition: Vector3.clone(worldHome), soundActive: false })
    const container = GltfContainer.getMutable(entity)
    container.visibleMeshesCollisionMask = 0
    container.invisibleMeshesCollisionMask = 0
    AudioSource.createOrReplace(entity, { audioClipUrl: ANGEL_SCRAPE_AUDIO, playing: false,
      loop: true, volume: 1, global: false })
  }
  for (const [entity, container] of engine.getEntitiesWith(GltfContainer)) {
    if (container.src !== GHOST_MODEL) continue
    const position = Transform.get(entity).position
    ghosts.push({ entity, home: Vector3.clone(position), worldHome: getWorldPosition(engine, entity), chasing: false,
      whisperTimer: 0, whisperActive: false })
    const ghostContainer = GltfContainer.getMutable(entity)
    ghostContainer.visibleMeshesCollisionMask = 0
    ghostContainer.invisibleMeshesCollisionMask = 0
    AudioSource.createOrReplace(entity, { audioClipUrl: GHOST_WHISPER, playing: false,
      loop: false, volume: 0.35, global: false })
  }
  buildChapelParticles()
  gate = engine.getEntityOrNullByName('EscapeGate')
  if (gate) gateStartY = Transform.get(gate).position.y
  engine.addSystem((dt) => {
    tickChapelHud(dt)
    if (!isStateSyncronized() && !localOnlyRun) {
      syncWaitSeconds += dt
      const connected = RealmInfo.getOrNull(engine.RootEntity)?.isConnectedSceneRoom === true
      if (syncWaitSeconds >= (connected ? 18 : 8)) {
        fallbackPlayerId = myProfile.userId || 'local-player'
        localOnlyRun = true
        console.log('Shared room unavailable; continuing this run locally')
      }
    }
    const sharedReady = prepareSharedRun()
    if (getChapelHudState().screen === 'countdown') {
      countdownRemaining = Math.max(0, countdownRemaining - dt)
      setCountdownSeconds(countdownRemaining)
      if (countdownRemaining === 0) {
        enableNormalMovement()
        setChapelScreen('playing')
        void scoreRoom.send('runStart', { name: getPlayer()?.name || 'PLAYER' })
        if (!sharedReady) showChapelToast('CONNECTING TO THE CHAPEL')
      }
      return
    }
    if (getChapelHudState().screen === 'jumpscare') {
      captureElapsed += dt
      if (captureElapsed <= SCARE_HOLD_SECONDS) setScareAlpha(1)
      else setScareAlpha(1 - (captureElapsed - SCARE_HOLD_SECONDS) / SCARE_FADE_SECONDS)
      if (captureElapsed >= SCARE_HOLD_SECONDS + SCARE_FADE_SECONDS) {
        knockoutRemaining = KNOCKOUT_SECONDS
        void triggerEmote({ predefinedEmote: 'knockOut' })
        setChapelScreen('gameOver')
      }
      return
    }
    if (knockoutRemaining > 0 && (getChapelHudState().screen === 'gameOver' || getChapelHudState().screen === 'briefing')) {
      knockoutRemaining = Math.max(0, knockoutRemaining - dt)
      if (knockoutRemaining === 0) void triggerEmote({ predefinedEmote: 'sittingGround2' })
    }
    if (getChapelHudState().screen !== 'playing') return
    const boardOpen = getChapelHudState().leaderboardVisible
    leaderboardRefreshRemaining = boardOpen ? leaderboardRefreshRemaining - dt : 0
    if (boardOpen && (!wasLeaderboardOpen || leaderboardRefreshRemaining <= 0)) {
      leaderboardRefreshRemaining = 15
      void scoreRoom.send('scoreRequest', { request: 1 })
    }
    wasLeaderboardOpen = boardOpen
    if (!sharedReady) return
    if (pickupRemaining > 0) {
      pickupRemaining = Math.max(0, pickupRemaining - dt)
      if (pickupRemaining === 0) enableNormalMovement()
    }
    if (escaped) return
    const p = playerPosition()
    const inSafeHouse = !!p && insideCaretakerHouse(p)
    const inIgnitionZone = !!p && (inSafeHouse || igniterPoints.some(point => (p.x-point.x)**2 + (p.z-point.z)**2 <= IGNITION_RADIUS**2))
    setInIgnitionZone(inIgnitionZone)
    lightRemaining = inIgnitionZone
      ? Math.min(MAX_LIGHT_SECONDS, lightRemaining + LIGHT_REFILL_PER_SECOND * dt)
      : Math.max(0, lightRemaining - dt)
    setCandleSeconds(lightRemaining)
    catchCooldown = Math.max(0,catchCooldown-dt)
    if (carriedCrystals.length > 0 && near(altarReturn,2.8)) deposit()
    if (secured === CRYSTAL_COUNT && gate && gateRise < 15) {
      gateRise = Math.min(15,gateRise+dt*5)
      const t = Transform.getMutable(gate)
      t.position = Vector3.create(t.position.x,gateStartY+gateRise,t.position.z)
    }
    if (secured === CRYSTAL_COUNT && near(exit,2.5)) {
      escaped = true
      void scoreRoom.send('runEnd', { reason: 'escaped' })
      setChapelEscaped(); say('YOU ESCAPED THE CHAPEL'); return
    }
    if (p) for (const ghost of ghosts) {
      if (inSafeHouse) { ghost.chasing = false; continue }
      const distance = moveGhost(ghost, p, dt)
      const ghostHeight = getWorldPosition(engine, ghost.entity).y
      if (ghost.chasing && lightRemaining <= 0 && catchCooldown <= 0 &&
        distance < GHOST_CATCH_RADIUS && Math.abs(ghostHeight - (p.y + 1.5)) < 1.8) {
        caught()
        return
      }
    }
    if (!p || inSafeHouse || lightRemaining > 0 || catchCooldown > 0) return
    for (const watcher of watchers) {
      const target = inArea(watcher.area,p) ? p : watcher.worldHome
      const distance = moveWatcher(watcher,target,dt)
      if (inArea(watcher.area,p) && distance < 2.2) { caught(); break }
    }
  })
  engine.addSystem(updateGhostWhispers)
  engine.addSystem(updateWatcherSounds)
}
