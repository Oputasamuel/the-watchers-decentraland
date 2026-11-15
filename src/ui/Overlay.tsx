import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { bodyFont, bone, dimBone, titleFont } from './theme'
import { HorrorButton } from './HorrorButton'

export function Overlay(props: { title: string; body: string; compact: boolean; onClose?: () => void; buttonText?: string }) {
  return (
    <UiEntity
      uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}
      uiBackground={{ color: Color4.create(0.015, 0.008, 0.014, 0.72) }}
    >
      <UiEntity uiTransform={{ width: props.compact ? '78%' : '36%', maxWidth: 460,
        height: props.compact ? 310 : 440, padding: props.compact ? 24 : 40,
        flexDirection: 'column', alignItems: 'center', justifyContent: 'space-around' }}
        uiBackground={{ texture: { src: 'assets/images/hud-gameover-panel-v1.png' }, textureMode: 'stretch' }}>
            <Label value={props.title} font="serif" fontSrc={titleFont} fontSize={props.compact ? 25 : 34}
              color={bone} textAlign="middle-center" uiTransform={{ width: '100%', height: props.compact ? 55 : 70 }} />
            <Label value={props.body} font="serif" fontSrc={bodyFont} fontSize={props.compact ? 18 : 23}
              color={dimBone} textAlign="middle-center" textWrap="wrap"
              uiTransform={{ width: '100%', height: props.compact ? 120 : 155 }} />
            {props.onClose && <HorrorButton text={props.buttonText ?? 'CLOSE'} onPress={props.onClose} width={props.compact ? 140 : 190} height={props.compact ? 34 : 42} fontSize={props.compact ? 13 : 16} />}
      </UiEntity>
    </UiEntity>
  )
}
