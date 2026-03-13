# Mobile Dota-Inspired Web Game Spec for Claude Code

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
- 12 items total
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

---

## 16. Item System

### 16.1 Inventory

- 6 inventory slots

### 16.2 MVP item count

- exactly 12 starter items in MVP

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

### Phase 10 — Optimization and polish

Deliver:
- performance improvements
- cleanup
- docs
- tests

Acceptance:
- stable local build
- acceptable mobile frame rate

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