import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { closeLeaderboard, getChapelHudState, type LeaderboardEntry } from '../hudState'
import { bodyFont, bone, dimBone, titleFont } from './theme'
import { HorrorButton } from './HorrorButton'

function time(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function score(entry: LeaderboardEntry): string {
  return `${entry.crystals}/25 CRYSTALS  ·  ${time(entry.seconds)}`
}

export function LeaderboardPanel(props: { width: number; height: number }) {
  const state = getChapelHudState()
  const compact = props.width < 950 || props.height < 700
  const width = Math.min(props.width * 0.9, compact ? 440 : 600)
  const height = Math.min(props.height * 0.94, compact ? 610 : 780)
  const rowHeight = compact ? 26 : 33
  return <UiEntity uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', zIndex: 120,
    alignItems: 'center', justifyContent: 'center' }}>
    <UiEntity uiTransform={{ width, height, padding: compact ? 34 : 55, flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-evenly', overflow: 'hidden' }}
      uiBackground={{ texture: { src: 'assets/images/hud-gameover-panel-v1.png' }, textureMode: 'stretch' }}>
      <Label value="DAILY LEADERBOARD" font="serif" fontSrc={titleFont} fontSize={compact ? 20 : 28}
        color={bone} textAlign="middle-center" uiTransform={{ width: '100%', height: compact ? 35 : 48 }} />
      <Label value={state.leaderboardDate ? `${state.leaderboardDate} UTC · MOST CRYSTALS, THEN FASTEST TIME` : 'TODAY · MOST CRYSTALS, THEN FASTEST TIME'}
        font="serif" fontSrc={bodyFont} fontSize={compact ? 10 : 13} color={dimBone}
        textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '90%', height: compact ? 35 : 44 }} />
      <UiEntity uiTransform={{ width: '88%', height: Math.min(rowHeight * 10, height * 0.52),
        flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
        {state.leaderboardEntries.length === 0 && <Label value={state.leaderboardStatus || 'NO RUNS YET TODAY'}
          font="serif" fontSrc={bodyFont} fontSize={compact ? 12 : 17} color={bone}
          textAlign="middle-center" uiTransform={{ width: '100%', height: 45 }} />}
        {state.leaderboardEntries.map((entry, index) => <Label
          key={`${index}-${entry.name}`} value={`${index + 1}. ${entry.name.slice(0, 12)}   ${score(entry)}`}
          font="serif" fontSrc={bodyFont} fontSize={compact ? 10 : 15} color={bone}
          textAlign="middle-left" textWrap="nowrap" uiTransform={{ width: '100%', height: rowHeight }} />)}
      </UiEntity>
      <Label value={state.bestRun ? `YOUR BEST: ${score(state.bestRun)}` : 'YOUR BEST: NO RUN RECORDED'}
        font="serif" fontSrc={bodyFont} fontSize={compact ? 12 : 17} color={bone}
        textAlign="middle-center" textWrap="wrap" uiTransform={{ width: '88%', height: compact ? 40 : 50 }} />
      <HorrorButton text="CLOSE" onPress={closeLeaderboard} width={compact ? 170 : 220}
        height={compact ? 42 : 52} fontSize={compact ? 14 : 18} />
    </UiEntity>
  </UiEntity>
}
