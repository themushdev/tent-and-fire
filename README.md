# Changelog

## v0.2 Beta - "Gods & Kings"
*Release Date: December 6, 2025*

### Core Systems
- **The Pantheon:** Added Alignment tracking (Nature/Industry/Chaos).
- **Worship:** Dedicate your run to a God (Sylva, Crom, Xol) for massive playstyle changes.
- **Classes:** Added Unit Promotions (Squire -> Knight/Ranger, Acolyte -> Mage).
- **Quests:** Dynamic villager requests to gather resources or hunt specific monsters for Gold/Reputation.
- **Archaeology:** Enemies drop "Unidentified Artifacts" which reveal Lore and Passive Relics.

### Visuals & Engine
- **Ultrawide Engine:** Increased render grid to 125x50 for a cinematic view.
- **Sprite Rendering:** Replaced single chars with multi-tile ASCII art for buildings (Citadel, Temple, etc.).
- **Organic Maps:** New noise-based generation for forests and mountains.
- **UI Overhaul:** Reorganized Right Panel into Dashboard Tabs (Command, Build, Quests, Mystic, Legacy).
- **Smart Logs:** Split message log into 3 distinct columns (Civilization, Frontline, Aether).

### Balancing
- **Nerfed Drops:** Artifact drop rate lowered to 0.5% to preserve rarity.
- **Economy:** Added Gold costs to advanced units to curb inflation.

## v0.1 Alpha - "The Age of Mysteries"
*Release Date: December 5, 2025*

### General
- **Renamed:** Project is now officially **"Tent & Fire"**.
- **Engine:** Vue 3 + Vite + Pinia + Rot.js architecture established.
- **Persistence:** Robust `localStorage` save system with deep merging logic.

### Systems
- **Economy:** 5 Resources (Wood, Food, Stone, Gold, Mana).
- **Population:** Job system with Housing Caps.
- **Combat:** Zone-based progression (Cellar -> Forest -> Mines -> Peak).
- **Magic:** Grimoire system with Active Spells (Growth, Smite, Time Warp).
- **Tech Tree:** Blacksmith upgrades for resource multipliers.
- **Atmosphere:** Dynamic log messages based on player Alignment (Nature/Industry/Chaos).

### Visuals & UI
- **Dual View:** Hot-swappable "Tactical Map" (Top-down) and "Scenic View" (Art).
- **Zen AI:** Minions now commute to specific Biomes (Forest West, Quarry East) with smooth "gliding" movement.
- **Dynamic Particles:** Fire smoke, Magic sparks, and Combat hits.
- **Glass UI:** Clean, glowing green borders without retro noise.

### Units & Buildings
- **Minions:** Woodcutter, Farmer, Miner, Squire, Acolyte.
- **Buildings:** Tent, Hut, Campfire, Wheat Field, Barracks, Smithy, Arcane Library.