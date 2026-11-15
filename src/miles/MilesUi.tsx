import ReactEcs, { Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

type MilesHud = {
  mounted: boolean
  phase: 'idle' | 'to-pickup' | 'to-customer'
  target: string
  instruction: string
  seconds: number
  deliveries: number
  streak: number
  notice: string
}

const ink = Color4.create(0.08, 0.055, 0.045, 0.94)
const cream = Color4.create(1, 0.95, 0.84, 1)
const muted = Color4.create(0.82, 0.75, 0.65, 1)
const coral = Color4.create(1, 0.37, 0.22, 1)
const gold = Color4.create(1, 0.71, 0.24, 1)

const state: MilesHud & { interaction: string } = {
  mounted: false,
  phase: 'idle',
  target: 'DELIVERY TERMINAL',
  instruction: 'Start a shift to receive your first meal',
  seconds: 0,
  deliveries: 0,
  streak: 0,
  notice: '',
  interaction: 'GO TO THE DELIVERY TERMINAL TO BEGIN'
}
let startShift: () => void = () => undefined
let endShift: () => void = () => undefined

export function setupMilesUi(onStartShift: () => void, onEndShift: () => void): void {
  startShift = onStartShift
  endShift = onEndShift
  ReactEcsRenderer.setUiRenderer(MilesHudView, { virtualWidth: 1920, virtualHeight: 1080 })
}

export function setMilesHud(next: MilesHud): void { Object.assign(state, next) }
export function setMilesInteraction(value: string): void { state.interaction = value }

const time = (): string => `${Math.floor(state.seconds / 60)}:${String(state.seconds % 60).padStart(2, '0')}`
const taskLabel = (): string => state.phase === 'to-pickup' ? 'PICK UP' : state.phase === 'to-customer' ? 'DELIVER TO' : 'READY TO WORK'

const Card = (props: { children?: ReactEcs.JSX.Element | ReactEcs.JSX.Element[] }) => (
  <UiEntity uiTransform={{ width: '100%', height: '100%', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Color4.create(1, 0.76, 0.42, 0.32), flexDirection: 'column', justifyContent: 'center' }} uiBackground={{ color: ink }}>
    {props.children}
  </UiEntity>
)

const MilesHudView = () => (
  <UiEntity uiTransform={{ width: '100%', height: '100%' }}>
    <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 26, left: 26 }, width: 230, height: 92 }}>
      <Card>
        <Label value="MILES" fontSize={34} color={cream} uiTransform={{ height: 40 }} />
        <Label value={state.mounted ? 'ON DELIVERY' : 'EVENING DELIVERY'} fontSize={15} color={gold} />
      </Card>
    </UiEntity>

    <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 26, right: 26 }, width: 244, height: 92 }}>
      <Card>
        <UiEntity uiTransform={{ width: '100%', height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <UiEntity uiTransform={{ width: '48%', flexDirection: 'column' }}>
            <Label value="DELIVERED" fontSize={12} color={muted} />
            <Label value={String(state.deliveries)} fontSize={31} color={cream} />
          </UiEntity>
          <UiEntity uiTransform={{ width: 1, height: 46 }} uiBackground={{ color: Color4.create(1, 0.8, 0.55, 0.25) }} />
          <UiEntity uiTransform={{ width: '40%', flexDirection: 'column' }}>
            <Label value="STREAK" fontSize={12} color={muted} />
            <Label value={`× ${state.streak}`} fontSize={27} color={gold} />
          </UiEntity>
        </UiEntity>
      </Card>
    </UiEntity>

    <UiEntity uiTransform={{ positionType: 'absolute', position: { top: 26, left: '33%' }, width: '34%', height: 110 }}>
      <Card>
        <UiEntity uiTransform={{ width: '100%', height: 25, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label value={taskLabel()} fontSize={13} color={gold} />
          {state.mounted && <Label value={time()} fontSize={18} color={cream} />}
        </UiEntity>
        <Label value={state.target} fontSize={25} color={cream} uiTransform={{ height: 37 }} />
        <Label value={state.instruction} fontSize={14} color={muted} />
      </Card>
    </UiEntity>

    {state.notice !== '' && (
      <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: 122, left: '30%' }, width: '40%', height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 }} uiBackground={{ color: Color4.create(0.12, 0.075, 0.045, 0.92) }}>
        <Label value={state.notice} fontSize={16} color={cream} />
      </UiEntity>
    )}

    <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: 30, right: 30 }, width: 238, height: 68, padding: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 18 }} uiBackground={{ color: state.mounted ? Color4.create(0.36, 0.11, 0.07, 0.96) : coral }} onMouseDown={() => state.mounted ? endShift() : startShift()}>
      <UiEntity uiTransform={{ width: '100%', height: '100%', borderRadius: 14, borderWidth: 1, borderColor: Color4.create(1, 0.92, 0.78, 0.6), alignItems: 'center', justifyContent: 'center' }}>
        <Label value={state.mounted ? 'END SHIFT' : 'START SHIFT'} fontSize={21} color={Color4.White()} />
      </UiEntity>
    </UiEntity>

    {!state.mounted && <Label value={state.interaction} fontSize={15} color={cream} uiTransform={{ positionType: 'absolute', position: { bottom: 51, right: 292 }, width: 470, height: 32 }} />}
  </UiEntity>
)
