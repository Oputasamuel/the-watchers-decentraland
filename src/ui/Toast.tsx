import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { getChapelHudState } from '../hudState'
import { bodyFont, bone, slices } from './theme'

export function Toast(props: { compact: boolean }) {
  const state = getChapelHudState()
  if (!state.toast) return null
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute', position: { top: props.compact ? 238 : 262, left: 0 },
        width: '100%', height: props.compact ? 60 : 68,
        alignItems: 'center', justifyContent: 'center', opacity: state.toastAlpha,
        pointerFilter: 'none'
      }}
    >
      <UiEntity uiTransform={{ width: props.compact ? '84%' : '46%', maxWidth: 620,
        height: '100%', alignItems: 'center', justifyContent: 'center', pointerFilter: 'none' }}
        uiBackground={{ texture: { src: 'assets/images/hud-objective-wood-v1.png' }, textureMode: 'nine-slices', textureSlices: slices }}>
        <Label value={state.toast} font="serif" fontSrc={bodyFont} fontSize={props.compact ? 11 : 16}
          color={bone} textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '78%', height: '80%' }} />
      </UiEntity>
    </UiEntity>
  )
}
