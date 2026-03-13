Below is a **structured instruction plan you can give to Claude Code** so it can build the project **end‑to‑end with minimal questions**.  
You can paste this as a **single system instruction / project spec**.

I structured it like a **Game Design Doc + Technical Spec + Execution Plan** so an autonomous coding agent can follow it without stopping.

---

# Claude Code Instruction: Build a Mobile Dota‑Inspired Web Game

## 1. Project Goal

Build a **mobile‑first browser game inspired by Dota 1 (Warcraft III custom map)**.

The game must:

- Run **fully in browser**
- Work **smoothly on mobile devices**
- Use **HTML, CSS, JavaScript**
- Use **Three.js for 3D rendering**
- Focus on **simple controls similar to Garena mobile MOBA**
- Be playable **solo vs AI first**
- Be structured to allow **future multiplayer**

The gameplay should replicate **core Dota mechanics** but simplified for mobile.

Important:

- This is **not a clone with copyrighted assets**
- Use **original models and assets**
- Mechanics inspired by Dota only.

---

# 2. Target Platform

Primary target:

- Mobile browsers
- Android Chrome
- iOS Safari

Secondary:

- Desktop browsers

Target performance:

- **60 FPS desktop**
- **30+ FPS mid‑range mobile**

---

# 3. Core Gameplay Design

## Match Structure

Game type:

- **5 vs 5 MOBA**
- Player controls **one hero**
- Other heroes are **AI bots**

Match objective:

Destroy enemy **Ancient building**.

Match duration target:

- 10–20 minutes

---

# 4. Map Design

Inspired by **Dota 1 map layout**.

### Map Components

- 3 lanes
  - Top
  - Mid
  - Bottom

- Jungle areas
- River

Buildings:

Team base contains:

- Ancient
- 3 lane towers
- Barracks

Lane tower structure:

- Tier 1
- Tier 2
- Tier 3

---

### Map Size

Small optimized map:

```
~600 x 600 units
```

Optimized for mobile.

---

### Terrain

Use:

- heightmap
- simple textures

Libraries:

```
three.js
```

Features:

- terrain mesh
- simple grass shader
- pathfinding grid overlay

---

# 5. Camera System

Camera style:

**Isometric / angled top down**

Similar to:

- Dota
- League
- Mobile MOBAs

Camera features:

- follows hero
- limited zoom
- rotate disabled for simplicity

---

# 6. Hero System

Initial hero count:

```
6 heroes
```

Roles:

- Tank
- Fighter
- Assassin
- Mage
- Support
- Marksman

Each hero has:

- 4 skills
- base attributes
- attack animation
- movement speed

Attributes:

```
Strength
Agility
Intelligence
```

Derived stats:

```
HP
Mana
Attack
Armor
Magic Resist
Attack Speed
Move Speed
```

---

# 7. Ability System

Each hero has:

```
Skill Q
Skill W
Skill E
Ultimate R
```

Skill types:

- target
- area
- skill shot
- passive

Example skill:

```
Fireball
type: projectile
damage: 100
cooldown: 6s
mana cost: 40
```

Skill system must support:

- cooldown
- mana
- cast animation
- damage
- status effects

---

# 8. Combat System

Damage types:

```
Physical
Magical
Pure
```

Status effects:

```
Stun
Slow
Silence
Knockback
```

Combat loop:

```
attack
cast skill
apply damage
update health
check death
respawn
```

---

# 9. Minion / Creep System

Spawn system:

Every:

```
30 seconds
```

Each lane spawns:

```
3 melee
1 ranged
```

AI behavior:

```
follow lane path
attack nearest enemy
attack towers
```

---

# 10. Tower System

Towers:

- auto attack
- prioritize hero if attacking ally hero

Stats:

```
HP
Armor
Damage
Attack speed
Range
```

---

# 11. Item System

Simple item shop.

Categories:

- damage
- armor
- magic
- utility

Hero inventory:

```
6 slots
```

Example item:

```
Boots of Speed
+45 move speed
```

---

# 12. Mobile Control System

Inspired by **Garena mobile MOBA controls**.

### Left Side

Virtual joystick:

```
movement control
```

### Right Side

Buttons:

```
Attack
Skill 1
Skill 2
Skill 3
Ultimate
Recall
Item
```

Skills can be:

- tap cast
- drag direction
- auto target

---

# 13. AI System

Bots control:

- heroes
- creeps

Hero AI behaviors:

```
lane push
retreat when low hp
cast abilities
farm creeps
attack towers
```

Use:

```
Finite State Machine
```

States:

```
Idle
Move
Attack
Retreat
Cast
Farm
Push
```

---

# 14. Graphics Design

3D Style:

- Low poly
- Mobile optimized

Polygon targets:

Hero:

```
1500 - 2500 tris
```

Creep:

```
500 tris
```

Tower:

```
1000 tris
```

---

# 15. Rendering Optimization

Use:

```
Instancing
LOD
Texture atlas
```

Techniques:

- frustum culling
- GPU instancing
- compressed textures

---

# 16. Audio System

Use:

```
WebAudio API
```

Sounds:

- skill cast
- attack
- tower hit
- death

Music loop optional.

---

# 17. Networking (Future)

Design architecture so multiplayer can be added later.

Abstract systems:

```
GameState
PlayerController
Input
```

---

# 18. Project Architecture

Folder structure:

```
/project

/src
  /engine
  /game
  /ai
  /heroes
  /abilities
  /ui
  /map
  /systems

/assets
  /models
  /textures
  /audio

/public

/tools

/build
```

---

# 19. Game Engine Architecture

Core systems:

```
Entity Component System
```

Components:

```
Transform
Health
Mana
Movement
Combat
Ability
AI
Animation
```

Systems:

```
RenderSystem
MovementSystem
CombatSystem
AbilitySystem
AISystem
UISystem
```

---

# 20. Libraries

Required:

```
three.js
vite
zustand (state)
```

Optional:

```
ammo.js (physics)
pathfinding.js
```

---

# 21. Build System

Use:

```
Vite
```

Commands:

```
npm install
npm run dev
npm run build
```

---

# 22. Performance Targets

Mobile GPU memory:

```
< 300 MB
```

Draw calls:

```
< 150
```

Polygon budget:

```
< 200k total
```

---

# 23. Development Phases

Claude Code must implement in this order.

---

### Phase 1

Project setup

- vite
- three.js
- folder structure
- base scene
- camera
- terrain

---

### Phase 2

Hero controller

- movement
- animation
- camera follow

---

### Phase 3

Combat

- attack
- health
- damage

---

### Phase 4

Ability system

- cooldown
- targeting
- projectile

---

### Phase 5

Creep system

- spawn
- lane AI

---

### Phase 6

Tower system

---

### Phase 7

Mobile UI

- joystick
- skill buttons

---

### Phase 8

Bot hero AI

---

### Phase 9

Item system

---

### Phase 10

Optimization

---

# 24. Testing Requirements

Claude Code must include:

- automated unit tests
- gameplay simulation tests

Test cases:

```
damage calculation
cooldown logic
AI state transitions
```

---

# 25. Deliverables

Claude Code must produce:

1. Full source code
2. Working playable build
3. Documentation

Docs must include:

```
setup
architecture
adding new heroes
adding abilities
```

---

# 26. Important Constraints

Must:

- run fully in browser
- support touch controls
- avoid copyrighted assets
- prioritize mobile performance

---

# 27. Final Expected Result

A playable **mobile browser MOBA prototype** that includes:

- 1 map
- 6 heroes
- AI bots
- towers
- creeps
- abilities
- items
- mobile controls

---

✅ This instruction should allow Claude Code to **build end‑to‑end without repeatedly asking questions.**

---

If you want, I can also give you **3 extremely important upgrades** that will make this project **10x easier for AI agents to build**, such as:

- the **exact ECS architecture**
- a **Dota‑style ability scripting system**
- a **map lane pathing system**

These drastically reduce AI confusion during development.