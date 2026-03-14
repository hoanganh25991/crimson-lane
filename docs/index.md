# Docs — SDLC Hub

**Purpose:** Single entry point for developing the Dota 1–like mobile game. Use this index to find specs, track progress, and plan work.

**Stack:** Three.js · HTML/CSS/JS · Solo vs AI first → future WebRTC/PeerJS multiplayer.

---

## How to use this docs (SDLC)

| Step | Use |
|------|-----|
| **Scope** | Read [plan.md](plan.md) for MVP and rules; [input.md](input.md) for original vision. |
| **Design** | [game-theme.md](game-theme.md) (look & feel), [dota1-heroes-detail.md](dota1-heroes-detail.md) (hero content). |
| **Build** | [main-menu.md](main-menu.md) (UI flow), [dota1-mobile-game-plan.md](dota1-mobile-game-plan.md) (phased implementation). |
| **Track** | Plan section below: Done · WIP · Backlog, with tags. |

---

## Doc index (by category & tags)

### Spec — requirements & rules

| Doc | Tags | Description |
|-----|------|-------------|
| [plan.md](plan.md) | `#mvp` `#requirements` `#technical` `#phases` | Master spec: product goals, MVP scope, technical appendix (map, heroes, items, AI, controls), phase checklist. **Primary source of truth.** |
| [input.md](input.md) | `#vision` `#multiplayer` `#mobile` | Original brief: Dota 1 feel, WebRTC/QR join, mobile controls. |

### Design — content & look

| Doc | Tags | Description |
|-----|------|-------------|
| [dota1-heroes-detail.md](dota1-heroes-detail.md) | `#content` `#heroes` `#skills` `#art` | All 5 heroes: geometry, animations, stats, Q/W/E/R skills. Reference for implementation. |
| [game-theme.md](game-theme.md) | `#art` `#ui` `#audio` `#ux` | Theme: colors, typography, 3D style, HUD, audio identity, announcer. |

### Plan — implementation & flow

| Doc | Tags | Description |
|-----|------|-------------|
| [dota1-mobile-game-plan.md](dota1-mobile-game-plan.md) | `#phases` `#multiplayer` `#lobby` `#qr` | Phased roadmap: lobby/QR, map, entities, heroes, combat, HUD, PeerJS sync, polish. |
| [main-menu.md](main-menu.md) | `#ui` `#flow` `#implemented` | Main menu, Play flow (side + team size), Settings, Hero Viewer, Lobby → game. |

---

## Tags quick reference

| Tag | Meaning |
|-----|--------|
| `#mvp` | In scope for minimum viable product |
| `#requirements` | Must-have rules and scope |
| `#technical` | Architecture, systems, contracts |
| `#phases` | Development phases / milestones |
| `#content` | Heroes, items, map data |
| `#heroes` `#skills` | Hero and ability design |
| `#art` `#ui` `#audio` `#ux` | Visual, UI, sound, interaction |
| `#multiplayer` `#lobby` `#qr` | Post-MVP: PeerJS, room ID, QR join |
| `#vision` | High-level product goal |
| `#implemented` | Describes current implementation |

---

## Plan (lifecycle)

### Done `#implemented`

| Area | What’s in |
|------|------------|
| **Engine** | Three.js scene, map (terrain, lanes, river), camera, game loop. |
| **Menu** | Main menu, Play (side + team size), Settings, Hero Viewer, Lobby, hero pick → start. |
| **Heroes** | 5 heroes: models, stats, Q/W/E/R. |
| **Combat** | Attack, damage, HP/MP, death, respawn, projectiles, stun/slow. |
| **Lane** | Creeps, waypoints, last hit, deny, XP, gold. |
| **Structures** | Towers, barracks data, Ancient (win condition). |
| **Items** | 12 items, recipes, passives/actives, shop, inventory. |
| **HUD** | Bars, gold, KDA, level, XP, skills, items, minimap (click pan), announcer. |
| **Controls** | Joystick (mobile), desktop, move/attack/cast/item. |
| **AI** | Hero bot (lane, farm, cast, buy), creep AI. |
| **Audio** | SFX (hit, spells, levelup, etc.). |

### WIP / to finish (with tags)

| Item | Tags | Spec |
|------|------|------|
| Barracks destroyable + mega-creep | `#structures` `#content` | HP, death, lane creep upgrade when barracks fall. |
| Neutral camps | `#content` `#world` | Spawn units, leash, respawn timer, gold/XP, bot jungle. |
| Minimap | `#ui` `#ux` | Fog of war, entity dots (towers/barracks/creeps), recenter. |
| TP Scroll | `#items` `#ux` | Channel time, interrupt on stun/death, allied-structure-only target. |
| Ability UX | `#ux` `#skills` | Drag-to-aim, double-tap auto-target; VFX per hero doc. |
| Bot difficulty | `#ai` | Easy / Normal / Hard presets. |
| Tests & balance | `#technical` | Unit/sim tests; balance/formula doc. |
| Match end screen | `#ui` `#flow` | Victory/Defeat, stats, Play again / menu. |

### Backlog (future)

| Item | Tags |
|------|------|
| Multiplayer (PeerJS, host authority, sync) | `#multiplayer` `#technical` |
| Lobby: Host/Join, QR, room ID, connection state | `#lobby` `#qr` `#multiplayer` |
| Draft/ban, replay, matchmaking, login | Out of MVP |

---

## Backlog by category

| Category | Items |
|----------|--------|
| **Structures** | Barracks destroyable + mega-creep |
| **World** | Neutral camp spawns, leash, respawn, rewards |
| **UX** | Minimap fog + dots; TP channel; drag-aim + double-tap |
| **AI** | Difficulty presets |
| **Quality** | Tests, balance doc, match end screen |
| **Multiplayer** | Lobby (QR/room), PeerJS, sync |

---

## Code reference

- **Run:** Open `index.html` in browser.
- **Core:** `js/main.js`, `state.js`, `scene.js`, `constants.js`.
- **Gameplay:** `heroes.js`, `hero-models.js`, `skills.js`, `combat.js`, `creeps.js`, `towers.js`, `items.js`, `ai.js`.
- **Player:** `controls.js`, `hud.js`, `map.js`, `audio.js`, `particles.js`, `animations.js`.
- **Content:** Heroes/skills in `constants.js` + `hero-models.js` + `skills.js`; items in `items.js`; map/towers/barracks/camps in `constants.js`.

---

*Update the Plan section as work completes. Keep tags consistent when adding new docs.*
