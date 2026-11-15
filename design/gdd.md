# THE WATCHERS — Game Design Document

## 0. TL;DR

| | |
|---|---|
| **Player promise** | You're a survivor in a haunted chapel. Return crystals to open the gate while your fading candle keeps the statues back. |
| **Primary player** | For Decentraland players who enjoy short horror escapes, arriving solo or with friends to learn a haunted route and survive a shared chase. |
| **Current status** | Playable core-loop demo in [raccooncity.dcl.eth](https://decentraland.org/play/?realm=raccooncity.dcl.eth). Live multiplayer persistence and mobile gameplay still need validation. |
| **Requested round** | Proposed V0, pending confirmation of the Creator Success milestone. |
| **Live at end of the round** | Players can enter the chapel World on desktop or mobile, search alone or in a small group, and escape by securing 25 crystals. |

## 1. Player Promise

> You're a survivor in a haunted chapel. Return crystals to open the gate while your fading candle keeps the statues back.

## 2. First Minutes & How to Play

Proposed V0 onboarding. The current demo opens at the chapel gate with a briefing.

| Time | Player experience |
|---|---|
| **0–5 seconds after control** | You see the chapel entrance, your candle meter, and a red crystal within sight. You move toward the crystal. |
| **5–10 seconds** | You pick it up. The HUD shows that you're carrying it and points toward the altar. |
| **10–60 seconds** | You return the crystal. It appears on the altar, and the team counter reaches 1/25. If someone is nearby, you can ping an igniter for them. |
| **1–3 minutes** | You follow a different search route, see your candle fall, and choose whether to detour to an igniter before returning another crystal. |
| **3–10 minutes** | You decide whether to split from a teammate or follow their relight route. If you're captured, you retry while the team keeps its secured crystals. |
| **Natural stopping point** | When the team secures 25 crystals, you escape through the gate. The results show your time and when the daily board resets. |

### How to Play

- Find a red crystal.
- Relight your candle and fill the altar.
- Signal safe routes to your teammates.

## 3. Core Loop

| # | Step | What the player does | Why do it again? |
|---|---|---|---|
| 1 | **Search** | Take a route through the chapel grounds and look for a red crystal while tracking enemies and candlelight. | Changing crystal and igniter positions make familiar routes play differently. |
| 2 | **Collect** | Aim and interact to pick up one crystal. The HUD confirms that you're carrying it. | Carrying one at a time makes each pickup a fresh return trip. |
| 3 | **Relight** | When needed, move to an igniter and wait as it refills the candle meter. Away from an igniter, a full candle drains in 20 seconds. | Compare the time needed for a relight with the chance of reaching the altar before the Watchers move in. |
| 4 | **Return** | Interact at the altar. The crystal becomes visible, the shared counter advances, and the gate opens at 25. | Every delivery moves the team closer to escape. |

| | |
|---|---|
| **One complete loop takes** | V0 target of 30–90 seconds per delivery. The altar deposit marks completion. A full escape takes multiple deliveries. |
| **Decision, challenge, or expression** | Decide whether to take the direct route with a low candle, detour to relight, or follow a teammate who found a safer path. Ghost pursuit can change the route mid-trip. |
| **Shortest satisfying visit / typical session** | Target 1–3 minutes to contribute one or more crystals / 8–15 minutes for a small-group run. Solo completion time needs playtesting. |
| **Why repetition 10 remains appealing** | Between completed runs, crystal and igniter positions change. Knowing the map helps players improvise safe connections as their candle drains and teammates cover different areas. |

### Pillars

1. Candlelight governs route risk.
2. One crystal per trip makes the return journey matter.
3. Individual deliveries build a visible team escape.

## 4. Why Players Come Back

### 4.1 The next-day (D1) sentence

A player who enjoyed their first session returns the next day because the daily escape board resets at 00:00 UTC, which they anticipate from the countdown on the results screen.

### 4.2 The progression chain

Proposed V0 progression pairs saved escape results with visible route knowledge. Players retain their personal best and learn how to guide other survivors.

| Moment | What persists or has been built? | What becomes possible next? | How can another player tell? |
|---|---|---|---|
| **End of first session** | First completed escape time and familiarity with a route back to the altar. | Choose a route to improve on the next visit. | The results show a named escape time. |
| **End of first week** | Personal best and familiarity with several ways back to the altar. | Act as a scout, find an active igniter, and guide a carrier through a safer return. | Teammates see who placed the route ping and can follow it. |
| **Week 3+** | Saved personal best and practiced routes across multiple layouts. | Take turns scouting and carrying with returning teammates, adapting those roles to each layout. | Returning players recognize named guides and can split routes with them sooner. |

You reach the chapel with a player you recognize from a previous escape. You scout the cemetery first and ping an igniter for them. They follow your signal with a crystal while you check the route to the altar. After escaping, you compare the result with your saved personal best.

### 4.3 Two return hooks

| Selected hook | Exact trigger or timing | What the player anticipates | Reminder channel + no-reminder fallback |
|---|---|---|---|
| **Daily escape board** | Proposed reset at 00:00 UTC each day. The results screen shows time remaining. | A fresh chance to place on the board. | In-world results and countdown. Players can remember the daily reset without a notification. |
| **Personal-best chase** | Compare each completed escape with the player's saved best for the same party size. | Improve a route or coordinate a cleaner run on a fresh layout. | The results screen shows the current time and the saved best. Players can remember the time they want to beat. |

## 5. Social by Design

| | |
|---|---|
| **The repeatable social loop** | A scout taps an igniter ping. A carrier chooses to follow it, relights, and delivers their crystal. The shared altar advances, and both players can see the benefit of regrouping for the next trip. Pings are proposed V0 work. |
| **The disappearance test** | Solo players can escape. Live route callouts, parallel searching, and the choice to follow another player's lit route disappear with the group. |
| **From strangers to a group** | In the proposed opening, you see another player's name beside their igniter ping and can follow the icon within 30 seconds using movement alone. A player carrying a crystal can recognize the delivery route by the altar marker. |
| **Recognition & continuity** | Names appear on route pings and proposed results. A returning player can recognize a previous scout, follow their lead, or take the scout role on a route they now know. |
| **Quiet hours & player counts** | Solo players can learn routes, complete deliveries, and escape even on a fresh board. Social play starts at two, the ideal group is 2–4, and the V0 test target is four concurrent players. Live count is unverified. Recruit the first groups through timed playtests and friend invites. |
| **Drop-in / drop-out** | A late arrival can bring a crystal immediately. V0 must preserve banked crystals through capture and disconnects, and release an unbanked crystal when its carrier leaves. |
| **Visible play** | A bystander sees a player carry a red crystal past the statues and add it to the glowing altar. |
| **Shareable play** | Two survivors sprint through the gate as the 25th crystal lights the altar and a Watcher closes in behind them. |
| **Bring-a-friend** | After getting caught on a return trip, you invite a friend to scout a relight route while you carry the next crystal. |

## 6. Mobile-First

| Core-loop verb | Touch controls |
|---|---|
| **Search** | Move with the on-screen joystick, drag to look, and use the jump control where needed. |
| **Collect** | Aim at the crystal and tap the E interaction control. |
| **Relight** | Use the joystick to enter the igniter area and watch the meter refill. |
| **Return** | Aim at the altar and tap E to deposit the crystal. |

The HUD prioritizes the objective, shared crystal count, carrying state, and vertical candle meter. Route pings use a large touch target and a distinct icon, with the HUD checked at phone size.

Target 30 FPS on an iPhone 14 using the Decentraland mobile client and 60 FPS on recommended desktop hardware using the Decentraland desktop client, both at four concurrent players. Device and live World performance tests are pending.

The core design uses movement, looking, jumping, and interaction. Verify those inputs and the touch ping in the live mobile client in Week 1. Use an in-world interactable for the ping if the proposed HUD button is unreliable.

## 7. World, Look & Story

Darkness has covered the town, and the chapel's Watchers move toward survivors whose candles go out. Recover the chapel's red crystals and return them to the altar to open the escape gate.

Amber igniters mark places to relight, red crystals stand out through fog, and the altar gives players a recognizable destination. The signature shot is a red crystal held against amber candlelight, with a stone Watcher emerging from the chapel fog. Carved-wood panels and serif headings carry the gothic style while the objective and candle meter stay legible at phone size.

**Deployment target:** The existing raccooncity.dcl.eth test World for V0 validation. Review third-party asset permissions and public World branding before release.

## 8. Audience & Comparables

**Primary player.** For Decentraland players who enjoy short horror escapes, arriving solo or with friends to learn a haunted route and survive a shared chase.

**How the first group arrives.** Invite Decentraland community members and friends to a scheduled World playtest through a direct realm link. A shared start time helps reach the two-player social threshold and the four-player test target.

**Deliberately not for.** Players looking for combat-led horror or long, story-heavy sessions.

### Comparables

| | [DOORS](https://www.roblox.com/games/6516141723/DOORS) | [Phasmophobia](https://store.steampowered.com/app/739630/Phasmophobia/) |
|---|---|---|
| **What works in the published design** | The game presents each death as a lesson, giving players a reason to retry with what they learned. | A shared evidence goal gives players reasons to communicate and use their equipment together. |
| **What fits our context less well** | A chain of doors gives exploration a linear frame. Our chapel needs routes that players can revisit and share with late arrivals. | An equipment toolkit would add onboarding and touch-control demands to the first visit. |
| **What we will do differently** | Use one connected chapel with shifting crystal and igniter locations, and route choices shaped by candlelight. | Give every player the same candle and let them alternate between scouting the next relight point and carrying a crystal. |

## 9. 4 Week Plan (v1 scope)

Proposed four-week V0 slice, pending Creator Success milestone confirmation.

| Week | What is playable / done |
|---|---|
| **1 — Prototype definition** | Make the first visible pickup and altar return playable without mandatory reading. Run the 5/10 comprehension check with five first-time players and confirm core touch inputs in the World. |
| **2 — Core interaction + first-group test** | Test at two and four players. Check name and ping readability, shared deposits, late joins, and whether capture or disconnects disrupt crystal progress. Record completion and abandonment points and watch for voluntary regrouping or replay. |
| **3 — Core systems refinement** | Tune routes, candle pressure, and retry pacing. Verify personal-best persistence, the daily board reset, and mobile HUD readability. Profile the four-player performance targets. |
| **4 — Playable release** | Deploy the tested chapel slice to the target World. Recheck solo and group escapes on both clients, validate public branding and asset permissions, and use the Creator Dashboard to review return as data becomes available. |

**What keeps the experience changing after launch**

- Between completed runs, crystals and igniters move within the same grounds, changing the safest routes.
- The daily board and personal bests give players two ways to measure improvement without requiring new levels.
- The board resets daily. Personal bests persist, and new players can contribute on their first crystal delivery.
- If players consistently ignore igniters or wait at the altar, revisit route pressure and the placement of relight points.

**Not building in v1.** Defer carrying-capacity upgrades, puzzle-gated shortcuts, and new rooms. If playtests show strong repeat interest, test a search event that temporarily changes a route first.

**Top risk + fallback.** A capture, late join, or disconnect could desynchronize crystal progress and strand a team. Test those cases early. If late joins remain unreliable, test fresh runs with a fixed starting party and let new arrivals join the next run. Gate public release on preserving secured crystals through capture and disconnects.