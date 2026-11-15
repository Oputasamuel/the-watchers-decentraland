# THE WATCHERS — Game Design Document

## Concept

**THE WATCHERS** is a cooperative gothic horror game for Decentraland. Players enter a haunted chapel, recover red crystals, and return them to the altar while keeping their candlelight alive. When the team secures all 25 crystals, the entrance gate opens and survivors escape. This repository currently contains a **playable demo and test scene**, not the finished game.

## Player experience

Darkness has covered the town. Statues called Watchers move toward players whose light has gone out. Ghosts can pursue beyond their starting areas. The player begins at the chapel gate, reads a brief warning and controls, then explores the compound, cemetery, church, coffin room, and tunnel. Crystals and igniters change location between completed runs. A player can carry one crystal at a time, so each find creates a return journey to the altar. Igniters slowly refill the candle bar; away from them it drains over 20 seconds. A caretaker explains the threats. A captured player sees a jumpscare and Game Over screen, then can retry or return to a checkpoint.

## Core loop

1. Search for a red crystal while watching the candle bar and enemy positions.
2. Aim at a crystal and press **E** on desktop or the **E** interaction control on mobile.
3. Reach an igniter to refill light when needed.
4. Carry the crystal to the altar and return it. Team progress increases and the crystal appears on the altar.
5. Repeat until 25 are secured, then escape through the opened gate.

The demo tests whether the search, light management, pursuit, and return journey create suspense and a clear sense of progress. Its briefing and prompts must let a new player understand the task quickly.

## Social play

Players share a scene and can see one another. They can split up to search different routes, call out crystal and igniter locations, warn each other about Watchers, and regroup at the altar. Crystal returns contribute to the shared escape goal. A player's death should interrupt that player's run without erasing the team's secured crystals. The design should remain playable alone; extra players improve search and communication rather than being required to unlock a door.

## Why return tomorrow?

Randomized crystal and igniter locations change the route and risk on each completed run. Players can improve their completion time, compare a personal best, and compete for daily leaderboard places. The demo must test whether that variation and score chase are enough to bring players back; retention is a hypothesis, not a measured result. Later content will add new decisions and discovery to strengthen repeat visits.

## Controls and presentation

The game uses Decentraland's standard movement, camera, jump, and interaction controls. Desktop players move with WASD, look with the mouse, jump with Space, and aim and press E to interact. Mobile players use the joystick, drag to look, use the jump control, and aim and tap E. A compact React-ECS HUD shows the current objective, team crystals, carrying status, and a vertical candle bar. Gothic carved-wood panels, serif typography, restrained amber light, fog, moving ghosts, and sound establish the horror tone. Text and touch targets need testing on small screens.

## Demo scope and test plan

The current scene focuses on one chapel and its connected grounds, the 25-crystal objective, igniters, Watchers, ghosts, caretaker, capture/retry flow, and score display. Before submitting, confirm the published World link, multiplayer interactions, mobile readability, and whether the daily leaderboard persists across days. Record five first-time players' understanding after 10 seconds, completion or abandonment points, and whether at least two choose to replay on another day.

## Future updates

These are **planned**, not demo features:

- Search events that alter routes, clues, or enemy pressure during a run.
- Special pickups such as a backpack that increases crystal carrying capacity.
- Environmental puzzles that gate shortcuts and reveal hidden areas.
- New connected spaces including a library, storehouse, and horse house.
- More enemy patterns, narrative clues, and cooperative choices shaped by playtest results.

The first funded scope should be chosen from evidence gathered in the demo. The aim is a replayable, social horror experience with a clear reason to return, while keeping the first release manageable for desktop and mobile.
