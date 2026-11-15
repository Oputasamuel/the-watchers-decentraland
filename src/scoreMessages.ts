import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

// Registered at module load on both the client and the multiplayer server.
export const scoreRoom = registerMessages({
  runStart: Schemas.Map({ name: Schemas.String }),
  crystalReturned: Schemas.Map({ crystalIndex: Schemas.Int }),
  runEnd: Schemas.Map({ reason: Schemas.String }),
  scoreRequest: Schemas.Map({ request: Schemas.Int }),
  scoreSnapshot: Schemas.Map({ json: Schemas.String })
})
