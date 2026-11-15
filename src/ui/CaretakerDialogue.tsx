import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { bodyFont, bone, titleFont } from './theme'
import { HorrorButton } from './HorrorButton'

export function CaretakerDialogue(props: { width: number; height: number; onClose: () => void }) {
  const compact = props.width < 700
  const short = props.height < 500
  const width = Math.min(props.width * 0.9, compact ? 440 : 680)
  const height = Math.min(props.height * 0.82, compact ? 360 : 380)
  return <UiEntity uiTransform={{ positionType: 'absolute', position: { bottom: props.height < 700 ? 16 : 45, left: (props.width - width) / 2 },
    width, height, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly',
    padding: short ? 18 : compact ? 26 : 38 }}
    uiBackground={{ texture: { src: 'assets/images/hud-objective-wood-v1.png' }, textureMode: 'stretch' }}>
    <Label value="THE CARETAKER" font="serif" fontSrc={titleFont} fontSize={short ? 15 : compact ? 18 : 24}
      color={bone} textAlign="middle-center" uiTransform={{ width: '90%', height: short ? 26 : compact ? 30 : 40 }} />
    <Label value="The Watchers stay in their own grounds. When your candle goes dark, they move toward you."
      font="serif" fontSrc={bodyFont} fontSize={short ? 11 : compact ? 13 : 18} color={bone} textWrap="wrap"
      textAlign="middle-center" uiTransform={{ width: '90%', height: short ? 64 : compact ? 80 : 96 }} />
    <Label value="Ghosts follow if you come too close, even beyond their haunts. They can catch you only in darkness. Reach an igniter to refill your light."
      font="serif" fontSrc={bodyFont} fontSize={short ? 11 : compact ? 13 : 18} color={bone} textWrap="wrap"
      textAlign="middle-center" uiTransform={{ width: '90%', height: short ? 84 : compact ? 100 : 110 }} />
    <HorrorButton text="OK" onPress={props.onClose} width={compact ? 130 : 180}
      height={short ? 40 : compact ? 44 : 50} fontSize={short ? 13 : compact ? 15 : 19} />
  </UiEntity>
}
