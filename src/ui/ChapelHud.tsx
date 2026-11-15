import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { engine, UiCanvasInformation } from '@dcl/sdk/ecs'
import { closeCaretakerDialogue, getChapelHudState, openLeaderboard } from '../hudState'
import { CandleGauge, CrystalCounter, ObjectivePlaque } from './StatusBar'
import { CaptureMenu, Jumpscare, StoryBriefing, type CaptureActions } from './CaptureScreens'
import { Overlay } from './Overlay'
import { Toast } from './Toast'
import { CaretakerDialogue } from './CaretakerDialogue'
import { bone, titleFont } from './theme'
import { HorrorButton } from './HorrorButton'
import { LeaderboardPanel } from './LeaderboardPanel'

let captureActions: CaptureActions = { retry: () => {}, checkpoint: () => {}, menu: () => {}, start: () => {} }
export function setCaptureActions(actions: CaptureActions): void { captureActions = actions }

export function ChapelHud() {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  const width = canvas?.width && canvas.width > 0 ? canvas.width : 1920
  const height = canvas?.height && canvas.height > 0 ? canvas.height : 1080
  const compact = width < 1100 || width / height < 1.45
  const narrow = width < 650
  const state = getChapelHudState()
  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', pointerFilter: 'none' }}>
      {state.screen === 'playing' && <UiEntity
        uiTransform={{
          positionType: 'absolute', position: { top: compact ? 18 : 22, right: compact ? 12 : 44 },
          width: compact ? 170 : 282, height: compact ? 58 : 96, pointerFilter: 'none'
        }}
      >
        <CrystalCounter compact={compact} />
      </UiEntity>}
      {state.screen === 'playing' && <UiEntity
        uiTransform={{ positionType: 'absolute', position: { top: narrow ? 84 : compact ? 28 : 24, left: 0 },
          width: '100%', height: compact ? 70 : 94, alignItems: 'center', justifyContent: 'center',
          pointerFilter: 'none' }}>
        <ObjectivePlaque compact={compact} />
      </UiEntity>}
      {state.screen === 'playing' && !state.leaderboardVisible && <UiEntity
        uiTransform={{ positionType: 'absolute', position: { top: compact ? 105 : 145, right: compact ? 16 : 74 },
          width: compact ? 145 : 210, height: compact ? 42 : 54 }}>
        <HorrorButton text="LEADERBOARD" onPress={openLeaderboard}
          width={compact ? 145 : 210} height={compact ? 42 : 54} fontSize={compact ? 12 : 16} />
      </UiEntity>}
      {state.screen === 'playing' && <UiEntity
        uiTransform={{ positionType: 'absolute', position: { top: '38%', right: compact ? 12 : 44 },
          width: compact ? 255 : 378, height: compact ? 365 : 515, pointerFilter: 'none' }}>
        <CandleGauge compact={compact} />
      </UiEntity>}
      {state.screen === 'playing' && <Toast compact={compact} />}
      {state.screen === 'playing' && state.caretakerVisible && <CaretakerDialogue width={width} height={height} onClose={closeCaretakerDialogue} />}
      {state.screen === 'playing' && state.leaderboardVisible && <LeaderboardPanel width={width} height={height} />}
      {state.screen === 'countdown' && <UiEntity
        uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', zIndex: 100,
          alignItems: 'center', justifyContent: 'center', pointerFilter: 'none' }}>
        <UiEntity uiTransform={{ width: compact ? '82%' : '38%', maxWidth: 600, height: compact ? 250 : 330,
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerFilter: 'none' }}
          uiBackground={{ texture: { src: 'assets/images/hud-objective-wood-v1.png' }, textureMode: 'stretch' }}>
          <Label value="THE WATCHERS ARE WAKING" font="serif" fontSrc={titleFont}
            fontSize={narrow ? 16 : compact ? 20 : 30} color={bone} textAlign="middle-center" textWrap="wrap"
            uiTransform={{ width: '78%', height: 62 }} />
          <Label value={String(state.countdownSeconds)} font="serif" fontSrc={titleFont}
            fontSize={compact ? 48 : 72} color={bone} textAlign="middle-center"
            uiTransform={{ width: '90%', height: 90 }} />
        </UiEntity>
      </UiEntity>}
      {state.screen === 'playing' && state.escaped && <Overlay title="YOU ESCAPED"
        body="The gate yielded. The chapel is behind you, but its watchers remain inside."
        compact={compact} onClose={captureActions.retry} buttonText="PLAY AGAIN" />}
      {state.screen === 'jumpscare' && <Jumpscare alpha={state.scareAlpha} width={width} height={height} />}
      {state.screen === 'briefing' && <StoryBriefing width={width} height={height} onStart={captureActions.start} />}
      {(state.screen === 'gameOver' || state.screen === 'title') &&
        <CaptureMenu titleScreen={state.screen === 'title'} width={width} height={height} actions={captureActions} />}
    </UiEntity>
  )
}
