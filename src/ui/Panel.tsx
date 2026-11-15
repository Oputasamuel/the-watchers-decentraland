import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { slices } from './theme'

export function Panel(props: { children?: ReactEcs.JSX.Element | ReactEcs.JSX.Element[] }) {
  return (
    <UiEntity
      uiTransform={{ width: '100%', height: '100%', padding: 12, flexDirection: 'column' }}
      uiBackground={{ texture: { src: 'assets/images/panel.png' }, textureMode: 'nine-slices', textureSlices: slices }}
    >
      {props.children}
    </UiEntity>
  )
}
