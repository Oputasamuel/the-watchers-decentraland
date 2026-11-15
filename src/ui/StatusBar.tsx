import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { getChapelHudState, CRYSTAL_CARRY_LIMIT } from '../hudState'
import { bodyFont, bone, blood, dimBone, ember, slices, titleFont } from './theme'

export function CrystalCounter(props: { compact: boolean }) {
  const state = getChapelHudState()
  const width = props.compact ? 170 : 282
  const height = props.compact ? 58 : 96
  return (
    <UiEntity uiTransform={{ width, height, pointerFilter: 'none' }}>
      <UiEntity uiTransform={{ positionType: 'absolute', width: '100%', height: '100%',
        opacity: state.crystalPulse, pointerFilter: 'none' }}
        uiBackground={{ texture: { src: 'assets/images/hud-crystal-counter-v1.png' }, textureMode: 'stretch' }} />
      <UiEntity uiTransform={{ positionType: 'absolute', position: { left: width * 0.35, top: height * 0.22 },
        width: width * 0.57, height: height * 0.62, flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', pointerFilter: 'none' }}>
        <Label value={`${state.secured} / ${state.total}`} font="serif" fontSrc={titleFont}
          fontSize={props.compact ? 18 : 29} color={bone} textAlign="middle-center"
          uiTransform={{ width: '100%', height: props.compact ? 27 : 45 }} />
        <Label value={`CARRY ${state.carrying} / ${CRYSTAL_CARRY_LIMIT}`} font="serif" fontSrc={bodyFont}
          fontSize={props.compact ? 11 : 16} color={state.carrying > 0 ? ember : dimBone}
          textAlign="middle-center" uiTransform={{ width: '100%', height: props.compact ? 19 : 28 }} />
      </UiEntity>
    </UiEntity>
  )
}

export function ObjectivePlaque(props: { compact: boolean }) {
  const state = getChapelHudState()
  const objective = state.secured === state.total
    ? 'ESCAPE THROUGH THE FRONT GATE'
    : state.carrying > 0 ? 'RETURN THE CRYSTAL TO THE ALTAR' : 'FIND RED CRYSTALS'
  return (
    <UiEntity uiTransform={{ width: props.compact ? '82%' : '46%', maxWidth: props.compact ? 390 : 680,
      height: props.compact ? 70 : 94, alignItems: 'center', justifyContent: 'center', pointerFilter: 'none' }}
      uiBackground={{ texture: { src: 'assets/images/hud-objective-wood-v1.png' },
        textureMode: 'nine-slices', textureSlices: slices }}>
      <Label value={objective} font="serif" fontSrc={titleFont} fontSize={props.compact ? 12 : 21}
        color={bone} textAlign="middle-center" textWrap="wrap"
        uiTransform={{ width: '78%', height: '80%', pointerFilter: 'none' }} />
    </UiEntity>
  )
}

export function CandleGauge(props: { compact: boolean }) {
  const state = getChapelHudState()
  const iconHeight = props.compact ? 300 : 450
  const iconWidth = Math.round(iconHeight * 683 / 1024)
  const fillHeight = Math.max(0, iconHeight * state.candleSeconds / 20)
  const label = state.inIgnitionZone ? 'IGNITING' : state.candleSeconds > 0
    ? `${Math.ceil(state.candleSeconds)}s` : 'LIGHT OUT'
  return (
    <UiEntity uiTransform={{ width: iconWidth + (props.compact ? 22 : 30), height: iconHeight + 26,
      pointerFilter: 'none' }}>
      <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 0, top: 0 },
        width: iconWidth, height: iconHeight, opacity: 0.72, pointerFilter: 'none' }}
        uiBackground={{ texture: { src: 'assets/images/hud-candle-unlit-v1.png' }, textureMode: 'stretch' }} />
      <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 0, top: iconHeight - fillHeight },
        width: iconWidth, height: fillHeight, overflow: 'hidden', pointerFilter: 'none' }}>
        <UiEntity uiTransform={{ positionType: 'absolute', position: { left: 0, top: -(iconHeight - fillHeight) },
          width: iconWidth, height: iconHeight, pointerFilter: 'none' }}
          uiBackground={{ texture: { src: 'assets/images/hud-candle-light-v1.png' }, textureMode: 'stretch' }} />
      </UiEntity>
      <Label value={label} font="serif" fontSrc={bodyFont} fontSize={props.compact ? 11 : 15}
        color={state.candleSeconds > 0 ? ember : blood} textAlign="middle-center" textWrap="nowrap"
        uiTransform={{ positionType: 'absolute', position: { left: 0, top: iconHeight },
          width: '100%', height: 26, pointerFilter: 'none' }} />
    </UiEntity>
  )
}
