import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { bodyFont, bone, dimBone, titleFont } from './theme'
import { HorrorButton } from './HorrorButton'

export type CaptureActions = {
  retry: () => void
  checkpoint: () => void
  menu: () => void
  start: () => void
}

export function StoryBriefing(props: { width: number; height: number; onStart: () => void }) {
  const compact = props.width < 1100 || props.width / props.height < 1.45
  const narrow = props.width < 500
  const short = props.height < 720
  const tiny = props.height < 500
  const panelWidth = Math.min(props.width * 0.92, compact ? 440 : 620)
  const panelHeight = Math.min(props.height * 0.99, compact ? 690 : 820)
  const headingSize = tiny ? 17 : narrow ? 20 : short ? 21 : compact ? 22 : 31
  const textSize = tiny ? 10 : narrow ? 12 : short ? 13 : compact ? 14 : 17
  const controlsSize = tiny ? 8 : narrow ? 10 : short ? 11 : compact ? 12 : 14
  return (
    <UiEntity uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', zIndex: 100,
      alignItems: 'center', justifyContent: 'center' }}>
      <UiEntity uiTransform={{ width: panelWidth, height: panelHeight, padding: Math.min(panelWidth * 0.1, panelHeight * 0.08),
        flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', overflow: 'hidden' }}
        uiBackground={{ texture: { src: 'assets/images/hud-gameover-panel-v1.png' }, textureMode: 'stretch' }}>
        <Label value="THE WATCHERS" font="serif" fontSrc={titleFont} fontSize={headingSize}
          color={bone} textAlign="middle-center" uiTransform={{ positionType: 'relative', position: { top: 20 },
            width: '100%', height: tiny ? 26 : narrow ? 34 : short ? 42 : 54 }} />
        <Label value="Darkness covers the town. Inside the chapel, the statues move when the candle dies."
          font="serif" fontSrc={bodyFont} fontSize={textSize} color={bone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '96%', height: tiny ? 42 : narrow ? 70 : short ? 66 : compact ? 82 : 96 }} />
        <Label value="Beware the Watchers. Return 25 red crystals to the altar, one at a time. Use igniters to refill your light. When the gate opens, escape. Stay alive."
          font="serif" fontSrc={bodyFont} fontSize={textSize} color={bone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '96%', height: tiny ? 62 : narrow ? 95 : short ? 87 : compact ? 112 : 132 }} />
        <Label value="CONTROLS" font="serif" fontSrc={titleFont} fontSize={tiny ? 12 : short ? 16 : compact ? 17 : 21}
          color={bone} textAlign="middle-center" uiTransform={{ width: '100%', height: tiny ? 18 : narrow ? 22 : short ? 28 : 34 }} />
        <Label value="DESKTOP: WASD move. Mouse look. Space jump. Aim at a crystal or altar, then press E."
          font="serif" fontSrc={bodyFont} fontSize={controlsSize} color={bone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '76%', height: tiny ? 42 : narrow ? 65 : short ? 53 : compact ? 70 : 76 }} />
        <Label value="MOBILE: Joystick move. Drag to look. Arrow jump. Aim at a crystal or altar, then tap E."
          font="serif" fontSrc={bodyFont} fontSize={controlsSize} color={bone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '76%', height: tiny ? 48 : narrow ? 70 : short ? 58 : compact ? 74 : 80 }} />
        <HorrorButton text="ENTER THE CHAPEL" onPress={props.onStart}
          width={panelWidth * 0.64} height={tiny ? 36 : narrow ? 44 : short ? 48 : compact ? 48 : 58} fontSize={tiny ? 11 : short ? 14 : compact ? 14 : 17} />
      </UiEntity>
    </UiEntity>
  )
}

export function Jumpscare(props: { alpha: number; width: number; height: number }) {
  const imageHeight = props.height * 0.9
  const imageWidth = imageHeight * 4 / 3
  return (
    <UiEntity
      uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', zIndex: 100,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: props.alpha,
        pointerFilter: 'none' }}
      uiBackground={{ color: Color4.create(0.09, 0.005, 0.015, 0.94) }}
    >
      <UiEntity uiTransform={{ width: imageWidth, height: imageHeight, pointerFilter: 'none' }}
        uiBackground={{ texture: { src: 'assets/images/hud-angel-capture-v1.png' }, textureMode: 'stretch' }} />
    </UiEntity>
  )
}

export function CaptureMenu(props: { titleScreen: boolean; width: number; height: number; actions: CaptureActions }) {
  const compact = props.width < 1100 || props.width / props.height < 1.45
  const short = props.height < 720
  const panelWidth = Math.min(props.width * 0.84, compact ? 420 : 520)
  const panelHeight = Math.min(props.height * 0.84, panelWidth * 4 / 3)
  const buttonWidth = panelWidth * 0.64
  const buttonHeight = short ? 48 : compact ? 48 : 60
  return (
    <UiEntity uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', zIndex: 100,
      alignItems: 'center', justifyContent: 'center' }}>
      <UiEntity uiTransform={{ width: panelWidth, height: panelHeight, alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', padding: panelWidth * 0.11, overflow: 'hidden' }}
        uiBackground={{ texture: { src: 'assets/images/hud-gameover-panel-v1.png' }, textureMode: 'stretch' }}>
        <Label value={props.titleScreen ? 'THE WATCHERS' : 'GAME OVER'} font="serif" fontSrc={titleFont}
          fontSize={short ? 28 : compact ? 28 : 39} color={bone} textAlign="middle-center"
          uiTransform={{ width: '90%', height: short ? 54 : compact ? 58 : 82 }} />
        <Label value={props.titleScreen ? 'FIND THE CRYSTALS. KEEP THE LIGHT ALIVE.' : 'THE ANGEL CAUGHT YOU'}
          font="serif" fontSrc={bodyFont} fontSize={short ? 14 : compact ? 15 : 19} color={dimBone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '82%', height: short ? 46 : compact ? 54 : 68 }} />
        {props.titleScreen ? (
          <HorrorButton text="START GAME" onPress={props.actions.start} width={buttonWidth} height={buttonHeight}
            fontSize={compact ? 16 : 20} />
        ) : (
          <UiEntity uiTransform={{ width: '100%', height: short ? 184 : compact ? 188 : 230, flexDirection: 'column',
            alignItems: 'center', justifyContent: 'space-evenly' }}>
            <HorrorButton text="RETRY" onPress={props.actions.retry} width={buttonWidth} height={buttonHeight}
              fontSize={compact ? 16 : 20} />
            <HorrorButton text="MENU" onPress={props.actions.menu} width={buttonWidth} height={buttonHeight}
              fontSize={compact ? 16 : 20} />
            <HorrorButton text="GO TO CHECKPOINT" onPress={props.actions.checkpoint} width={buttonWidth} height={buttonHeight}
              fontSize={short ? 13 : compact ? 14 : 18} />
          </UiEntity>
        )}
        <Label value={props.titleScreen ? 'RETURN 25 CRYSTALS TO THE ALTAR' : 'CARRIED CRYSTAL LOST. TEAM PROGRESS SAVED.'}
          font="serif" fontSrc={bodyFont} fontSize={short ? 11 : compact ? 12 : 15} color={dimBone}
          textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '78%', height: short ? 48 : compact ? 44 : 56 }} />
      </UiEntity>
    </UiEntity>
  )
}
