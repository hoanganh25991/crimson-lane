# 🧙 Dota 1 — 5 Hero Design Document

> All heroes are drawn using **Three.js geometry only** (no external assets).  
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

## 🧊 HERO 1 — Lich

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
- **Mana:** 120/130/145/160 | **CD:** 7/6/5/4s
- **Damage:** 75/150/225/300 magic (primary target: +100 bonus)
- **Slow:** 20/30/40/50% move speed, 4s duration
- **Visual:** Cyan ice ring expands 400 units from cast point. Ice shards spike up from ground at ring edge.
- **Geometry effect:** `TorusGeometry` ring scale 0→1 over 0.3s, 8 `ConeGeometry` spikes rise from ground

#### W — Dark Ritual
- **Type:** Unit-target (allied non-hero unit only)
- **Mana:** 25 | **CD:** 55/45/35/25s
- **Effect:** Sacrifices target creep → restores mana equal to 100/130/160/200% of creep's current HP
- **Visual:** Purple spiral rises from creep → flows into Lich. Creep fades out (scale → 0).
- **Geometry effect:** Spiral of purple `SphereGeometry` particles orbiting upward

#### E — Chain Frost
- **Type:** Unit-target
- **Mana:** 150/175/200 | **CD:** 8s
- **Damage:** 280/370/460 magic per bounce, up to 10 bounces
- **Bounce range:** 750 units | Slow: 30%, 3s
- **Visual:** Cyan orb fires → on hit, line draws to next target and orb re-fires. Orb gets slightly larger per bounce.
- **Geometry effect:** Projectile `SphereGeometry` r=0.15, cyan emissive. `Line` drawn between bounce points.

#### R — Frost Armor (Passive)
- **Type:** Passive aura (self + nearby allies within 900 units)
- **Effect:** Adds 3/4/5/6 armor. Enemies who hit buffed unit → slowed 40% move for 3s
- **Visual:** Faint blue hexagonal sheen pulses on any unit with buff. Slow indicator: blue trail on affected enemy.
- **Geometry effect:** Subtle `IcosahedronGeometry` wireframe rotating slowly around Lich (scale 1.5)

---

## 🔫 HERO 2 — Sniper (Kardel Sharpeye)

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
- **Mana:** 120 | **CD:** 22s (1 charge stored per 22s, max 2)
- **Effect:** Rains shrapnel in 350-radius zone for 9s. 15/30/45/60 DPS + 30% slow inside zone.
- **Visual:** Yellow burst on land → zone shimmers with small metal shard particles bouncing on ground.
- **Geometry effect:** Ring of `BoxGeometry(0.04, 0.04, 0.04)` particles randomly bounce inside radius

#### W — Headshot (Passive)
- **Type:** Passive proc
- **Effect:** 40% chance on attack to deal 30/55/80/115 bonus physical damage + 0.5s mini-stun
- **Visual:** On proc → yellow star burst on target's head, brief freeze frame 0.05s
- **Geometry effect:** `StarGeometry` equivalent (IcosahedronGeometry scaled flat) flash on impact

#### E — Aim (Passive)
- **Type:** Passive stat
- **Effect:** Increases attack range by 75/150/225/300
- **Visual:** At level 4, sniper has 850 attack range — show range circle glow on review screen
- **Indicator:** Faint gold ring at edge of attack range in review mode

#### R — Assassinate
- **Type:** Unit-target (very long range: 2000/2500/3000 units)
- **Mana:** 175/250/275 | **CD:** 20s | Channel: 1.7s
- **Damage:** 355/505/655 magic + applies Headshot slow
- **Interrupt:** Channeling is interrupted by stun/silence
- **Visual:** Sniper freezes → red laser dot appears on target → beam fires (instant line from barrel to target)
- **Geometry effect:** `Line` from barrel tip to target, bright yellow, 0.15s flash. Screen vignette on caster during channel.

---

## 🔥 HERO 3 — Dragon Knight (Davion)

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
- **Effect:** +3/6/9/12 HP regen/sec, +3/4/5/6 armor
- **Visual:** Faint red shimmer pulses from hero body every 3s
- **Geometry effect:** Red `SphereGeometry` corona pulse scale 1.0→1.8→0 opacity

#### W — Dragon Tail
- **Type:** Unit-target (melee range: 150 units)
- **Mana:** 100 | **CD:** 9s
- **Effect:** Shield bash — 2/2/2/2.5s stun + 25/50/75/100 magic damage
- **Visual:** Shield slams forward, gold shockwave ring at target's feet
- **Geometry effect:** `TorusGeometry` ring (gold) pops from ground, scale 0→1.5 over 0.25s

#### E — Breathe Fire
- **Type:** Point-target line AoE (600 length cone)
- **Mana:** 100/110/120/130 | **CD:** 15/12/9/6s
- **Damage:** 75/150/225/300 magic, reduces base attack damage by 35% for 5s
- **Visual:** Fire cone sprays from hero's mouth/sword direction
- **Geometry effect:** Orange/red `ConeGeometry` particles stream forward, fade out at range

#### R — Elder Dragon Form
- **Type:** Self-transform | **CD:** 100s | Duration: 60s
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

## 🌑 HERO 4 — Shadow Fiend (Nevermore)

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
- **Type:** No-target, 3 fixed-range AoEs
- **Short Raze:** 200 units ahead, Mana 75, CD 10s
- **Medium Raze:** 450 units ahead, Mana 75, CD 10s
- **Long Raze:** 700 units ahead, Mana 75, CD 10s
- **Damage:** 75/150/225/300 magic per raze. Each shares a CD independently.
- **Visual:** Black smoke eruption at the fixed distance. `CylinderGeometry` dark cloud puffs up.

#### W — Necromastery (Passive)
- **Type:** Passive soul collection
- **Effect:** On unit kill, gain 1 soul (max 12/16/20/24). Each soul = +2 damage.
- **Visual:** Red orb flies from killed unit → orbits SF hero. Orbs glow brighter near cap.
- **Death:** SF drops 50% of souls on death.

#### E — Presence of the Dark Lord (Passive Aura)
- **Type:** Passive aura, 900 radius
- **Effect:** Reduces enemy armor by 3/4/5/6 in range
- **Visual:** Dark purple mist clouds radiate outward from SF's feet (particle drift)

#### R — Requiem of Souls
- **Type:** No-target, massive AoE (global-ish: 1000 radius)
- **Mana:** 150/175/200 | **CD:** 120/110/100s
- **Effect:** All stored souls (from Necromastery) fire as lines outward, then pull back.
  - Lines deal 80/120/160 × (souls/2) damage. Slow 20/30/50% on outward.
- **Visual:** Wings SPREAD FULLY open. Red soul lines explode outward in all directions, pause, pull back inward.
- **Geometry effect:**
  - Wings rotate from folded (Z=10°) to open (Z=90°) over 0.5s
  - 8–24 `Line` objects shoot outward, hang 0.3s, retract

---

## 🌿 HERO 5 — Windrunner (Alleria)

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
- **Mana:** 90/100/110/120 | **CD:** 15s
- **Effect:** Fires arrow at target. If target is in line with a tree or another unit → both get shackled (stun 0.75/1.5/2.25/3.0s).
- **Visual:** Arrow fires → wire/chain drawn between shackled units/tree
- **Geometry effect:** `Line` chain drawn between two targets, gold color. Both targets flash.

#### W — Powershot
- **Type:** Vector-target (direction + range, up to 1700 units)
- **Mana:** 90/100/110/120 | **CD:** 12s
- **Channel:** 1s charge up → releases at full charge or on re-cast
- **Damage:** 340/480/620/760 magic (decreases 10% per unit hit)
- **Visual:** Arrow glows brighter during charge. On release: giant glowing arrow pierces through line.
- **Geometry effect:** Arrow projectile 3× normal size, `CylinderGeometry(0.06, 0.01, 1.5)` scaled, bright green emissive

#### E — Windrun
- **Type:** No-target, self-cast
- **Mana:** 100 | **CD:** 15/12/9/6s | Duration: 3s
- **Effect:** +50% evasion, +50% move speed. Incoming projectiles miss.
- **Visual:** Hero surrounded by green wind spiral. Movement leaves teal afterimage trail.
- **Geometry effect:** `TorusGeometry` wind ring orbits hero horizontally. Speed of rotation = move speed. Afterimage: ghost copy of hero mesh at 20% opacity, 0.1s delayed.

#### R — Focus Fire
- **Type:** Unit-target | **CD:** 60s | Duration: 20s
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

*Next step: Implement the Hero Review Screen as `hero-viewer.html`, then integrate heroes into the game engine.*
