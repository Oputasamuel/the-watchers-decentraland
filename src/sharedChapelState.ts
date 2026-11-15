import { engine, Schemas } from '@dcl/sdk/ecs'

// These components are synchronized between players. Scene objects and HUD
// visuals are derived from them, rather than used as the source of truth.
export const ChapelRun = engine.defineComponent('the-watchers::ChapelRun', {
  seed: Schemas.Int
})

// 0 = on the map, 1 = carried, 2 = secured at the altar.
export const SharedCrystal = engine.defineComponent('the-watchers::SharedCrystal', {
  phase: Schemas.Int,
  owner: Schemas.String
})
