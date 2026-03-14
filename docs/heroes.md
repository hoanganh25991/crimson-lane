# 🧙 Dota 1 — 20 Hero Design Document

**Category:** Design · **Tags:** #content #heroes #skills #art

> **Roster:** 20 heroes (5 original + 15 new). All heroes are drawn using **Three.js geometry only** (no external assets).  
> Each hero has a **unique silhouette** recognizable from Dota 1.  
> Attack animation speed scales directly with attack speed stat.  
> A **Hero Review Screen** lets you preview each hero + test each skill live.

---

## 🎨 Drawing System — Three.js Geometry Parts

Each hero is an **assembled group of BoxGeometry / CylinderGeometry / SphereGeometry** meshes,
colored with `MeshLambertMaterial`. No textures — pure geometry art.

### Animation Layers (all heroes share this system)

| Layer | What animates | Driver |
|---|---|---|
| `idleAnim` | Gentle body bob up/down | `sin(time × 1.5)` |
| `walkAnim` | Leg swing alternating, arm swing | `sin(time × walkSpeed)` |
| `attackAnim` | Attack wind-up → strike → return | Attack Speed stat |
| `castAnim` | Arm raise + glow | Per skill |
| `deathAnim` | Tip forward → sink into ground | On death |
| `hitAnim` | Flash white + micro-knockback | On take damage |

### Attack Speed → Animation Speed Formula
```
attackInterval (ms) = 1700 / (1 + attackSpeed / 100)
animationSpeed     = 1700 / attackInterval   // 1.0 at base, up to ~4.0
armSwingAmount     = 0.6 rad (fixed angle)
armSwingDuration   = attackInterval × 0.4    // 40% of interval = swing
```
When attack speed increases (from items/buffs), the arm swing completes faster,
making the character visually feel faster.

---

## Heroes

All 20 heroes are documented below. Each skill includes a **Range** definition (see [plan.md](plan.md) §6 for the taxonomy). Heroes 1–5 have full geometry and skill writeups; heroes 6–20 use compact skill tables.

---

### Lich (Hero 1)

**Dota 1 hero:** Lich (Undead · Scourge · Intelligence)  
**Silhouette:** Tall robed skeleton, floating off ground, bony arms extended

### Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Robe body | `CylinderGeometry(0.25, 0.45, 1.1)` | `#1a0a2e` dark purple | Wide at bottom, tapers up |
| Robe lower | `CylinderGeometry(0.45, 0.6, 0.4)` | `#1a0a2e` | Flared skirt base |
| Skull head | `SphereGeometry(0.22)` | `#e8dcc8` bone white | Slightly flattened Y |
| Jaw | `BoxGeometry(0.18, 0.07, 0.15)` | `#e8dcc8` | Offset -Y from skull center |
| Eye sockets ×2 | `SphereGeometry(0.05)` | `#00ffcc` cyan glow | Emissive material |
| Left arm | `BoxGeometry(0.07, 0.5, 0.07)` | `#c8b89a` | Angled outward 20° |
| Right arm | `BoxGeometry(0.07, 0.5, 0.07)` | `#c8b89a` | Angled outward 20° |
| Left hand | `SphereGeometry(0.07)` | `#c8b89a` | Bony fist |
| Right hand | `SphereGeometry(0.07)` | `#c8b89a` | Holds ice orb |
| Ice orb (right) | `SphereGeometry(0.1)` | `#88eeff` | Emissive, slow pulse scale |
| Staff | `CylinderGeometry(0.03, 0.03, 1.2)` | `#6633aa` | In left hand, tall |
| Staff top gem | `OctahedronGeometry(0.1)` | `#00ffcc` | Emissive top of staff |
| Shoulder spikes ×2 | `ConeGeometry(0.06, 0.22)` | `#334466` | On each shoulder |
| Float offset | — | — | Hero Y = `0.15 + sin(time×2)×0.06` hover |

### Animations

**Idle:** Gentle float oscillation on Y axis. Ice orb pulses scale 0.9→1.1.  
**Walk:** Robe sways slightly, arms drift. Legs hidden in robe — no leg anim.  
**Attack:** Right arm swings forward, ice orb launches (projectile spawns at hand). Speed: attack interval.  
**Cast Q (Frost Nova):** Both arms spread wide → cyan ring expands from body → contract.  
**Cast E (Chain Frost):** Right arm points, cyan orb fires, bounces with trail line.  

### Stats
```
Base HP:       454     HP/level:   +19
Base Mana:     403     Mana/level: +26
Base Armor:    1.1     Attack Range: 600
Move Speed:    295     Attack Speed: 100 (base)
Str/Agi/Int:   15/15/22 (+1.75/+1.5/+3.0 per level)
Attack damage: 49–55 (magic staff)
```

### Skills

#### Q — Frost Nova
- **Type:** Point-target AoE
- **Range:** 600 units (cast range to place AoE center)
- **Mana:** 120/130/145/160 | **CD:** 7/6/5/4s
- **Damage:** 75/150/225/300 magic (primary target: +100 bonus)
- **Slow:** 20/30/40/50% move speed, 4s duration
- **Visual:** Cyan ice ring expands 400 units from cast point. Ice shards spike up from ground at ring edge.
- **Geometry effect:** `TorusGeometry` ring scale 0→1 over 0.3s, 8 `ConeGeometry` spikes rise from ground

#### W — Dark Ritual
- **Type:** Unit-target (allied non-hero unit only)
- **Range:** 400 units
- **Mana:** 25 | **CD:** 55/45/35/25s
- **Effect:** Sacrifices target creep → restores mana equal to 100/130/160/200% of creep's current HP
- **Visual:** Purple spiral rises from creep → flows into Lich. Creep fades out (scale → 0).
- **Geometry effect:** Spiral of purple `SphereGeometry` particles orbiting upward

#### E — Chain Frost
- **Type:** Unit-target
- **Range:** 750 units | Bounce range: 750 units
- **Mana:** 150/175/200 | **CD:** 8s
- **Damage:** 280/370/460 magic per bounce, up to 10 bounces
- **Bounce range:** 750 units | Slow: 30%, 3s
- **Visual:** Cyan orb fires → on hit, line draws to next target and orb re-fires. Orb gets slightly larger per bounce.
- **Geometry effect:** Projectile `SphereGeometry` r=0.15, cyan emissive. `Line` drawn between bounce points.

#### R — Frost Armor (Passive)
- **Type:** Passive aura (self + nearby allies within 900 units)
- **Range:** N/A (passive; aura radius 900)
- **Effect:** Adds 3/4/5/6 armor. Enemies who hit buffed unit → slowed 40% move for 3s
- **Visual:** Faint blue hexagonal sheen pulses on any unit with buff. Slow indicator: blue trail on affected enemy.
- **Geometry effect:** Subtle `IcosahedronGeometry` wireframe rotating slowly around Lich (scale 1.5)

---

### Sniper (Hero 2)

**Dota 1 hero:** Sniper (Keen · Sentinel · Agility)  
**Silhouette:** Short stout gnome, oversized rifle, wide-brimmed hat

### Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.38, 0.5, 0.3)` | `#8B6914` leather brown | Stocky build |
| Legs ×2 | `BoxGeometry(0.14, 0.38, 0.14)` | `#5c4a1e` | Short, wide stance |
| Boots ×2 | `BoxGeometry(0.16, 0.1, 0.2)` | `#3a2a0a` dark brown | Slightly forward offset |
| Head | `SphereGeometry(0.22)` | `#c49a5a` tan skin | Slightly squished |
| Hat brim | `CylinderGeometry(0.32, 0.34, 0.05)` | `#4a3010` | Wide flat disk on head |
| Hat crown | `CylinderGeometry(0.18, 0.2, 0.22)` | `#4a3010` | Sits on brim |
| Hat feather | `BoxGeometry(0.03, 0.18, 0.06)` | `#cc3300` red | Angled out of hat |
| Left arm | `BoxGeometry(0.1, 0.4, 0.1)` | `#8B6914` | Holds rifle front |
| Right arm | `BoxGeometry(0.1, 0.4, 0.1)` | `#8B6914` | Holds rifle grip |
| Rifle barrel | `CylinderGeometry(0.04, 0.04, 1.1)` | `#888888` gunmetal | Long, horizontal, points forward |
| Rifle stock | `BoxGeometry(0.12, 0.16, 0.38)` | `#5c3a1e` wood | Rear of rifle |
| Rifle scope | `CylinderGeometry(0.05, 0.05, 0.2)` | `#444` | On top of barrel |
| Beard | `BoxGeometry(0.14, 0.12, 0.1)` | `#cc9933` | Below chin |
| Bandolier | `BoxGeometry(0.38, 0.06, 0.08)` | `#8B0000` | Diagonal strap on chest |

### Animations

**Idle:** Slight body sway. Rifle rests diagonally. Foot tap every 2s.  
**Walk:** Leg alternation, arms locked on rifle. Waddle side-to-side (Z rotation ±3°).  
**Attack:** Rifle raises to aim (0.15s wind-up), muzzle flash (white point light blink), recoil kick-back 0.1s. Speed scales with attack speed — at 2× speed, full sequence completes in half time.  
**Cast R (Assassinate):** Hero freezes, crosshair overlay appears on screen, barrel glows, then massive flash + beam effect.

### Stats
```
Base HP:       492     HP/level:   +19
Base Mana:     195     Mana/level: +13
Base Armor:    2.08    Attack Range: 550
Move Speed:    290     Attack Speed: 100 (base)
Str/Agi/Int:   15/21/16 (+1.7/+2.9/+1.5 per level)
Attack damage: 38–44 (ranged physical)
```

### Skills

#### Q — Shrapnel
- **Type:** Point-target AoE zone
- **Range:** 900 units
- **Mana:** 120 | **CD:** 22s (1 charge stored per 22s, max 2)
- **Effect:** Rains shrapnel in 350-radius zone for 9s. 15/30/45/60 DPS + 30% slow inside zone.
- **Visual:** Yellow burst on land → zone shimmers with small metal shard particles bouncing on ground.
- **Geometry effect:** Ring of `BoxGeometry(0.04, 0.04, 0.04)` particles randomly bounce inside radius

#### W — Headshot (Passive)
- **Type:** Passive proc
- **Range:** N/A (passive)
- **Effect:** 40% chance on attack to deal 30/55/80/115 bonus physical damage + 0.5s mini-stun
- **Visual:** On proc → yellow star burst on target's head, brief freeze frame 0.05s
- **Geometry effect:** `StarGeometry` equivalent (IcosahedronGeometry scaled flat) flash on impact

#### E — Aim (Passive)
- **Type:** Passive stat
- **Range:** N/A (passive)
- **Effect:** Increases attack range by 75/150/225/300
- **Visual:** At level 4, sniper has 850 attack range — show range circle glow on review screen
- **Indicator:** Faint gold ring at edge of attack range in review mode

#### R — Assassinate
- **Type:** Unit-target (very long range)
- **Range:** 2000/2500/3000 units by level
- **Mana:** 175/250/275 | **CD:** 20s | Channel: 1.7s
- **Damage:** 355/505/655 magic + applies Headshot slow
- **Interrupt:** Channeling is interrupted by stun/silence
- **Visual:** Sniper freezes → red laser dot appears on target → beam fires (instant line from barrel to target)
- **Geometry effect:** `Line` from barrel tip to target, bright yellow, 0.15s flash. Screen vignette on caster during channel.

---

### Dragon Knight (Hero 3)

**Dota 1 hero:** Dragon Knight (Human · Sentinel · Strength)  
**Silhouette:** Tall armored knight, shield + sword, dragon helmet

### Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.45, 0.6, 0.3)` | `#2244aa` blue armor | Broad chest |
| Shoulder pads ×2 | `BoxGeometry(0.22, 0.15, 0.22)` | `#2244aa` | Raised above shoulders |
| Shoulder studs ×2 | `SphereGeometry(0.06)` | `#ffcc00` gold | Center of each pad |
| Legs ×2 | `BoxGeometry(0.17, 0.48, 0.17)` | `#1a3388` | Armored, slightly apart |
| Boots ×2 | `BoxGeometry(0.19, 0.14, 0.22)` | `#0a1a55` dark blue | Plated |
| Helmet | `CylinderGeometry(0.2, 0.24, 0.28)` | `#2244aa` | Flat top knight helm |
| Helmet visor | `BoxGeometry(0.18, 0.08, 0.1)` | `#001133` | Narrow slit, slightly forward |
| Dragon crest | `ConeGeometry(0.05, 0.2)` | `#ffcc00` gold | Horn on top center of helm |
| Face | `BoxGeometry(0.1, 0.1, 0.08)` | `#cc8844` skin | Visible below visor |
| Shield (left arm) | `BoxGeometry(0.08, 0.55, 0.45)` | `#1a3388` | Tall kite shield |
| Shield boss | `OctahedronGeometry(0.09)` | `#ffcc00` | Center of shield |
| Dragon on shield | `BoxGeometry(0.06, 0.25, 0.22)` | `#cc2200` | Stylized dragon shape on shield |
| Sword (right arm) | `BoxGeometry(0.06, 0.7, 0.04)` | `#ccddff` silver | Long straight blade |
| Sword guard | `BoxGeometry(0.2, 0.05, 0.06)` | `#ffcc00` | Crossguard |
| Cape | `BoxGeometry(0.35, 0.7, 0.04)` | `#cc0000` red | Behind body, slight wave anim |

### Animations

**Idle:** Cape sways (Z rotation sin wave). Dragon crest glints (emissive pulse).  
**Walk:** Strong leg march, shield held steady, sword at side. Shoulders rock slightly.  
**Attack:** Sword swings horizontally (Y rotation 0→-90°→0) over attack interval.  
**Dragon Form (ult active):** Hero mesh swapped to dragon — see R skill below.  
**Cast Q (Dragon Blood passive):** Flash of red/orange glow on hit.

### Stats
```
Base HP:       625     HP/level:   +25 (Strength primary)
Base Mana:     195     Mana/level: +13
Base Armor:    3.9     Attack Range: 128 (melee)
Move Speed:    290     Attack Speed: 100 (base)
Str/Agi/Int:   21/21/14 (+2.9/+1.5/+1.5 per level)
Attack damage: 53–59
```

### Skills

#### Q — Dragon Blood (Passive)
- **Type:** Passive
- **Range:** N/A (passive)
- **Effect:** +3/6/9/12 HP regen/sec, +3/4/5/6 armor
- **Visual:** Faint red shimmer pulses from hero body every 3s
- **Geometry effect:** Red `SphereGeometry` corona pulse scale 1.0→1.8→0 opacity

#### W — Dragon Tail
- **Type:** Unit-target (melee)
- **Range:** 150 units
- **Mana:** 100 | **CD:** 9s
- **Effect:** Shield bash — 2/2/2/2.5s stun + 25/50/75/100 magic damage
- **Visual:** Shield slams forward, gold shockwave ring at target's feet
- **Geometry effect:** `TorusGeometry` ring (gold) pops from ground, scale 0→1.5 over 0.25s

#### E — Breathe Fire
- **Type:** Point-target line AoE (cone)
- **Range:** 600 units (cone length)
- **Mana:** 100/110/120/130 | **CD:** 15/12/9/6s
- **Damage:** 75/150/225/300 magic, reduces base attack damage by 35% for 5s
- **Visual:** Fire cone sprays from hero's mouth/sword direction
- **Geometry effect:** Orange/red `ConeGeometry` particles stream forward, fade out at range

#### R — Elder Dragon Form
- **Type:** Self-transform
- **Range:** Self (no cast range)
- **CD:** 100s | Duration: 60s
- **Levels:** Level 1 = Green Dragon (poison slow), Level 2 = Red Dragon (+splash), Level 3 = Blue Dragon (+frost slow)
- **Effect:** Hero transforms → dragon body. Gains ranged attack (500), +15 armor, +50 move speed
- **Dragon geometry (replaces hero):**
  - Body: `BoxGeometry(0.9, 0.45, 0.5)` scaled dragon torso
  - Neck: `CylinderGeometry(0.18, 0.22, 0.4)` forward-angled
  - Head: `BoxGeometry(0.4, 0.3, 0.5)` elongated snout
  - Wings ×2: `BoxGeometry(0.05, 0.6, 0.9)` swept back, hinge animated flap
  - Tail: chain of 4 decreasing `SphereGeometry` (0.2→0.08)
  - Color: Green/Red/Blue based on level

---

### Shadow Fiend (Hero 4)

**Dota 1 hero:** Shadow Fiend (Undead · Scourge · Agility)  
**Silhouette:** Winged demon, hunched, two curved blades, glowing red eyes

### Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.35, 0.55, 0.28)` | `#0a0a0a` near-black | Thin, hunched forward 10° |
| Head | `SphereGeometry(0.2)` | `#111111` | Slightly forward-leaning |
| Eyes ×2 | `SphereGeometry(0.05)` | `#ff2200` red | Emissive, strong glow |
| Horn ×2 | `ConeGeometry(0.04, 0.2)` | `#330000` | Curved (approximated by rotation) |
| Left arm | `BoxGeometry(0.08, 0.42, 0.08)` | `#0a0a0a` | Slightly longer than normal |
| Right arm | `BoxGeometry(0.08, 0.42, 0.08)` | `#0a0a0a` | |
| Blade left | `BoxGeometry(0.04, 0.8, 0.06)` | `#221122` dark | Curved appearance via 2 segments |
| Blade right | `BoxGeometry(0.04, 0.8, 0.06)` | `#221122` | Mirror |
| Blade glow ×2 | `BoxGeometry(0.02, 0.75, 0.04)` | `#ff0044` | Emissive inner edge |
| Wings ×2 | `BoxGeometry(0.04, 0.8, 1.1)` | `#1a0022` | Folded at rest, open on ult |
| Wing ribs ×3 per wing | `BoxGeometry(0.03, 0.03, 0.9)` | `#2a0033` | Membrane ribs angled |
| Legs ×2 | `BoxGeometry(0.12, 0.4, 0.12)` | `#0a0a0a` | |
| Clawed feet ×2 | `BoxGeometry(0.18, 0.08, 0.22)` | `#220011` | Wide clawed stance |
| Soul orbs (×0–16) | `SphereGeometry(0.06)` | `#ff2200` | Orbit hero, count = souls |

### Animations

**Idle:** Wings twitch every 3s. Soul orbs orbit slowly around hero (sin wave height).  
**Walk:** Hunched forward glide — minimal foot movement, wings half-open.  
**Attack:** One blade slashes diagonally (arm rotates 0→-110°→0). Soul count decreases on Requiem.  
**Soul count visual:** Each soul = one red orb orbiting. 0–16 souls max. Orbs pulse faster when full.

### Stats
```
Base HP:       530     HP/level:   +19
Base Mana:     260     Mana/level: +14
Base Armor:    3.08    Attack Range: 128 (melee)
Move Speed:    305     Attack Speed: 100 (base)
Str/Agi/Int:   15/20/18 (+2.0/+2.9/+1.8 per level)
Attack damage: 51–57 + 2 per soul (Necromastery)
```

### Skills

#### Q — Shadowraze (×3 variants)
- **Type:** No-target, 3 fixed-range AoEs (special: no target selection)
- **Range:** Short 200 / Medium 450 / Long 700 units (fixed distances ahead)
- **Short Raze:** 200 units ahead, Mana 75, CD 10s
- **Medium Raze:** 450 units ahead, Mana 75, CD 10s
- **Long Raze:** 700 units ahead, Mana 75, CD 10s
- **Damage:** 75/150/225/300 magic per raze. Each shares a CD independently.
- **Visual:** Black smoke eruption at the fixed distance. `CylinderGeometry` dark cloud puffs up.

#### W — Necromastery (Passive)
- **Type:** Passive soul collection
- **Range:** N/A (passive)
- **Effect:** On unit kill, gain 1 soul (max 12/16/20/24). Each soul = +2 damage.
- **Visual:** Red orb flies from killed unit → orbits SF hero. Orbs glow brighter near cap.
- **Death:** SF drops 50% of souls on death.

#### E — Presence of the Dark Lord (Passive Aura)
- **Type:** Passive aura, 900 radius
- **Range:** N/A (passive; aura radius 900)
- **Effect:** Reduces enemy armor by 3/4/5/6 in range
- **Visual:** Dark purple mist clouds radiate outward from SF's feet (particle drift)

#### R — Requiem of Souls
- **Type:** No-target, self-centered AoE (special)
- **Range:** Self (effect radius 1000 units around caster)
- **Mana:** 150/175/200 | **CD:** 120/110/100s
- **Effect:** All stored souls (from Necromastery) fire as lines outward, then pull back.
  - Lines deal 80/120/160 × (souls/2) damage. Slow 20/30/50% on outward.
- **Visual:** Wings SPREAD FULLY open. Red soul lines explode outward in all directions, pause, pull back inward.
- **Geometry effect:**
  - Wings rotate from folded (Z=10°) to open (Z=90°) over 0.5s
  - 8–24 `Line` objects shoot outward, hang 0.3s, retract

---

### Windrunner (Hero 5)

**Dota 1 hero:** Windrunner (Night Elf · Sentinel · Agility)  
**Silhouette:** Slim female archer, hood and ponytail, longbow, green/teal colors

### Geometry Parts

| Part | Geometry | Color | Notes |
|---|---|---|---|
| Body torso | `BoxGeometry(0.28, 0.52, 0.22)` | `#1a4a2a` forest green | Slim build, slight forward lean |
| Hips | `BoxGeometry(0.3, 0.18, 0.22)` | `#1a4a2a` | Slightly wider than torso |
| Legs ×2 | `BoxGeometry(0.11, 0.46, 0.11)` | `#0f3020` | Slim, slightly apart |
| Boots ×2 | `BoxGeometry(0.13, 0.12, 0.2)` | `#0a1e14` | Soft leather look |
| Left arm (bow arm) | `BoxGeometry(0.08, 0.44, 0.08)` | `#2d6b3a` | Extended forward |
| Right arm (draw arm) | `BoxGeometry(0.08, 0.44, 0.08)` | `#2d6b3a` | Pulled back at rest |
| Hands ×2 | `SphereGeometry(0.07)` | `#c4855a` skin | |
| Head | `SphereGeometry(0.19)` | `#c4855a` | Slightly smaller, feminine |
| Hood | `SphereGeometry(0.23, 8, 6)` | `#1a4a2a` | Partial sphere covering top/back |
| Hood point | `ConeGeometry(0.07, 0.2)` | `#1a4a2a` | Pointy top of hood |
| Ponytail | `CylinderGeometry(0.05, 0.02, 0.4)` | `#8B5e3c` brown | Hangs behind, swings in walk |
| Eyes ×2 | `SphereGeometry(0.03)` | `#00ffaa` teal | Slight emissive |
| Longbow | `TorusGeometry(0.55, 0.025, 4, 20, Math.PI)` | `#5c3a1e` | Half-circle bow, left side |
| Bow string | `Line` geometry | `#ccffcc` | Straight line across bow tips |
| Quiver | `CylinderGeometry(0.07, 0.07, 0.4)` | `#3a2010` | On back, right side |
| Arrows in quiver ×3 | `CylinderGeometry(0.01, 0.01, 0.5)` | `#c8a050` | Sticking up from quiver |
| Cloak | `BoxGeometry(0.28, 0.6, 0.04)` | `#0f3020` | Behind, slight flutter |
| Wind wisps ×4 | `SphereGeometry(0.05)` | `#88ffcc` | Float around hero, Windrun active |

### Animations

**Idle:** Ponytail swings gently. Cloak flutters (Z rotation ±2°). Wisps orbit slowly.  
**Walk:** Smooth run — legs alternate, right arm draws back slightly, cloak streams behind.  
**Attack:** Right arm pulls back (draw) → releases (forward snap) → arrow fires from bow. Duration = attack interval. At high attack speed, draw-and-release looks like rapid-fire.  
**Windrun active:** Wind wisps speed up orbit. Hero footsteps leave faint teal trail.

### Stats
```
Base HP:       492     HP/level:   +19
Base Mana:     234     Mana/level: +26
Base Armor:    1.1     Attack Range: 600
Move Speed:    295     Attack Speed: 100 (base)
Str/Agi/Int:   15/21/18 (+1.5/+2.9/+2.0 per level)
Attack damage: 36–46 (ranged physical)
```

### Skills

#### Q — Shackleshot
- **Type:** Unit-target
- **Range:** 600 units
- **Mana:** 90/100/110/120 | **CD:** 15s
- **Effect:** Fires arrow at target. If target is in line with a tree or another unit → both get shackled (stun 0.75/1.5/2.25/3.0s).
- **Visual:** Arrow fires → wire/chain drawn between shackled units/tree
- **Geometry effect:** `Line` chain drawn between two targets, gold color. Both targets flash.

#### W — Powershot
- **Type:** Vector-target (direction + range)
- **Range:** Up to 1700 units
- **Mana:** 90/100/110/120 | **CD:** 12s
- **Channel:** 1s charge up → releases at full charge or on re-cast
- **Damage:** 340/480/620/760 magic (decreases 10% per unit hit)
- **Visual:** Arrow glows brighter during charge. On release: giant glowing arrow pierces through line.
- **Geometry effect:** Arrow projectile 3× normal size, `CylinderGeometry(0.06, 0.01, 1.5)` scaled, bright green emissive

#### E — Windrun
- **Type:** No-target, self-cast
- **Range:** Self
- **Mana:** 100 | **CD:** 15/12/9/6s | Duration: 3s
- **Effect:** +50% evasion, +50% move speed. Incoming projectiles miss.
- **Visual:** Hero surrounded by green wind spiral. Movement leaves teal afterimage trail.
- **Geometry effect:** `TorusGeometry` wind ring orbits hero horizontally. Speed of rotation = move speed. Afterimage: ghost copy of hero mesh at 20% opacity, 0.1s delayed.

#### R — Focus Fire
- **Type:** Unit-target
- **Range:** 600 units (attack range)
- **CD:** 60s | Duration: 20s
- **Mana:** 200/275/350
- **Effect:** Fires at max attack speed on target (400/600/800 attack speed). Each attack -8/-4/-0% damage penalty.
- **Visual:** Hero locks on target, rapid-fire arrows. Attack animation matches ultra-high speed.
- **Geometry effect:** At 800 attack speed, full attack cycle takes ~130ms. Arrow blur trail appears.

---

## 🖥️ Hero Review Screen

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  HERO VIEWER              [◀ Prev Hero]  [Next Hero ▶]  │
├──────────────────────┬──────────────────────────────────┤
│                      │  Lich                            │
│   [3D Hero Canvas]   │  Intelligence · Scourge          │
│   Rotate: drag       │  ──────────────────────────────  │
│   Zoom: scroll       │  HP ████████████░░░  454         │
│                      │  Mana ████████████░░  403        │
│  [Idle] [Walk]       │  Armor  1.1 │ Range  600         │
│  [Attack] [Die]      │  Move   295 │ AS     100         │
│                      │  ──────────────────────────────  │
│  Attack Speed: ──●── │  STR 15 (+1.75)                  │
│  (slider 50–400)     │  AGI 15 (+1.50)                  │
│                      │  INT 22 (+3.00)  ← Primary       │
│  Level: [1–25]       │  ──────────────────────────────  │
│                      │  SKILLS                          │
│                      │  [Q] [W] [E] [R]                 │
│                      │  ← tap to preview skill          │
└──────────────────────┴──────────────────────────────────┘

[Skill Preview Panel — appears below on skill tap]
┌─────────────────────────────────────────────────────────┐
│  ❄ Frost Nova                      Mana 120 │ CD 7s    │
│  Deals 300 magic dmg in 400 AoE. Slows 50%. 4s.        │
│  [Cast Preview] → shows animation on dummy target       │
└─────────────────────────────────────────────────────────┘
```

### Features
- **Hero selector:** 5 hero portrait cards at top, click to switch
- **3D viewport:** Hero rendered in Three.js, orbiting camera, auto-rotate
- **Animation buttons:** Idle / Walk / Attack / Cast Q W E R / Die
- **Attack speed slider:** 50–400 range. Hero attack animation updates live.
- **Level selector:** 1–25 slider. Stats update in real-time. Skill levels follow.
- **Skill preview:** Tap skill button → panel shows description + plays cast animation on dummy
- **Dummy target:** Small neutral cube next to hero for skill targeting
- **Stat panel:** All base stats + growth per level, updates with level slider

---

## 📐 Shared Design Rules

### Color palette per hero
| Hero | Primary | Secondary | Accent |
|---|---|---|---|
| Lich | `#1a0a2e` | `#00ffcc` | `#6633aa` |
| Sniper | `#8B6914` | `#888888` | `#ffcc00` |
| Dragon Knight | `#2244aa` | `#ffcc00` | `#cc0000` |
| Shadow Fiend | `#0a0a0a` | `#ff2200` | `#330000` |
| Windrunner | `#1a4a2a` | `#88ffcc` | `#c4855a` |

### Geometry budget (per hero)
- Max 20–28 mesh parts per hero
- All meshes in single `THREE.Group` for transform control
- LOD: at distance > 20 units, merge to 8-part simplified version

### Team coloring
- Scourge heroes (Lich, Shadow Fiend): add subtle red point light below feet
- Sentinel heroes (Sniper, Dragon Knight, Windrunner): add subtle blue point light
- Light intensity 0.3, distance 2.0 — does not affect map lighting

---

## Heroes — Full Skill SDLC (20 heroes)

Each hero is implemented as `js/heroes/<id>.js` following the contract in `js/heroes/_template.js`. Use `stdMat`, `glowMat`, `metalMat`, `transMat` from `../hero-models.js`. Stats use in-game scale: `range` in world units (melee ~2.5–3, ranged 10–14), `move` ~7–9, `hp`/`mp` in hundreds.

**Skill range convention:** Every skill has a **Range** line. Values: `N/A (passive)`, `Self`, `XXX units`, `global` (Zeus R), or `Self (effect radius XXX)` for self-centered AoE.

---

### 6. Axe (axe) — Str, Scourge, Initiator/Tank

- **Silhouette:** Large armored orc, single broad axe, horned helmet, red/dark armor.
- **Geometry:** Box torso, shoulder pads, helmet with horns, one large axe (BoxGeometry blade + Cylinder handle), legs, boots. Colors: `#8B0000`, `#2a1510`, `#cc4422`.
- **Stats:** hp 650, mp 220, move 8, range 2.5 (melee), dmg 52–58, armor 4, atkSpd 0.9. Str primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Berserker's Call | No-target, self-radius | Self (radius 275) | 80 | 14s |
| W | Battle Hunger | Unit-target | 500 units | 75 | 20s |
| E | Counter Helix | Passive | N/A (passive) | — | — |
| R | Culling Blade | Unit-target | 150 units (melee) | 120 | 75s |

### 7. Pudge (pudge) — Str, Scourge, Ganker

- **Silhouette:** Fat butcher, meat hook in hand, belly, chains, dark green/grey.
- **Geometry:** Large rounded torso (sphere/cylinder), belly, head, meat hook (chain + hook geometry), legs. Colors: `#3d4a3d`, `#1a2a1a`, `#88aa88`.
- **Stats:** hp 700, mp 280, move 7.5, range 2.5 (melee), dmg 45–51, armor 2, atkSpd 0.85. Str primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Meat Hook | Vector/point-target | 1300 units | 110 | 14s |
| W | Rot | Toggle | N/A (toggle; radius 250) | — | — |
| E | Flesh Heap | Passive | N/A (passive) | — | — |
| R | Dismember | Unit-target | 150 units (melee) | 100 | 30s |

### 8. Sven (sven) — Str, Sentinel, Carry/Stun

- **Silhouette:** Knight in blue/silver armor, huge sword, cape.
- **Geometry:** Armored torso, pauldrons, helmet, greatsword (long BoxGeometry), cape, legs, boots. Colors: `#2244aa`, `#aaccff`, `#6688cc`.
- **Stats:** hp 620, mp 195, move 8, range 2.5 (melee), dmg 54–56, armor 3, atkSpd 0.9. Str primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Storm Hammer | Unit-target | 600 units | 140 | 15s |
| W | Great Cleave | Passive | N/A (passive) | — | — |
| E | Warcry | No-target, self-radius | Self (radius 900) | 25 | 36s |
| R | God's Strength | No-target, self | Self | 100 | 80s |

### 9. Tidehunter (tidehunter) — Str, Scourge, Initiator

- **Silhouette:** Large fish/beast, anchor weapon, shell, teal/green.
- **Geometry:** Rounded body, shell back, head with mouth, anchor (Cylinder + Box), webbed feet. Colors: `#2d5a4a`, `#1a3a2e`, `#88ccaa`.
- **Stats:** hp 660, mp 234, move 7.5, range 2.5 (melee), dmg 50–56, armor 3, atkSpd 0.9. Str primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Gush | Unit-target | 700 units | 120 | 12s |
| W | Kraken Shell | Passive | N/A (passive) | — | — |
| E | Anchor Smash | Passive | N/A (passive) | — | — |
| R | Ravage | No-target, self-radius | Self (radius 1025) | 150 | 150s |

### 10. Earthshaker (earthshaker) — Str, Sentinel, Initiator

- **Silhouette:** Tall totem-carrying shaman, horned, earth tones, giant totem.
- **Geometry:** Tall torso, totem (tall Cylinder/Box), horns, tribal armor, legs. Colors: `#4a3728`, `#8B6914`, `#2a1810`.
- **Stats:** hp 610, mp 291, move 7.5, range 2.5 (melee), dmg 50–56, armor 3, atkSpd 0.9. Str primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Fissure | Point-target line | 1400 units | 125 | 15s |
| W | Enchant Totem | No-target, self | Self | 20 | 6s |
| E | Aftershock | Passive | N/A (passive) | — | — |
| R | Echo Slam | No-target, self-radius | Self (radius 600) | 145 | 150s |

### 11. Phantom Assassin (phantom_assassin) — Agi, Scourge, Carry/Assassin

- **Silhouette:** Hooded figure, twin blades, red/black.
- **Geometry:** Slim torso, hood, two curved blades, legs. Colors: `#2a0010`, `#aa2244`, `#440011`.
- **Stats:** hp 530, mp 195, move 8.5, range 2.5 (melee), dmg 51–53, armor 2, atkSpd 1.0. Agi primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Stifling Dagger | Unit-target | 525 units | 30 | 8s |
| W | Phantom Strike | Unit-target (blink) | 1000 units | 50 | 20s |
| E | Blur | Passive | N/A (passive) | — | — |
| R | Coup de Grâce | Passive | N/A (passive) | — | — |

### 12. Juggernaut (juggernaut) — Agi, Sentinel, Carry/Fighter

- **Silhouette:** Samurai with blade, mask, armor.
- **Geometry:** Armored torso, mask, single long blade, bandana, legs. Colors: `#cc4422`, `#2a1510`, `#ff8844`.
- **Stats:** hp 560, mp 195, move 8, range 2.5 (melee), dmg 46–50, armor 3, atkSpd 0.95. Agi primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Blade Fury | No-target, self-radius | Self (radius 250) | 120 | 42s |
| W | Healing Ward | No-target, point-target | 400 units (place ward) | 140 | 60s |
| E | Blade Dance | Passive | N/A (passive) | — | — |
| R | Omnislash | Unit-target | 450 units | 200 | 130s |

### 13. Drow Ranger (drow_ranger) — Agi, Sentinel, Carry/Range

- **Silhouette:** Archer, longbow, cloak, ice theme.
- **Geometry:** Slim torso, bow (TorusGeometry half), quiver, cloak, legs, hood. Colors: `#4466aa`, `#88aacc`, `#2a3355`.
- **Stats:** hp 530, mp 195, move 8, range 12, dmg 44–51, armor 2, atkSpd 1.0. Agi primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Frost Arrows | Toggle | N/A (toggle; attack range) | — | — |
| W | Gust | Point-target cone | 900 units | 90 | 13s |
| E | Precision Aura | Passive | N/A (passive; aura 900) | — | — |
| R | Marksmanship | Passive | N/A (passive) | — | — |

### 14. Bounty Hunter (bounty_hunter) — Agi, Scourge, Ganker/Roam

- **Silhouette:** Stealthy figure, dual blades, hood.
- **Geometry:** Lean torso, hood, two short blades, scarf, legs. Colors: `#1a2a1a`, `#558855`, `#88cc88`.
- **Stats:** hp 550, mp 195, move 8.5, range 2.5 (melee), dmg 48–54, armor 3, atkSpd 0.95. Agi primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Shuriken Toss | Unit-target | 1200 units | 90 | 10s |
| W | Jinada | Passive | N/A (passive) | — | — |
| E | Shadow Walk | No-target, self | Self | 50 | 15s |
| R | Track | Unit-target | 1200 units | 50 | 5s |

### 15. Vengeful Spirit (vengeful_spirit) — Agi, Scourge, Support/Stun

- **Silhouette:** Winged archer, glowing, dark purple.
- **Geometry:** Slim torso, wings (BoxGeometry), bow, crown/hair, legs. Colors: `#4a2a5a`, `#aa88cc`, `#2a1a3a`.
- **Stats:** hp 530, mp 234, move 8, range 12, dmg 42–48, armor 2, atkSpd 0.95. Agi primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Magic Missile | Unit-target | 500 units | 110 | 13s |
| W | Wave of Terror | Point-target cone | 1400 units | 40 | 15s |
| E | Vengeance Aura | Passive | N/A (passive; aura 900) | — | — |
| R | Nether Swap | Unit-target | 900 units | 100 | 45s |

### 16. Crystal Maiden (crystal_maiden) — Int, Sentinel, Support

- **Silhouette:** Robed caster, staff with crystal, ice theme.
- **Geometry:** Robe (Cylinder/Lathe), staff, crystal orb, hood, hair. Colors: `#4488aa`, `#aaddff`, `#2266aa`.
- **Stats:** hp 454, mp 403, move 7, range 12, dmg 43–49, armor 1, atkSpd 0.85. Int primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Crystal Nova | Point-target AoE | 600 units | 130 | 12s |
| W | Frostbite | Unit-target | 500 units | 115 | 10s |
| E | Arcane Aura | Passive | N/A (passive; global) | — | — |
| R | Freezing Field | No-target, self-radius | Self (radius 685) | 200 | 90s |

### 17. Zeus (zeus) — Int, Sentinel, Nuker

- **Silhouette:** Robed elder, lightning, beard, crown.
- **Geometry:** Robe, beard (BoxGeometry), crown, lightning orb in hand. Colors: `#ffcc00`, `#886622`, `#fff0aa`.
- **Stats:** hp 511, mp 351, move 7.5, range 12, dmg 41–49, armor 2, atkSpd 0.9. Int primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Arc Lightning | Unit-target | 700 units | 65 | 2s |
| W | Lightning Bolt | Unit-target | 700 units | 100 | 7s |
| E | Static Field | Passive | N/A (passive; 1200 on cast) | — | — |
| R | Thundergod's Wrath | No-target, **global** | **Global** (all enemy heroes) | 225 | 90s |

### 18. Lina (lina) — Int, Sentinel, Nuker

- **Silhouette:** Female caster, flame hair, staff.
- **Geometry:** Robe, flame hair (ConeGeometry × several), staff with flame, slim build. Colors: `#cc2200`, `#ff6622`, `#552200`.
- **Stats:** hp 492, mp 351, move 8, range 12, dmg 44–50, armor 2, atkSpd 0.9. Int primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Dragon Slave | Point-target line | 1075 units | 100 | 9s |
| W | Light Strike Array | Point-target AoE | 600 units | 90 | 7s |
| E | Fiery Soul | Passive | N/A (passive) | — | — |
| R | Laguna Blade | Unit-target | 600 units | 280 | 60s |

### 19. Lion (lion) — Int, Sentinel, Support/Disable

- **Silhouette:** Robed figure, demon hand, staff.
- **Geometry:** Robe, staff, large demon hand (claw), horns. Colors: `#663322`, `#aa6644`, `#330011`.
- **Stats:** hp 492, mp 351, move 8, range 12, dmg 43–49, armor 2, atkSpd 0.9. Int primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Earth Spike | Point-target line | 600 units | 100 | 12s |
| W | Hex | Unit-target | 500 units | 125 | 30s |
| E | Mana Drain | Unit-target (channel) | 550 units | 10 | 20s |
| R | Finger of Death | Unit-target | 700 units | 200 | 160s |

### 20. Enigma (enigma) — Int, Scourge, Initiator

- **Silhouette:** Floating cosmic figure, void/star theme.
- **Geometry:** Central orb/core, orbiting fragments (small spheres), no legs, float. Colors: `#220022`, `#660066`, `#aa44aa`.
- **Stats:** hp 511, mp 351, move 7, range 12, dmg 44–50, armor 2, atkSpd 0.9. Int primary.

| Slot | Name | Type | Range | Mana | CD |
|------|------|------|-------|------|-----|
| Q | Malefice | Unit-target | 600 units | 110 | 15s |
| W | Demonic Conversion | No-target (convert nearest creep) | 700 units (creep search) | 140 | 35s |
| E | Midnight Pulse | Point-target AoE | 700 units | 95 | 25s |
| R | Black Hole | Point-target (channel) | 400 units | 200 | 160s |

---

*Skill range taxonomy and per-hero specs are defined in [plan.md](plan.md) §6. Hero modules in `js/heroes/` should align `castRange`/`castRangeByLevel` with these values.*
