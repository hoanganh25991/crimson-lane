# Docs — SDLC Hub

**Purpose:** Single entry point for the Dota 1–like mobile game. Scope, specs, progress, and backlog live here.

**Stack:** Three.js · HTML/CSS/JS · Solo vs AI (future: WebRTC/PeerJS multiplayer).

---

## How to use this hub

| Step | Action |
|------|--------|
| **Scope** | Read [plan.md](plan.md) for MVP rules; [input.md](input.md) for original vision. |
| **Design** | [game-theme.md](game-theme.md) (look & feel), [dota1-heroes-detail.md](dota1-heroes-detail.md) (hero content). |
| **Build** | [main-menu.md](main-menu.md) (UI flow), [dota1-mobile-game-plan.md](dota1-mobile-game-plan.md) (phased roadmap). |
| **Track** | Plan section below — Done / Requirements Plan / Backlog. |

---

## Doc index

### Spec — requirements & rules

| Doc | Tags | Description |
|-----|------|-------------|
| [plan.md](plan.md) | `#mvp` `#requirements` `#technical` `#phases` | Master spec: MVP scope, technical appendix (map, heroes, items, AI, controls), phase checklist. **Primary source of truth.** |
| [input.md](input.md) | `#vision` `#multiplayer` `#mobile` | Original brief: Dota 1 feel, WebRTC/QR join, mobile controls. |

### Design — content & look

| Doc | Tags | Description |
|-----|------|-------------|
| [dota1-heroes-detail.md](dota1-heroes-detail.md) | `#content` `#heroes` `#skills` `#art` | All 5 heroes: geometry, animations, stats, Q/W/E/R skills. |
| [game-theme.md](game-theme.md) | `#art` `#ui` `#audio` `#ux` | Theme: colors, typography, 3D style, HUD, audio identity, announcer. |

### Implementation — roadmap & flow

| Doc | Tags | Description |
|-----|------|-------------|
| [dota1-mobile-game-plan.md](dota1-mobile-game-plan.md) | `#phases` `#multiplayer` `#lobby` `#qr` | Phased roadmap: lobby/QR, map, entities, heroes, combat, HUD, PeerJS sync, polish. |
| [main-menu.md](main-menu.md) | `#ui` `#flow` `#implemented` | Main menu, Play flow (side + team size), Settings, Hero Viewer, Lobby. |

---

## Tags quick reference

| Tag | Meaning |
|-----|---------|
| `#mvp` | In scope for minimum viable product |
| `#requirements` | Must-have rules and scope |
| `#technical` | Architecture, systems, contracts |
| `#phases` | Development phases / milestones |
| `#content` | Heroes, items, map data |
| `#heroes` `#skills` | Hero and ability design |
| `#art` `#ui` `#audio` `#ux` | Visual, UI, sound, interaction |
| `#multiplayer` `#lobby` `#qr` | Post-MVP: PeerJS, room ID, QR join |
| `#vision` | High-level product goal |
| `#implemented` | Describes shipped / verified feature |

---

## Plan (lifecycle)

### Done `#implemented`

Verified against code — these features are shipped and working.

| Area | What's in |
|------|-----------|
| **Engine** | Three.js scene, 100x100 map (terrain, 3 lanes, river, base pads), camera, game loop. |
| **Menu** | Main menu, Play (side + team size), Settings, Hero Viewer (3D preview, animations, stats, level slider), Lobby, hero pick → start. |
| **Heroes** | 5 heroes with 3D models, stats, Q/W/E/R skills: Lich, Sniper, Dragon Knight, Shadow Fiend, Windrunner. |
| **Combat** | Melee/ranged attacks, projectiles, physical/magic/pure damage, armor, lifesteal, death, respawn timer. |
| **Creeps** | Lane creeps (melee + ranged), waypoints, last hit, deny, XP, gold. |
| **Neutral camps** | 6 camps, tiered units, leash radius, respawn timer, gold/XP rewards. |
| **Structures** | 18 towers (tier 1–4), 6 barracks (destroyable, HP, death → mega-creep upgrade), 2 Ancients (win condition). |
| **Items** | 13 items (6 basic, 6 upgrade, TP Scroll), recipes, passives, actives (Blink, Teleport, Mana Restore, Void Burst), shop, 6-slot inventory. |
| **HUD** | Top bar (portraits, HP, time, gold), hero bars (HP/MP/XP/level/KDA), skill bar (Q/W/E/R, cooldowns, mana), attack button, inventory, shop button, minimap (click-to-pan), announcer (First Blood, Kill Streak, Barracks Fallen, etc.). |
| **Match end** | Victory / Defeat screen on Ancient destruction. |
| **Controls** | Desktop (arrow keys, click move/attack, Q/W/E/R, Space stop, scroll zoom, B shop). Mobile (joystick, attack button, skill buttons). |
| **AI** | Hero bots (lane march, fight, retreat, fountain regen, skill casting, item buying). Creep AI (lane pathing, target priority). |
| **Audio** | 18 SFX (hit, ranged, magic, death, levelup, gold, spawn, respawn, tower hit/death, frost, shrapnel, chain frost, assassinate channel/fire, fire, windrun, buy). Procedural main theme. |

### Requirements Plan `#mvp`

Scoped and spec'd — ready to implement. Ordered by priority.

| # | Item | Tags | Spec detail |
|---|------|------|-------------|
| 1 | **Minimap — fog of war & entity dots** | `#ui` `#ux` | Fog of war overlay; show dots for towers, barracks, creeps, heroes; recenter button. |
| 2 | **Ability UX — drag-to-aim & double-tap** | `#ux` `#skills` | Drag-to-aim directional/area skills; double-tap for auto-target nearest; skill-specific VFX per [dota1-heroes-detail.md](dota1-heroes-detail.md). |
| 3 | **TP Scroll — full spec** | `#items` `#ux` | Interrupt channel on stun/death; restrict target to allied structures only (not just base). Currently teleports to base with 3s channel. |
| 4 | **Bot difficulty presets** | `#ai` | Easy / Normal / Hard with tunable aggression, cast accuracy, item buy priority, reaction time. |
| 5 | **Tests & balance** | `#technical` | Unit/simulation tests for combat formulas; balance doc for hero stats, item costs, XP/gold curves. |

### Backlog (future — not yet scoped)

| Item | Tags | Notes |
|------|------|-------|
| Multiplayer (PeerJS, host authority, sync) | `#multiplayer` `#technical` | Post-MVP. Requires network architecture design. |
| Lobby: Host/Join, QR code, room ID, connection state | `#lobby` `#qr` `#multiplayer` | Depends on multiplayer. |
| Draft/ban phase | `#multiplayer` `#content` | Out of MVP. |
| Replay system | `#technical` | Out of MVP. |
| Matchmaking & login | `#technical` `#multiplayer` | Out of MVP. |

---

## Code reference

- **Run:** Open `index.html` in browser (no build step).
- **Entry:** `js/main.js` (game loop, menu flow, lobby).
- **Core:** `js/state.js`, `js/scene.js`, `js/constants.js`.
- **Gameplay:** `js/heroes.js`, `js/hero-models.js`, `js/skills.js`, `js/combat.js`, `js/creeps.js`, `js/towers.js`, `js/items.js`, `js/ai.js`.
- **Player:** `js/controls.js`, `js/hud.js`, `js/map.js`, `js/audio.js`, `js/particles.js`, `js/animations.js`.
- **UI:** `js/hero-viewer.js`, `css/hero-viewer.css`.
- **Content:** Heroes/skills in `js/constants.js` + `js/hero-models.js` + `js/skills.js`; items in `js/items.js`; map/towers/barracks in `js/constants.js`.
- **Audio:** 18 WAV files in `sounds/`; generation script in `scripts/generate-dota-sfx.js`.

---

*Update the Plan section as work completes. Keep tags consistent when adding new docs.*
