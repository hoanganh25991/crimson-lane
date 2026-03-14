# DOTA 1 Mobile Browser Game — Original Implementation Plan

**Category:** Plan · **Tags:** #phases #multiplayer #lobby #qr

> **Status:** Historical reference. The actual build went solo-first (AI bots) rather than multiplayer-first. Map is 100x100 (not 128x128), all 5 heroes are implemented (not 2), code lives in `js/` modules (not flat root files). See [index.md](index.md) for current state.

> **Stack:** Three.js · Vanilla JS · HTML/CSS · PeerJS (WebRTC) · Web Audio API
> **Target:** Mobile-first multiplayer, Garena-style virtual controls
> **Goal:** Faithful Dota 1 experience playable in mobile browser, 2 players via QR code join

---

## 📦 Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| 3D Rendering | Three.js r128 | Map, heroes, effects, animations |
| Multiplayer | PeerJS (WebRTC) | P2P connection, no server needed |
| UI / HUD | HTML + CSS overlay | Joystick, skills, minimap, shop |
| Audio | Web Audio API | Synthesized SFX, no assets needed |
| Hosting | Single `.html` file | Open in browser, share via QR |

---

## 🗓️ Phase Breakdown

---

### PHASE 1 — Lobby System + QR Connection

**Goal:** Two players connect via QR code scan, no server required.

**Features:**
- Full-screen lobby screen with "Host Game" and "Join Game" options
- Host generates a random 6-character Room ID
- QR code generated client-side (via `qrcode.js` from CDN)
- Joiner scans QR → auto-fills Room ID → connects via PeerJS
- Manual code entry fallback for desktop
- Connection state UI: Waiting → Connected → Starting

**PeerJS flow:**
```
Host opens PeerJS with roomId as peer ID
Joiner connects to that peer ID
Both exchange: { type: 'HELLO', hero: 'lich'|'sniper' }
Host sends: { type: 'START' } when both ready
```

**Files:** `index.html` (single file, all in one)

---

### PHASE 2 — Map Generation

**Goal:** Faithful Dota 1 map rendered in Three.js isometric view.

**Camera:**
- Orthographic camera, 45° isometric angle
- Pan by dragging (touch) or WASD keys
- Pinch-to-zoom on mobile

**Terrain layers:**
- Base grass plane (green, tiled texture via canvas)
- Dirt lane paths (3 lanes: top, mid, bottom)
- River (diagonal blue plane across mid)
- Cliff/elevation edges (darker color boundary)

**Trees:**
- Instanced `BoxGeometry` (tall thin boxes) for performance
- ~300 trees clustered: jungle areas + map edges
- Clickable/targetable (block pathing)

**Map layout (128×128 units):**
```
(0,128) Scourge Base ─── Top Lane ─── Sentinel Base (128,128)
              │                                │
           Jungle        Mid Lane           Jungle
              │                                │
(0,0)  Scourge Base ─── Bot Lane ─── Sentinel Base (128,0)
```

**Waypoint system:**
- Each lane has 8–10 waypoints
- Creeps + towers reference waypoints for pathing

---

### PHASE 3 — Game Entities + Auto Spawn

**Goal:** All Dota 1 structures, auto-spawning creeps, neutral camps.

#### Towers (11 per team)
- 2 outer lane towers × 3 lanes = 6
- 2 inner lane towers × 3 lanes = 6 (shared: base towers)
- 1 Ancient per team
- Auto-attack nearest enemy in range (800 units)
- Animated HP bar above each tower (HTML overlay)
- Damage type: Pure (ignores armor)

#### Barracks (6 per team)
- 1 Melee + 1 Ranged barracks per lane
- When destroyed: enemy team spawns Mega Creeps that lane
- Visual: taller colored box with team color

#### Creeps (auto-spawn every 30 seconds)
- **Composition per wave:** 3 Melee + 1 Ranged + 1 Siege (every 5 waves)
- Melee creep: small cube, 550 HP, 85 attack, short range
- Ranged creep: smaller cube, 360 HP, 61 attack, fires projectile
- Siege creep: flat wide box, 700 HP, high tower damage
- Behavior: follow lane waypoints → attack enemies in range → resume march
- Last-hit gold: Melee 38–44g, Ranged 21–26g, Siege 100g

#### Neutral Camps (5 camps per jungle side)
- Spawn at game start, respawn 60s after cleared
- Small camp: 2 units, 50–120 HP each
- Medium camp: 3 units, 120–200 HP each
- Large camp: 4 units, 200–400 HP each
- Ancients (1 camp): 2 units, 1200–1400 HP (high gold reward)

#### Ancient (Win Condition)
- Center of each base
- Destroy enemy Ancient to win
- 4750 HP, regenerates when enemy barracks alive

---

### PHASE 4 — Hero System

**Goal:** 2 playable heroes with full Dota 1 skill sets.

#### Hero 1 — Lich (Scourge · Intelligence)
| Attribute | Value |
|---|---|
| HP | 454 (base) |
| Mana | 403 (base) |
| Attack Range | 600 |
| Move Speed | 295 |
| Primary Stat | Intelligence |

**Skills:**
- **Q — Frost Nova:** AoE slow + 100/175/250/325 magic damage, 25 mana, 6s CD
- **W — Dark Ritual:** Sacrifice allied creep → restore mana equal to creep HP
- **E — Chain Frost:** Bouncing projectile, 280 damage per bounce, up to 10 bounces
- **R — Frost Armor (Passive):** Enemies hitting Lich get slowed 40%, stacked aura

#### Hero 2 — Sniper (Sentinel · Agility)
| Attribute | Value |
|---|---|
| HP | 492 (base) |
| Mana | 195 (base) |
| Attack Range | 550 → 700 (with Aim) |
| Move Speed | 290 |
| Primary Stat | Agility |

**Skills:**
- **Q — Shrapnel:** AoE slow zone (4s), 15 DPS, 1 charge per 22s
- **W — Headshot (Passive):** 40% chance on attack: mini-stun + 30 bonus damage
- **E — Aim:** Increases attack range by 75/150/225/300 per level
- **R — Assassinate:** Channel 1.7s → fire long-range shot, 355/505/655 damage

**Shared hero systems:**
- HP and Mana bars (rendered as HTML overlay + 3D billboard)
- XP: 50×Level² curve, levels 1–25
- Gold: 100 base + kill/last-hit bonuses
- Attributes: Strength / Agility / Intelligence (each adds HP/armor/mana)
- Respawn timer: 5 + (Level × 4) seconds
- Death animation: hero sinks below ground, respawn teleport effect

---

### PHASE 5 — Combat System

**Goal:** Authentic Dota 1 combat feel.

**Auto-attack:**
- Click enemy → hero pathfinds to attack range → begins attack animation
- Attack speed based on Agility stat
- Swing/projectile → hit → damage calculation
- Miss chance: Base 5% (physical only)

**Damage formula:**
```
Physical Damage = (Base Attack + Bonus Attack) × (1 - Armor Reduction)
Armor Reduction = Armor × 0.06 / (1 + Armor × 0.06)
Magic Damage = Spell Power × (1 - Magic Resistance)
Magic Resistance default: 25%
```

**Status effects:**
- Stun: can't move, attack, or cast (unit stays in place)
- Slow: reduced move speed % (shown as blue particle)
- Silence: can't cast spells
- All effects show timer bar below hero portrait

**Projectile system:**
- Ranged attacks fire a moving sphere toward target
- Spell projectiles have unique colors (frost = cyan, sniper = yellow)
- Projectile speed varies by spell

**Gold and XP sharing:**
- Kill: full gold to killer + partial XP to nearby allies
- Assist: partial gold split
- Last hit creep: only hitter gets gold
- Deny: enemy gets 0 XP/gold from that creep

---

### PHASE 6 — Mobile HUD + Controls

**Goal:** Full Garena-style mobile control layout.

#### Screen Layout
```
┌──────────────────────────────────────────┐
│ [Mini]  [KDA: 0/0/0]  [Gold: 603]  [🕐] │  ← Top HUD
│  map                                      │
│                                           │
│          3D GAME VIEWPORT                 │
│                                           │
│  ◉ Joystick    [Stop] [Atk]  [Q][W][E]   │  ← Bottom HUD
│                              [R] [Items]  │
└──────────────────────────────────────────┘
```

#### Virtual Joystick (Left side)
- Fixed position bottom-left
- Outer ring: 80px radius circle (semi-transparent)
- Inner thumb: 30px radius draggable circle
- Touch start → locks joystick origin
- Touch move → calculates direction + magnitude
- Magnitude > 10px: hero starts moving in that direction
- Release → hero stops
- Built with raw `touchstart` / `touchmove` / `touchend` events

#### Skill Buttons (Bottom-right)
```
        [E]
    [W]     [Q]
        [R]
```
- Diamond layout, 60px each button
- Tap to cast (instant)
- For targeted spells: button glows → tap on map/enemy to aim
- Cooldown: radial sweep animation (CSS conic-gradient)
- Insufficient mana: button desaturates + shake animation
- Level indicator dots below each button (1–4 dots)

#### Item Slots (Above skills)
- 6 slots arranged 3×2 grid
- Tap active item to use
- Long press to show item info tooltip
- Gold counter top-center updates in real-time

#### Minimap (Top-left, 100×100px)
- 2D `<canvas>` rendered each frame
- Dots: green (allied heroes), red (enemy heroes), yellow (towers), white (creeps)
- Fog of war: darkened areas outside vision range
- Tap minimap → camera pans to that map location

#### Shop Panel (Swipe up from bottom or tap gold icon)
- Slides up from bottom of screen
- Tabs: Basic / Weapons / Armor / Accessories / Recipes
- Only usable within 900 units of own Fountain
- Item grid with cost, tap to buy
- Insufficient gold: item grayed out

#### Camera Controls
- Two-finger drag to pan camera
- Pinch to zoom (limited range)
- Double-tap minimap: jump camera to own hero
- Auto-follow toggle button (top-right)

---

### PHASE 7 — Multiplayer Synchronization

**Goal:** Smooth 2-player gameplay over PeerJS WebRTC.

**Architecture: Host-Authoritative**
- Host runs: all NPC AI (creeps, towers, neutrals, spawning)
- Host broadcasts entity snapshots at 10Hz
- Each client runs prediction for their own hero only
- On snapshot arrival: reconcile position if drift > 2 units

**Message types (JSON over DataChannel):**

```json
// Sent every 50ms (20Hz) — own hero input
{ "type": "INPUT", "x": 0.7, "z": -0.3, "action": "move" }

// Event messages (immediate)
{ "type": "CAST", "skill": "Q", "targetX": 45, "targetZ": 32 }
{ "type": "ATTACK", "targetId": "creep_023" }
{ "type": "ITEM_USE", "slot": 2 }

// Host → both clients (10Hz)
{ "type": "SNAPSHOT", "tick": 1042, "entities": [...] }

// Game events (host → both)
{ "type": "HERO_DIED", "id": "hero_0", "killerId": "hero_1", "gold": 200 }
{ "type": "TOWER_FELL", "id": "tower_sentinel_top_1" }
{ "type": "CREEP_SPAWNED", "wave": 12, "entities": [...] }
{ "type": "GAME_OVER", "winner": "scourge" }
```

**Latency handling:**
- Client-side prediction for own movement
- Dead reckoning for remote hero (extrapolate last velocity)
- Spell effects play immediately on caster, reconcile on snapshot
- Disconnect: 5s grace period, then "Player disconnected" screen

---

### PHASE 8 — Game Feel + Polish

**Goal:** Sound, effects, and juice that make it feel like Dota 1.

#### Audio (Web Audio API — no files needed)
- Synthesized hit sounds: short noise burst + pitch shift
- Spell sounds: sine wave with envelope (frost = low gliss, sniper = sharp crack)
- Tower attack: metallic click
- Death: descending tone
- Announcer texts (no audio): rendered as big on-screen text

#### Visual Effects
- Hit sparks: 5–8 tiny colored particles burst from impact point
- Spell areas: colored transparent cylinder (AoE zones)
- Chain Frost: cyan line drawn between bounce targets
- Assassinate channel: glowing crosshair + beam on cast
- Floating damage numbers: colored text floating up (+125 magic, -88 physical)
- Heal/mana restore: green/blue rising particles

#### Announcer Text (center screen)
- "FIRST BLOOD!" — red, large
- "DOUBLE KILL!" — orange
- "TOWER DESTROYED" — yellow + side
- "VICTORY / DEFEAT" — full-screen overlay

#### Ambient Details
- Day/night cycle: directional light intensity cycles every 4 minutes
- Night: reduced vision radius (800 → 400), darker sky
- Fountain: gentle blue glow + HP/mana regen when hero is near base

---

## 🔄 Implementation Order

| # | Phase | File/Module | Complexity |
|---|---|---|---|
| 1 | Lobby + QR + PeerJS connect | `index.html` lobby section | ⭐⭐ |
| 2 | Three.js scene + isometric camera | `game.js` core | ⭐⭐ |
| 3 | Map generation (terrain, trees, lanes, river) | `map.js` | ⭐⭐⭐ |
| 4 | Hero entity + joystick movement | `hero.js`, `controls.js` | ⭐⭐⭐ |
| 5 | Towers + structure HP | `structures.js` | ⭐⭐ |
| 6 | Creep spawn + lane AI + pathfinding | `creeps.js` | ⭐⭐⭐⭐ |
| 7 | Auto-attack combat + projectiles | `combat.js` | ⭐⭐⭐ |
| 8 | Hero skills (all 8 abilities) | `skills.js` | ⭐⭐⭐⭐ |
| 9 | HUD + minimap + shop | `hud.js` | ⭐⭐⭐ |
| 10 | Multiplayer sync (host authority) | `network.js` | ⭐⭐⭐⭐ |
| 11 | Audio + VFX polish | `effects.js` | ⭐⭐ |
| 12 | Full playtesting + bug fix pass | All | ⭐⭐⭐ |

---

## 🏁 Milestones

| Milestone | Phases Complete | What You Can Do |
|---|---|---|
| **M1 — Connected** | 1 | Two phones connect via QR |
| **M2 — Walking** | 1–4 | Both players move heroes on map |
| **M3 — Fight!** | 1–7 | Auto-attack, creeps, towers work |
| **M4 — Full Game** | 1–9 | Skills, shop, HUD, win condition |
| **M5 — Ship it** | 1–12 | Polished, audio, effects complete |

---

## 📁 Final File Structure

```
dota1-mobile/
├── index.html          ← Entry, lobby UI, HUD layout
├── game.js             ← Main loop, scene setup, camera
├── map.js              ← Terrain, trees, waypoints
├── hero.js             ← Hero stats, movement, level/XP/gold
├── skills.js           ← All 8 skills, targeting, cooldowns
├── combat.js           ← Auto-attack, projectiles, damage calc
├── creeps.js           ← Spawn system, lane AI, neutrals
├── structures.js       ← Towers, barracks, ancient
├── controls.js         ← Virtual joystick, touch input
├── hud.js              ← Minimap, shop, skill buttons, bars
├── network.js          ← PeerJS, message types, sync
└── effects.js          ← VFX, audio, announcer, particles
```

> **Note:** All phases will be delivered as a working single `index.html` file first,  
> then refactored into modules. Each phase is independently testable in the browser.

---

*Ready to begin with Phase 1 — Lobby + QR + PeerJS Connection.*
