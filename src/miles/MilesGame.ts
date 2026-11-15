import { engine, InputAction, LightSource, Material, MeshCollider, MeshRenderer, TextShape, Transform, pointerEventsSystem, type Entity } from '@dcl/sdk/ecs'
import { Color4, Quaternion, Vector3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { setMilesHud, setMilesInteraction, setupMilesUi } from './MilesUi'

type Point = { name: string; subtitle: string; position: Vector3 }
type OrderPhase = 'idle' | 'to-pickup' | 'to-customer'
type TrafficVehicle = { entity: Entity; axis: 'x' | 'z'; minimum: number; maximum: number; speed: number; direction: number }

const TERMINAL = Vector3.create(72, 0.22, 84)
const PICKUPS: Point[] = [
  { name: 'SUNSET CAFE', subtitle: 'Collect the hot meal', position: Vector3.create(106, 0.2, 70) },
  { name: 'MARKET KITCHEN', subtitle: 'Collect the hot meal', position: Vector3.create(63, 0.2, 72) },
  { name: 'FRUIT & FIRE', subtitle: 'Collect the hot meal', position: Vector3.create(81, 0.2, 72) },
  { name: 'NIGHT SCOOPS', subtitle: 'Collect the hot meal', position: Vector3.create(72, 0.2, 61) },
  { name: 'CORNER GRILL', subtitle: 'Collect the hot meal', position: Vector3.create(96, 0.2, 92) }
]
const CUSTOMERS: Point[] = [
  { name: 'THEATER APARTMENTS', subtitle: 'Leave meal at entrance', position: Vector3.create(42, 0.2, 45) },
  { name: 'PARK HOUSE', subtitle: 'Leave meal at entrance', position: Vector3.create(46, 0.2, 102) },
  { name: 'CLOCKTOWER FLATS', subtitle: 'Leave meal at entrance', position: Vector3.create(51, 0.2, 65) },
  { name: 'EAST MARKET HOME', subtitle: 'Leave meal at entrance', position: Vector3.create(102, 0.2, 104) },
  { name: 'RIVERSIDE BLOCK', subtitle: 'Leave meal at entrance', position: Vector3.create(134, 0.2, 45) },
  { name: 'WEST END HOME', subtitle: 'Leave meal at entrance', position: Vector3.create(10, 0.2, 98) }
]
const ORDER_SECONDS = 100
const INTERACTION_RADIUS = 4.2
const TERMINAL_RADIUS = 7.5

export class MilesGame {
  private mounted = false
  private phase: OrderPhase = 'idle'
  private pickup?: Point
  private customer?: Point
  private secondsLeft = 0
  private completed = 0
  private streak = 0
  private deliveryBag?: Entity
  private readonly traffic: TrafficVehicle[] = []
  private safePosition = Vector3.create(72, 0.35, 84)
  private safeSampleTimer = 0
  private crashCooldown = 0
  private marker?: Entity
  private markerText?: Entity
  private markerLight?: Entity
  private handoffEntities: Entity[] = []
  private notice?: string

  initialize(): void {
    setupMilesUi(() => this.startShift(), () => this.endShift())
    this.createTerminal()
    this.createCityNpcs()
    this.createTraffic()
    engine.addSystem((dt) => this.update(dt))
    this.publishHud()
  }

  private createTerminal(): void {
    const pad = engine.addEntity()
    Transform.create(pad, { position: TERMINAL, scale: Vector3.create(6, 0.22, 4) })
    MeshRenderer.setBox(pad)
    MeshCollider.setBox(pad)
    Material.setPbrMaterial(pad, { albedoColor: Color4.create(0.18, 0.12, 0.07, 1), emissiveColor: Color4.create(1, 0.4, 0.08, 1), emissiveIntensity: 0.45, metallic: 0.35, roughness: 0.52 })
    const sign = engine.addEntity()
    Transform.create(sign, { position: Vector3.create(72, 3.8, 86.5), rotation: Quaternion.fromEulerDegrees(0, 180, 0) })
    TextShape.create(sign, { text: 'MILES // DELIVERY TERMINAL\nPOINT HERE OR TAP START TO BEGIN A SHIFT', fontSize: 2.4, textColor: Color4.create(1, 0.87, 0.62, 1), outlineColor: Color4.create(0.08, 0.035, 0.01, 1), outlineWidth: 0.15 })
    pointerEventsSystem.onPointerDown({ entity: pad, opts: { button: InputAction.IA_PRIMARY, hoverText: 'START SHIFT', maxDistance: 10 } }, () => this.startShift())
  }

  private startShift(): void {
    if (this.mounted || !this.playerNear(TERMINAL, TERMINAL_RADIUS)) {
      this.notice = 'MOVE TO THE DELIVERY TERMINAL TO START'
      this.publishHud()
      return
    }
    this.mounted = true
    this.createDeliveryBag()
    this.notice = 'SHIFT STARTED // FOLLOW THE GOLD MARKER'
    this.assignOrder()
  }

  private endShift(): void {
    if (!this.mounted) return
    this.mounted = false
    this.phase = 'idle'
    this.secondsLeft = 0
    this.notice = 'SHIFT ENDED // RETURN WHEN YOU ARE READY'
    this.clearMarker()
    this.clearHandoff()
    if (this.deliveryBag) engine.removeEntityWithChildren(this.deliveryBag)
    this.deliveryBag = undefined
    this.publishHud()
  }

  private assignOrder(): void {
    const pickup = PICKUPS[Math.floor(Math.random() * PICKUPS.length)]
    let customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]
    while (Vector3.distanceSquared(pickup.position, customer.position) < 500) customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)]
    this.pickup = pickup
    this.customer = customer
    this.phase = 'to-pickup'
    this.secondsLeft = ORDER_SECONDS
    this.showMarker(pickup, '#ffb347')
    this.publishHud()
  }

  private update(dt: number): void {
    this.updateTraffic(dt)
    this.updateCarriedBag()
    if (!this.mounted) {
      setMilesInteraction(this.playerNear(TERMINAL, TERMINAL_RADIUS) ? 'READY AT DELIVERY TERMINAL' : 'GO TO THE DELIVERY TERMINAL TO BEGIN')
      return
    }
    this.secondsLeft = Math.max(0, this.secondsLeft - dt)
    this.updateSafety(dt)
    if (this.secondsLeft <= 0) {
      this.streak = 0
      this.notice = 'ORDER CANCELLED // TOO LATE'
      this.assignOrder()
      return
    }
    const target = this.phase === 'to-pickup' ? this.pickup : this.customer
    if (target && this.playerNear(target.position, INTERACTION_RADIUS)) {
      if (this.phase === 'to-pickup') {
        this.phase = 'to-customer'
        this.notice = 'MEAL SECURED // DELIVER IT HOT'
        this.showMarker(this.customer!, '#62d8ff')
        this.createCustomerHandoff(this.customer!)
      } else {
        this.completed += 1
        this.streak += 1
        this.notice = `DELIVERED! // ${this.streak} DELIVERY STREAK`
        this.assignOrder()
      }
    }
    setMilesInteraction(this.phase === 'to-pickup' ? 'RIDE TO THE GOLD PICKUP MARKER' : 'RIDE TO THE BLUE CUSTOMER MARKER')
    this.publishHud()
  }

  private updateCarriedBag(): void {
    if (!this.mounted) return
    const player = Transform.getOrNull(engine.PlayerEntity)
    if (!player) return
    const bagTransform = this.deliveryBag ? Transform.getMutableOrNull(this.deliveryBag) : undefined
    if (bagTransform) {
      // Carry the bag behind the avatar so it reads as a delivery backpack.
      const forwardX = 2 * (player.rotation.x * player.rotation.z + player.rotation.w * player.rotation.y)
      const forwardZ = 1 - 2 * (player.rotation.x * player.rotation.x + player.rotation.y * player.rotation.y)
      bagTransform.position.x = player.position.x - forwardX * 0.38
      bagTransform.position.y = player.position.y + 1.35
      bagTransform.position.z = player.position.z - forwardZ * 0.38
      bagTransform.rotation = player.rotation
    }
  }

  private createTraffic(): void {
    const createVehicle = (name: string, x: number, z: number, color: Color4, axis: 'x' | 'z', minimum: number, maximum: number, speed: number, direction: number): void => {
      const vehicle = engine.addEntity()
      Transform.create(vehicle, {
        position: Vector3.create(x, 0.78, z),
        scale: axis === 'x' ? Vector3.create(3.5, 1.1, 1.7) : Vector3.create(1.7, 1.1, 3.5),
        rotation: Quaternion.fromEulerDegrees(0, axis === 'x' ? 0 : 90, 0)
      })
      MeshRenderer.setBox(vehicle)
      Material.setPbrMaterial(vehicle, { albedoColor: color, metallic: 0.45, roughness: 0.27 })
      this.traffic.push({ entity: vehicle, axis, minimum, maximum, speed, direction })
    }
    createVehicle('Amber Market Taxi', 28, 24, Color4.create(0.95, 0.55, 0.12, 1), 'x', 12, 132, 8.5, 1)
    createVehicle('Blue Night Sedan', 112, 72, Color4.create(0.14, 0.44, 0.85, 1), 'x', 12, 132, 7.2, -1)
    createVehicle('Red Riverside Van', 120, 42, Color4.create(0.84, 0.18, 0.12, 1), 'z', 12, 132, 7.8, 1)
    createVehicle('Green Park Car', 72, 112, Color4.create(0.18, 0.62, 0.38, 1), 'z', 12, 132, 6.6, -1)
  }

  private updateTraffic(dt: number): void {
    for (const vehicle of this.traffic) {
      const transform = Transform.getMutableOrNull(vehicle.entity)
      if (!transform) continue
      if (vehicle.axis === 'x') {
        transform.position.x += vehicle.speed * vehicle.direction * dt
        if (transform.position.x > vehicle.maximum || transform.position.x < vehicle.minimum) vehicle.direction *= -1
      } else {
        transform.position.z += vehicle.speed * vehicle.direction * dt
        if (transform.position.z > vehicle.maximum || transform.position.z < vehicle.minimum) vehicle.direction *= -1
      }
      transform.rotation = Quaternion.fromEulerDegrees(0, vehicle.axis === 'x' ? (vehicle.direction > 0 ? 0 : 180) : (vehicle.direction > 0 ? 90 : -90), 0)
    }
  }

  private updateSafety(dt: number): void {
    const player = Transform.getOrNull(engine.PlayerEntity)
    if (!player) return
    this.crashCooldown = Math.max(0, this.crashCooldown - dt)
    this.safeSampleTimer += dt
    if (this.safeSampleTimer > 1.2 && this.crashCooldown === 0) {
      this.safePosition = Vector3.create(player.position.x, Math.max(0.35, player.position.y), player.position.z)
      this.safeSampleTimer = 0
    }
    if (this.crashCooldown > 0) return
    for (const vehicle of this.traffic) {
      const transform = Transform.getOrNull(vehicle.entity)
      if (!transform || Vector3.distanceSquared(player.position, transform.position) > 6.25) continue
      this.crashCooldown = 2
      this.streak = 0
      this.notice = 'CRASHED // BACK TO LAST SAFE POINT'
      void movePlayerTo({ newRelativePosition: this.safePosition, cameraTarget: Vector3.create(this.safePosition.x, this.safePosition.y + 1.4, this.safePosition.z - 4) })
      this.publishHud()
      break
    }
  }

  private createDeliveryBag(): void {
    if (this.deliveryBag) return
    const bag = engine.addEntity()
    Transform.create(bag, { position: Vector3.create(72, 1.35, 84), scale: Vector3.create(0.62, 0.72, 0.32) })
    MeshRenderer.setBox(bag)
    Material.setPbrMaterial(bag, {
      albedoColor: Color4.create(0.94, 0.33, 0.08, 1),
      emissiveColor: Color4.create(0.45, 0.06, 0.01, 1),
      emissiveIntensity: 0.5,
      metallic: 0.18,
      roughness: 0.38
    })
    this.deliveryBag = bag
  }

  private playerNear(point: Vector3, radius: number): boolean {
    const player = Transform.getOrNull(engine.PlayerEntity)
    return !!player && Vector3.distanceSquared(player.position, point) <= radius * radius
  }

  private showMarker(point: Point, hex: string): void {
    this.clearMarker()
    const marker = engine.addEntity()
    Transform.create(marker, { position: Vector3.create(point.position.x, 2.5, point.position.z), scale: Vector3.create(1.6, 5, 1.6) })
    MeshRenderer.setCylinder(marker)
    Material.setPbrMaterial(marker, { albedoColor: Color4.fromHexString(hex), emissiveColor: Color4.fromHexString(hex), emissiveIntensity: 3.5, metallic: 0.1, roughness: 0.25 })
    this.marker = marker
    const text = engine.addEntity()
    Transform.create(text, { position: Vector3.create(point.position.x, 5.8, point.position.z) })
    TextShape.create(text, { text: `${this.phase === 'to-pickup' ? 'PICK UP' : 'DELIVER'}\n${point.name}`, fontSize: 2.2, textColor: Color4.fromHexString(hex), outlineColor: Color4.Black(), outlineWidth: 0.15 })
    this.markerText = text
    const light = engine.addEntity()
    Transform.create(light, { position: Vector3.create(point.position.x, 2, point.position.z) })
    LightSource.create(light, { color: Color4.fromHexString(hex), intensity: 900, range: 9 })
    this.markerLight = light
  }

  private clearMarker(): void {
    for (const entity of [this.marker, this.markerText, this.markerLight]) if (entity) engine.removeEntityWithChildren(entity)
    this.marker = undefined
    this.markerText = undefined
    this.markerLight = undefined
  }

  private createCustomerHandoff(point: Point): void {
    this.clearHandoff()
    const createPart = (position: Vector3, scale: Vector3, color: Color4, shape: 'box' | 'sphere' | 'cylinder'): Entity => {
      const entity = engine.addEntity()
      Transform.create(entity, { position, scale })
      if (shape === 'box') MeshRenderer.setBox(entity)
      if (shape === 'sphere') MeshRenderer.setSphere(entity)
      if (shape === 'cylinder') MeshRenderer.setCylinder(entity)
      Material.setPbrMaterial(entity, { albedoColor: color, emissiveColor: color, emissiveIntensity: 0.18, metallic: 0.05, roughness: 0.65 })
      this.handoffEntities.push(entity)
      return entity
    }
    this.createNpc('Waiting customer', Vector3.create(point.position.x + 1.1, 0, point.position.z), Color4.create(0.15, 0.26, 0.46, 1), this.handoffEntities)
    createPart(Vector3.create(point.position.x - 1.1, 0.68, point.position.z), Vector3.create(0.82, 0.85, 0.72), Color4.create(0.3, 0.16, 0.07, 1), 'box')
    const porchLight = engine.addEntity()
    Transform.create(porchLight, { position: Vector3.create(point.position.x - 0.8, 3.1, point.position.z) })
    LightSource.create(porchLight, { color: Color4.create(1, 0.64, 0.26, 1), intensity: 520, range: 7 })
    this.handoffEntities.push(porchLight)
    const label = engine.addEntity()
    Transform.create(label, { position: Vector3.create(point.position.x, 3.5, point.position.z) })
    TextShape.create(label, { text: 'CUSTOMER WAITING', fontSize: 1.7, textColor: Color4.create(1, 0.84, 0.58, 1), outlineColor: Color4.Black(), outlineWidth: 0.12 })
    this.handoffEntities.push(label)
  }

  private clearHandoff(): void {
    this.handoffEntities.forEach((entity) => engine.removeEntityWithChildren(entity))
    this.handoffEntities = []
  }

  private createCityNpcs(): void {
    const pedestrians: Array<[string, Vector3, Color4]> = [
      ['Market cook', Vector3.create(61, 0, 75), Color4.create(0.82, 0.27, 0.12, 1)],
      ['Cafe guest', Vector3.create(103, 0, 74), Color4.create(0.2, 0.42, 0.72, 1)],
      ['Park walker', Vector3.create(48, 0, 106), Color4.create(0.23, 0.58, 0.34, 1)],
      ['Theater guest', Vector3.create(45, 0, 68), Color4.create(0.55, 0.26, 0.62, 1)],
      ['Market shopper', Vector3.create(85, 0, 80), Color4.create(0.9, 0.58, 0.13, 1)],
      ['Night walker', Vector3.create(96, 0, 96), Color4.create(0.18, 0.5, 0.52, 1)]
    ]
    pedestrians.forEach(([name, position, outfit]) => this.createNpc(name, position, outfit))
  }

  private createNpc(name: string, position: Vector3, outfit: Color4, collector?: Entity[]): void {
    const make = (offset: Vector3, scale: Vector3, color: Color4, shape: 'box' | 'sphere' | 'cylinder'): Entity => {
      const entity = engine.addEntity()
      Transform.create(entity, { position: Vector3.create(position.x + offset.x, position.y + offset.y, position.z + offset.z), scale })
      if (shape === 'box') MeshRenderer.setBox(entity)
      if (shape === 'sphere') MeshRenderer.setSphere(entity)
      if (shape === 'cylinder') MeshRenderer.setCylinder(entity)
      Material.setPbrMaterial(entity, { albedoColor: color, roughness: 0.68, metallic: 0.03 })
      collector?.push(entity)
      return entity
    }
    make(Vector3.create(0, 1.1, 0), Vector3.create(0.5, 1.55, 0.4), outfit, 'cylinder')
    make(Vector3.create(0, 2.22, 0), Vector3.create(0.5, 0.5, 0.5), Color4.create(0.86, 0.61, 0.42, 1), 'sphere')
    const label = engine.addEntity()
    Transform.create(label, { position: Vector3.create(position.x, position.y + 3.1, position.z) })
    TextShape.create(label, { text: name.toUpperCase(), fontSize: 1.05, textColor: Color4.create(1, 0.88, 0.69, 1), outlineColor: Color4.Black(), outlineWidth: 0.08 })
    collector?.push(label)
  }

  private publishHud(): void {
    const target = this.phase === 'to-pickup' ? this.pickup : this.customer
    setMilesHud({ mounted: this.mounted, phase: this.phase, target: target?.name ?? 'RIDER TERMINAL', instruction: target?.subtitle ?? 'Start a shift to receive your first order', seconds: Math.ceil(this.secondsLeft), deliveries: this.completed, streak: this.streak, notice: this.notice ?? '' })
  }
}
