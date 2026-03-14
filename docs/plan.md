# Mobile Dota-Inspired Web Game Spec for Claude Code

**Category:** Spec · **Tags:** #mvp #requirements #technical #phases

This file is now written in **Option B** format:

1. **Master Prompt** — short instruction for Claude Code
2. **Technical Appendix** — detailed indexed execution contract

Use the **Master Prompt** as the main instruction.
Use the **Technical Appendix** as the detailed source of truth.

---

# Part A — Master Prompt

## Claude Code Master Prompt

Build a **mobile-first browser MOBA inspired by Dota 1** using **HTML, CSS, JavaScript, and Three.js**.

The game must be playable **end-to-end in the browser** with **solo play against AI bots first**, while being architected so **future multiplayer** can be added later using **WebRTC / PeerJS-style networking**.

This is **not** a copyrighted clone. Use **original assets, original stylized models, and original UI**, while preserving the feel of classic three-lane Warcraft/Dota-style gameplay.

## Product goals

- Create a **playable MOBA prototype** close in spirit to Dota 1
- Prioritize **mobile controls and mobile readability**
- Still support **desktop mouse + keyboard play**
- Keep the game loop deep enough to feel like a real MOBA:
  - laning
  - last hit
  - deny
  - XP gain
  - gold gain
  - leveling
  - items
  - tower pressure
  - barracks progression
  - ancient destruction

## Fixed MVP scope

Implement these in MVP:

- 1 playable map with:
  - 3 lanes
  - river
  - jungle camps
  - towers
  - barracks
  - ancients
- 5 playable heroes based on `hero-viewer.html`:
  - Lich
  - Sniper
  - Dragon Knight
  - Shadow Fiend
  - Windrunner
- 13 items total (12 original + TP Scroll)
- Item recipes including 2-part and 3-part combinations
- Some item active skills
- Solo mode with configurable:
  - team size
  - bot count
- Hero select screen
- Minimap MVP
- Mobile HUD with:
  - left joystick
  - attack button
  - Q/W/E/R buttons
  - visible item active buttons
- Desktop controls in parallel
- AI bots for heroes and creeps

## Non-negotiable UX rules

- Mobile-first UI similar in clarity to Garena-style mobile MOBA controls
- Camera auto-follows hero
- Player can drag/pan to inspect nearby area
- Double tap skill = auto target
- Drag skill = aim and release to cast
- Minimap is visible in MVP
- TP uses **Teleport Scroll item**, not universal recall

## Visual direction

- Clean modern mobile fantasy style
- Original models only
- Do **not** use copyrighted Dota assets
- Do **not** use pure cube placeholder art as the core approach
- Start with **custom in-code stylized geometry** similar in spirit to `hero-viewer.html`
- Models must be readable, performant, and visually consistent

## Technical direction

- Use modular architecture
- Separate simulation logic from rendering logic
- Keep systems future-ready for multiplayer
- Use data-driven definitions for heroes, abilities, and items where possible
- Keep each development phase runnable and testable

## Performance targets

- 60 FPS desktop target
- 30+ FPS mid-range mobile target
- Mobile-friendly rendering budgets

## Autonomous execution rules

- Do not stop for unnecessary questions
- If a detail is ambiguous, choose the simplest Dota-like solution that preserves mobile usability and performance
- Prefer complete playable loops over isolated tech demos
- Maintain documentation while building
- Each phase must end with a working playable increment

## Deliverables

Produce:

1. Full source code
2. Working local playable build
3. Documentation for:
   - setup
   - architecture
   - hero definitions
   - abilities
   - items
   - future multiplayer integration path

---

# Part B — Technical Appendix

## 1. Executive Summary

Build a browser-based, mobile-first, Three.js-powered MOBA inspired by Dota 1.
The MVP must support real gameplay flow, not only a visual demo.
It should be playable solo with AI bots, include lane and jungle systems, and provide enough depth to feel like a proper MOBA prototype.

---

## 2. Product Vision

The project aims to recreate the **strategic feeling** of Dota 1 with a **mobile-friendly interaction model**.

The game should feel like:
- classic three-lane Warcraft custom map structure
- modern mobile readability
- streamlined controls for touch screens
- original 3D visuals with personality

The project should be developed so that:
- solo play works first
- bot logic is strong enough for repeated testing
- future multiplayer can be integrated without rewriting core systems

---

## 3. Non-Negotiable Decisions

These are fixed and must not be changed by Claude Code:

1. Platform:
   - browser only
   - mobile-first
   - desktop supported

2. Tech stack:
   - HTML
   - CSS
   - JavaScript
   - Three.js

3. Core mode:
   - solo vs AI first
   - future multiplayer planned later

4. Match structure:
   - designed for 5v5
   - solo mode may allow smaller team sizes
   - bots fill missing slots

5. Hero roster for MVP:
   - Lich
   - Sniper
   - Dragon Knight
   - Shadow Fiend
   - Windrunner

6. Control philosophy:
   - mobile-first
   - drag to aim
   - double tap to auto target
   - direct visible buttons

7. Required core systems:
   - last hit
   - deny
   - XP
   - gold
   - level up
   - death and respawn
   - tower progression
   - barracks progression
   - jungle camps
   - item progression

8. Visual direction:
   - custom in-code stylized geometry first
   - original art only
   - use `hero-viewer.html` as the primary style reference for hero personality and readability

---

## 4. MVP Scope

### 4.1 Included in MVP

- Main menu
- Solo match setup menu
- Hero selection screen
- Match start flow
- Match end flow
- Restart flow
- One full map
- 3 lanes
- Jungle camps
- River
- Trees as map geometry / blockers / visual identity
- Towers
- Barracks
- Ancient
- 5 heroes
- Hero abilities
- 12 items
- Item recipes
- Item active buttons on mobile HUD
- Creep spawning
- Neutral creeps
- Hero bots
- Minimap MVP
- Desktop and mobile controls

### 4.2 Excluded from MVP

- Real multiplayer gameplay
- Matchmaking backend
- Login/account system
- Monetization systems
- Cosmetics store
- Ranked mode
- Draft / ban phase
- Replay system
- Full tree destruction / advanced tree interaction

---

## 5. Player Experience Goals

The user should feel:
- strong hero identity
- responsive skill casting
- readable map pressure
- meaningful progression through gold, XP, and items
- satisfying lane and jungle loop
- enjoyable touch controls on mobile

The player should be able to understand:
- where to move
- what to attack
- what each skill does
- where towers and objectives are
- how to buy items
- where the current battle is happening via minimap

---

## 6. Core Match Rules

### 6.1 Match objective

Destroy the enemy Ancient.

### 6.2 Team setup

- Game designed for 5v5
- Solo setup may allow:
  - 1v1
  - 2v2
  - 3v3
  - 5v5
- Empty hero slots are filled with bots

### 6.3 Match duration target

- MVP target match time: 10 to 20 minutes

---

## 7. Map and World Rules

### 7.1 Map layout

The map is inspired by classic three-lane Dota structure:

- Top lane
- Mid lane
- Bottom lane
- River crossing mid area
- Jungle on both sides
- Team bases at opposite corners

### 7.2 Map size

Suggested world size:
- about 600 x 600 gameplay units

### 7.3 Environment elements

- terrain mesh
- lane paths
- cliffs / elevation suggestion where useful
- trees
- river material
- jungle camp clearings
- base zones

### 7.4 Tree rule for MVP

- Trees are static blockers and visual elements in MVP
- Advanced tree interaction is deferred

---

## 8. Camera and Minimap Rules

### 8.1 Camera

- isometric / angled top-down
- hero auto-follow by default
- limited zoom only
- no free rotation in MVP
- player can drag/pan on mobile and desktop to inspect nearby area
- camera returns to hero focus after recenter input or short idle timeout

### 8.2 Minimap MVP

Required in MVP.

Must display:
- allied heroes
- enemy heroes when visible
- creeps
- towers
- barracks
- ancient
- jungle camp positions
- player position

MVP minimap interaction:
- visible and readable
- at minimum support display + recenter interaction

---

## 9. Hero Roster

The 5 heroes are based on `hero-viewer.html` and should be implemented as original game heroes with those same identities.

### 9.1 Lich
- Role: Intelligence support / nuker
- Identity: frost caster, mana control, AoE slow, chain magic

### 9.2 Sniper
- Role: Agility ranged carry
- Identity: long range damage, zoning, single-target finishing

### 9.3 Dragon Knight
- Role: Strength durable frontliner
- Identity: stun, breath attack, sustained survivability, dragon form

### 9.4 Shadow Fiend
- Role: Agility snowball caster / damage carry
- Identity: soul scaling, burst raze pattern, presence aura, explosive ultimate

### 9.5 Windrunner
- Role: Agility utility ranged hero
- Identity: skillshot utility, movement burst, attack focus ultimate

### 9.6 Hero production rule

For each hero implement:
- custom stylized in-code geometry model
- idle animation
- walk animation
- attack animation
- cast animation
- death animation
- readable VFX
- HUD iconography

---

## 10. Hero Stats and Progression Rules

### 10.1 Core attributes

- Strength
- Agility
- Intelligence

### 10.2 Derived stats

- HP
- HP regen
- Mana
- Mana regen
- Attack damage
- Attack speed
- Armor
- Magic resist
- Move speed
- Attack range

### 10.3 Progression

- Heroes gain XP from nearby kills
- Heroes level up during the match
- Skill points unlock / improve abilities
- Gold is used for item progression
- Heroes are not static

### 10.4 Suggested formula policy

Claude Code may tune numbers, but formulas must be consistent and documented.
Use simple, readable MOBA-style formulas instead of arbitrary magic numbers scattered across files.

### 10.5 Detailed hero implementation requirement

Each MVP hero must be fully specified in code with:
- base attributes
- per-level attribute growth
- attack range
- attack backswing / wind-up timing
- attack projectile or melee hit logic
- move speed
- turn behavior or facing logic if used
- four abilities with level scaling tables
- animation state map
- bot usage priorities

At least one shared hero data format should exist, for example:

```js
{
  id: 'lich',
  role: 'support-nuker',
  primaryAttribute: 'intelligence',
  baseStats: {},
  growthStats: {},
  attackProfile: {},
  abilities: ['frostNova', 'darkRitual', 'chainFrost', 'frostArmor'],
  botProfile: {},
  modelProfile: {}
}
```

This is required so Claude Code does not hardcode hero logic separately in many places.

---

## 11. Ability System Rules

Each hero has:
- Q
- W
- E
- R

Ability system must support:
- target skills
- area skills
- skillshots
- passive skills
- cooldown
- mana cost
- cast time if needed
- animation trigger
- projectile support
- status effects
- scaling values by level

Status effects supported in MVP:
- stun
- slow
- silence
- knockback

### 11.1 Ability data model detail

Each ability should be defined through a common structure that can support both hero spells and item actives.

Suggested shape:

```js
{
  id: 'frostNova',
  slot: 'Q',
  castType: 'area-target',
  targetRule: 'enemy-unit-or-ground',
  damageType: 'magical',
  manaCostByLevel: [120,130,145,160],
  cooldownByLevel: [7,6,5,4],
  castRangeByLevel: [600,600,600,600],
  radiusByLevel: [250,275,300,325],
  effectValuesByLevel: {
    damage: [75,150,225,300],
    slowPct: [20,30,40,50],
    slowDuration: [4,4,4,4]
  },
  animationKey: 'castQ',
  vfxKey: 'frostNova',
  aiHints: {
    useWhenEnemiesInRadiusAtLeast: 1,
    minManaPct: 0.2
  }
}
```

### 11.2 Ability execution stages

Each cast should run through a clear pipeline:
1. input accepted
2. target validation
3. cast start
4. cast animation / wind-up
5. mana spend
6. cooldown start
7. projectile or instant effect creation
8. hit resolution
9. damage / status application
10. combat log / VFX / audio update

### 11.3 Ability categories required in MVP

The overall 5-hero roster must include examples of:
- single target nuke
- projectile skillshot
- line ability
- area burst
- buff
- passive aura
- transformation
- channel or charge-like cast
- active movement or evasive effect

This avoids a shallow ability roster.

---

## 12. Combat Rules

### 12.1 Damage types

- Physical
- Magical
- Pure

### 12.2 Combat loop

- acquire target
- move into range if needed
- attack or cast
- apply mitigation
- apply damage
- apply status effects
- check death
- handle gold / XP reward
- handle respawn flow

### 12.3 Attack rules

- ranged and melee attacks supported
- projectile travel for ranged basic attacks where appropriate
- attack wind-up and recovery timing supported

### 12.4 Required formula detail

Claude Code must define and document exact formulas for MVP. If not specified elsewhere, use simple MOBA-like formulas.

Required formulas:
- HP calculation
- Mana calculation
- armor mitigation
- attack speed scaling
- move speed caps
- respawn duration
- hero kill reward scaling

Suggested default formulas if no balancing doc exists:

```text
HP = baseHP + strength * hpPerStrength + levelGrowthHP
Mana = baseMana + intelligence * manaPerIntelligence + levelGrowthMana
PhysicalDamageTakenMultiplier = 100 / (100 + armor * 6)   // or another single consistent formula
AttackInterval = baseAttackTime / attackSpeedMultiplier
MoveSpeedClamp = min 100 / max 550
RespawnTime = 5 + level * 2
```

These do not need to match original Dota exactly, but they must be consistent, centralized, and documented.

### 12.5 Combat events

The combat system should emit structured events so UI, VFX, logs, and future networking do not depend on hidden side effects.

Examples:
- damageApplied
- healApplied
- statusApplied
- unitDied
- goldGranted
- xpGranted
- projectileSpawned

---

## 13. Lane, Creep, and Neutral Rules

### 13.1 Lane creeps

Spawn every 30 seconds.

Each lane wave:
- 3 melee creeps
- 1 ranged creep

### 13.2 Lane creep AI

- follow lane spline/path
- acquire enemy creeps first
- then enemy heroes if attacked / in valid combat state
- then towers
- then barracks
- then ancient

### 13.3 Neutral camps

Required in MVP.

Neutral rules:
- camp spawn locations in jungle
- leash back if pulled too far
- respawn timer after full camp death
- grants gold and XP

### 13.4 Last hit and deny

Required in MVP.

- last hit grants gold to the last hitter
- nearby heroes still gain XP per rule set
- allied units can be denied under the appropriate HP threshold
- deny reduces enemy benefit

Implementation note:
If exact Dota values are not specified, use a simplified but clearly documented deny/XP/gold rule that preserves the lane skill dynamic.

### 13.5 Detailed deny and XP rule for MVP

Use an explicit rule set so Claude Code does not invent inconsistent lane behavior.

Recommended MVP rule:
- last hit on enemy creep: gold to last hitter, XP to nearby allied heroes
- deny on allied creep below threshold: no enemy gold, reduced enemy XP
- deny threshold: e.g. 50% HP or lower
- neutral last hit: gold to killer, XP to nearby allied heroes

If needed, Claude Code may simplify split calculations, but it must preserve these principles:
- last hitting matters
- denying matters
- being near lane still matters for XP

### 13.6 Lane pathing detail

Each lane must use explicit path nodes or splines.

Required lane data:
- spawn point
- ordered path nodes
- tower checkpoints
- barracks checkpoint
- ancient checkpoint

This prevents fragile lane movement logic.

### 13.7 Jungle camp detail

Each neutral camp should define:
- camp id
- camp center
- spawn box or spawn radius
- unit composition
- leash radius
- respawn timer
- difficulty tier

At least 4–6 neutral camps should exist in MVP so jungle route behavior is meaningful.

---

## 14. Tower, Barracks, and Ancient Rules

### 14.1 Towers

Each lane has:
- Tier 1
- Tier 2
- Tier 3

Tower behavior:
- auto attack enemies in range
- prioritize creeps by default
- switch aggro appropriately when enemy hero attacks allied hero under tower rules

### 14.2 Barracks

Each lane contains barracks structures.

Rules:
- destroying barracks upgrades allied lane creeps on that lane
- barracks progression should matter strategically

### 14.3 Ancient

- final objective
- match ends when destroyed

---

## 15. Economy, Death, and Respawn Rules

### 15.1 Gold

Sources:
- creep last hits
- neutral camp kills
- hero kills
- tower / objective rewards
- optional passive trickle if needed for pacing

### 15.2 XP

Sources:
- nearby creep deaths
- hero kills
- neutral kills
- shared/team rules may be simplified for MVP but must be documented

### 15.3 Death

Must include:
- death animation/state
- respawn timer
- respawn location
- kill reward logic

### 15.4 Respawn

- respawn at base
- respawn timer scales with level or game phase

### 15.5 Teleport

- no universal recall button in final logic
- use Teleport Scroll item
- teleport is Dota-like and should target allied structures in MVP

### 15.6 Required economy detail

Claude Code must explicitly define:
- starting gold
- passive gold rate if any
- creep gold ranges
- hero kill gold logic
- objective reward logic
- buyback rule: omit for MVP unless later added
- death gold loss rule: simplify or omit, but document the decision

### 15.7 Teleport Scroll behavior detail

TP Scroll MVP behavior:
- purchasable consumable or stack-based utility item
- targets allied towers and allied base structures
- requires cast time / channel
- interrupted by stun or death
- places hero near target structure at a valid spawn offset
- has cooldown or item lockout to prevent spam

---

## 16. Item System

### 16.1 Inventory

- 6 inventory slots

### 16.2 MVP item count

- 13 items in MVP (12 original + TP Scroll consumable)

### 16.3 Item requirements

- support passive stat items
- support active items
- support 2-part combinations
- support 3-part combinations
- support item recipes / upgrade paths

### 16.4 Suggested item categories

- movement
- damage
- armor
- mana
- sustain
- utility

### 16.5 Mobile item UX

- item active buttons are directly available
- no hidden complex nested UI for essential active items

### 16.6 Required 12-item MVP table

Claude Code must implement a fixed starter set of 12 items. A recommended MVP structure is:

Components:
1. Boots of Speed
2. Iron Branch
3. Blades of Attack
4. Ring of Protection
5. Magic Charm
6. Vitality Gem

Upgrades:
7. Power Boots
8. Arcane Boots
9. Blink Dagger style item
10. Lifesteal blade item
11. Armor shield aura item
12. Mana burst / AoE active item

This can be renamed to original item names, but the design coverage should remain:
- movement upgrade
- mana item
- survivability item
- damage item
- mobility active
- offensive active

### 16.7 Item data detail

Each item should include:
- id
- name
- cost
- component ids
- stat bonuses
- active ability id if any
- passive behavior id if any
- icon key
- shop category

Suggested shape:

```js
{
  id: 'powerBoots',
  name: 'Power Boots',
  cost: 1400,
  components: ['bootsOfSpeed', 'vitalityGem'],
  bonuses: { moveSpeed: 45, attackSpeed: 20 },
  activeAbilityId: null,
  passiveId: 'bootsPassive',
  shopCategory: 'movement'
}
```

---

## 17. Controls and Input Rules

### 17.1 Mobile controls

Left side:
- virtual joystick for movement

Right side:
- attack
- Q
- W
- E
- R
- item actives
- shop access when allowed
- TP item use

### 17.2 Skill casting behavior

- tap skill: select / quick cast behavior if appropriate
- drag skill: directional or area aiming
- release: cast
- double tap skill: auto-target nearest or best valid target

### 17.3 Desktop controls

Support desktop in parallel:
- mouse movement / targeting
- keyboard hotkeys
- standard MOBA-like usability

### 17.4 Mobile HUD layout detail

MVP HUD should visually allocate:
- bottom-left: joystick
- bottom-right: attack + Q/W/E/R + item active buttons
- top-left or top-center: hero vitals and level
- top-right: minimap
- side or bottom panel: inventory and shop access

HUD must be readable on small phone screens in portrait-compatible layout planning, but active gameplay is expected in landscape mode.

### 17.5 Input abstraction detail

All controls should map into a shared command layer such as:
- moveCommand
- attackCommand
- castAbilityCommand
- useItemCommand
- cameraPanCommand

This is required so mobile, desktop, and future multiplayer input can share the same downstream simulation path.

---

## 18. AI Rules

### 18.1 AI architecture

Use finite state machine or equivalent structured behavior model.

### 18.2 Hero bot states

- Idle
- Move
- Attack
- Retreat
- Cast
- Farm
- Push
- Defend
- Buy

### 18.3 Hero bot priorities

- assign lane or role at match start
- farm lane
- attempt last hits
- attempt denies
- retreat on low HP
- cast abilities using simple heuristics
- avoid obvious tower dives unless advantage is high
- buy items automatically using a build path
- return to lane or jungle after respawn

### 18.4 Creep AI

- deterministic and lightweight
- lane-following with combat interruption

### 18.5 Bot difficulty detail

For MVP, implement at least one stable difficulty profile.
Optional later presets:
- Easy
- Normal
- Hard

If multiple presets are added, only tune decision timing and aggression, not entirely separate logic trees.

### 18.6 Bot purchase and skill-up detail

Each hero bot requires:
- skill leveling order
- item build order
- lane preference
- retreat thresholds
- mana usage thresholds
- engage conditions

This data should exist in hero bot profiles, not hidden in procedural one-off code.

---

## 19. Art Direction and Asset Rules

### 19.1 Style goals

- clean mobile fantasy
- stylized 3D
- readable silhouettes
- clear team readability
- visually satisfying skill effects

### 19.2 Reference rule

Use `hero-viewer.html` as reference for:
- silhouette quality
- personality
- weapon readability
- stylized geometry approach
- ability flavor

### 19.3 Asset constraints

- original work only
- no copyrighted Dota models, icons, textures, sounds, or UI

### 19.4 Geometry targets

Keep mobile-friendly model budgets.
Exact triangle counts may vary, but heroes should be expressive without becoming heavy.

---

## 20. Technical Architecture

### 20.1 Architectural approach

Use a modular game architecture with strong separation between:
- rendering
- simulation
- input
- UI
- AI
- content data

### 20.2 Core modules

Recommended module groups:
- engine
- game state
- map systems
- hero systems
- ability systems
- combat systems
- AI systems
- UI systems
- asset / model builders

### 20.3 Data orientation

Use data-driven configuration for:
- hero definitions
- skill definitions
- item definitions
- creep stats
- tower stats
- bot behavior parameters

### 20.4 Multiplayer-ready boundaries

Prepare clear abstraction boundaries for future networking:
- input commands
- entity state snapshots
- game simulation tick
- player controller abstraction

Do not implement real multiplayer in MVP.

### 20.5 Internal system contracts

Claude Code should define clean contracts between systems. At minimum:
- Render layer reads world state but does not own gameplay rules
- Simulation tick updates all gameplay state
- Input system creates commands, not direct world mutation where possible
- AI produces commands similarly to player input
- UI reads state and dispatches commands

### 20.6 Save debugging and balancing hooks

The build should include lightweight developer tools or toggles for:
- spawning units
- forcing gold
- forcing level up
- toggling cooldowns
- inspecting entity stats

These are valuable for autonomous development and regression testing.

---

## 21. File and Folder Expectations

Suggested structure:

```text
/src
  /engine
  /game
  /ai
  /heroes
  /abilities
  /items
  /ui
  /map
  /systems
  /data
  /tests

/assets
  /audio
  /textures

/docs
```

If the repository already has a structure, Claude Code should adapt while preserving modularity.

---

## 22. Development Phases and Acceptance Criteria

### Phase 1 — Project foundation

Deliver:
- project setup
- Three.js scene
- terrain
- camera
- base game loop

Acceptance:
- app runs locally
- camera works on mobile and desktop
- terrain renders reliably

### Phase 2 — Hero controller and presentation

Deliver:
- one controlled hero
- movement
- animations
- follow camera

Acceptance:
- player can move hero on mobile and desktop
- hero animation states transition correctly

### Phase 3 — Core combat

Deliver:
- basic attack
- health
- damage
- death

Acceptance:
- units can fight and die correctly

### Phase 4 — Ability system

Deliver:
- Q/W/E/R support
- cooldowns
- targeting
- projectiles
- status effects

Acceptance:
- at least one hero complete end-to-end with all abilities

### Phase 5 — Lane and jungle systems

Deliver:
- lane creep spawning
- lane pathing
- neutral camps
- XP/gold gain
- last hit and deny

Acceptance:
- laning loop is playable and understandable

### Phase 6 — Objective structures

Deliver:
- towers
- barracks
- ancient

Acceptance:
- match can be won by destroying objectives

### Phase 7 — Mobile-first HUD and minimap

Deliver:
- joystick
- skill buttons
- item buttons
- minimap
- hero status HUD

Acceptance:
- entire core match can be played on mobile controls

### Phase 8 — Bot hero AI

Deliver:
- bots can lane
- bots can farm
- bots can fight
- bots can buy items

Acceptance:
- solo match is meaningfully playable against bots

### Phase 9 — Full MVP content

Deliver:
- all 5 heroes
- all 12 items
- hero select
- solo setup options

Acceptance:
- user can start a configurable solo game and finish a full match loop

Detailed completion expectation:
- all 5 heroes selectable
- all 12 items purchasable
- lane and jungle flow stable
- bots complete a full match without hard-locking
- TP Scroll usable
- deny and last hit functioning

### Phase 10 — Optimization and polish

Deliver:
- performance improvements
- cleanup
- docs
- tests

Acceptance:
- stable local build
- acceptable mobile frame rate

Detailed optimization checklist:
- avoid unnecessary per-frame allocations
- use instancing where appropriate
- reduce draw calls for creeps and repeated structures
- ensure HUD remains responsive under combat load
- ensure mobile touch latency remains acceptable

---

## 23. Testing Requirements

Claude Code must include:
- unit tests
- simulation tests where practical
- manual verification checklist

Minimum test coverage should include:
- damage calculation
- cooldown logic
- XP and level logic
- last hit logic
- deny logic
- bot state transitions
- tower aggro logic
- item combination logic

---

## 24. Documentation Requirements

Produce docs for:
- setup
- run/build commands
- architecture overview
- hero data format
- ability data format
- item data format
- adding new heroes
- adding new abilities
- future multiplayer path

Also produce:
- balancing assumptions for MVP
- list of known simplifications compared to full Dota
- testing checklist for mobile controls
- content index of heroes, items, structures, and neutral camps

---

## 25. Claude Code Autonomous Execution Policy

When unclear, Claude Code must follow these rules:

1. Prefer a working full loop over partial isolated polish.
2. Choose the simplest Dota-like design that keeps strategic depth.
3. Preserve mobile usability first.
4. Keep rendering and simulation separate.
5. Keep all content data structured and reusable.
6. Do not pause unless a missing requirement blocks architecture.
7. Maintain original art direction and avoid copyrighted content.
8. End each phase with a runnable build.

---

## 26. Definition of Done

This spec is considered fulfilled when the project provides:

- a playable browser MOBA prototype
- solo play with bots
- configurable match setup for solo mode
- hero select MVP
- minimap MVP
- 5 heroes
- 12 items
- lane + jungle gameplay
- towers + barracks + ancient
- last hit + deny + XP + gold + leveling
- mobile-first controls
- desktop controls
- documentation and tests

---

## 27. Final Note

This document is intentionally written so Claude Code can build the project **end to end with minimal or no clarification questions**.

If needed later, the next follow-up docs to add would be:
- exact hero stat sheet tables
- exact 12-item table with recipes and active effects
- exact bot difficulty presets
- exact XP / gold formulas

Those can be added as separate balance documents without changing the architecture above.