import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { bone, titleFont } from './theme'

export function HorrorButton(props: { text: string; onPress: () => void; width?: number; height?: number; fontSize?: number }) {
  return (
    <UiEntity
      uiTransform={{ width: props.width ?? 104, height: props.height ?? 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
      uiBackground={{ color: Color4.create(0.19, 0.07, 0.05, 1) }}
      onMouseDown={props.onPress}
    >
      <UiEntity uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', pointerFilter: 'none' }}
        uiBackground={{ texture: { src: 'assets/images/hud-wood-button-v1.png' }, textureMode: 'stretch' }} />
      <Label value={props.text} font="serif" fontSrc={titleFont} fontSize={props.fontSize ?? 14} color={bone}
        textAlign="middle-center" textWrap="nowrap"
        uiTransform={{ positionType: 'absolute', width: '84%', height: '72%', pointerFilter: 'none' }} />
    </UiEntity>
  )
}
