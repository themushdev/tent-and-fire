import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useGameStore = defineStore('game', () => {
  // --- STATE ---
  const resources = ref({
    wood: 0,
    food: 0,
    stone: 0,
    gold: 0,
    mana: 0,
  });

  const buildings = ref({
    tent: { count: 1, name: "Tattered Tent", desc: "Base population.", cap: 2 },
    hut: { count: 0, name: "Wooden Hut", cost: { wood: 50 }, cap: 3, desc: "Simple shelter." },
    farm: { count: 0, name: "Wheat Field", cost: { wood: 100, stone: 10 }, desc: "Unlocks farming." },
    barracks: { count: 0, name: "Barracks", cost: { wood: 100, stone: 20 }, desc: "Unlocks combat." },
    smithy: { count: 0, name: "Smithy", cost: { wood: 200, stone: 100 }, desc: "Unlocks upgrades." },
    library: { count: 0, name: "Arcane Library", cost: { wood: 300, stone: 150, gold: 10 }, desc: "Unlocks magic." },
    campfire: { count: 0, name: "Campfire", cost: { wood: 10 }, desc: "Warmth." },
  });

  const minions = ref({
    woodcutter: { count: 0, name: "Woodcutter", cost: { food: 10 }, rate: 1, alignment: 'nature' },
    farmer: { count: 0, name: "Farmer", cost: { food: 20 }, rate: 1, alignment: 'nature' },
    miner: { count: 0, name: "Miner", cost: { food: 15 }, rate: 0.5, alignment: 'industry' },
    squire: { count: 0, name: "Squire", cost: { food: 50 }, damage: 1, alignment: 'order' },
    acolyte: { count: 0, name: "Acolyte", cost: { food: 50, gold: 5 }, rate: 0.2, alignment: 'chaos' }
  });

  const upgrades = ref({
    steelAxes: { name: "Steel Axes", cost: { gold: 10 }, owned: false, desc: "Wood production x2" },
    ironPicks: { name: "Iron Picks", cost: { gold: 20 }, owned: false, desc: "Stone production x2" },
    broadswords: { name: "Broadswords", cost: { gold: 50 }, owned: false, desc: "Squire Damage +1" },
  });

  const spells = ref({
    growth: { name: "Nature's Boon", cost: { mana: 10 }, cooldown: 0, maxCooldown: 60, desc: "Instantly grow 100 Wood & Food." },
    smite: { name: "Arcane Smite", cost: { mana: 20 }, cooldown: 0, maxCooldown: 10, desc: "Deal 50 Damage." },
    warp: { name: "Chrono Shift", cost: { mana: 50 }, cooldown: 0, maxCooldown: 300, desc: "Skip 30s time." }
  });

  // NEW: ZONES CONFIG
  const zones = [
    { id: 0, name: "Rat Cellar", enemy: "Giant Rat", symbol: "r", hp: 20, dmg: 0, reward: { gold: 2, food: 5 }, color: "#e33" },
    { id: 1, name: "Dark Forest", enemy: "Dire Wolf", symbol: "w", hp: 50, dmg: 1, reward: { gold: 5, food: 20 }, color: "#94a3b8" },
    { id: 2, name: "Iron Mines", enemy: "Goblin", symbol: "g", hp: 100, dmg: 2, reward: { gold: 15, stone: 10 }, color: "#16a34a" },
    { id: 3, name: "Dragon's Peak", enemy: "Wyvern", symbol: "D", hp: 500, dmg: 10, reward: { gold: 100, mana: 5 }, color: "#a855f7" }
  ];

  const combat = ref({
    active: false,
    currentZone: 0,
    enemy: { 
      name: "Giant Rat", 
      symbol: "r", 
      hp: 20, 
      maxHp: 20, 
      color: "#e33",
      reward: { gold: 2, food: 5 } 
    }
  });

  const alignment = ref({ nature: 0, industry: 0, chaos: 0 });
  const log = ref([]);

  // --- COMPUTED ---
  const population = computed(() => 
    minions.value.woodcutter.count + minions.value.miner.count + 
    minions.value.squire.count + minions.value.farmer.count + minions.value.acolyte.count
  );
  
  const populationCap = computed(() => {
    let cap = 0;
    if (buildings.value.tent) cap += buildings.value.tent.count * buildings.value.tent.cap;
    if (buildings.value.hut) cap += buildings.value.hut.count * buildings.value.hut.cap;
    return cap;
  });

  // --- ACTIONS ---
  function addLog(msg, type = 'neutral') {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    log.value.unshift({ time, msg, type });
    if (log.value.length > 30) log.value.pop();
  }

  function gatherResource(type, amount) {
    resources.value[type] += amount;
    if (type === 'food') alignment.value.nature += 0.1;
    if (type === 'stone') alignment.value.industry += 0.1;
  }

  function checkCost(costObj) {
    for (const [res, amt] of Object.entries(costObj)) {
      if (resources.value[res] < amt) return false;
    }
    return true;
  }

  function payCost(costObj) {
    for (const [res, amt] of Object.entries(costObj)) {
      resources.value[res] -= amt;
    }
  }

  function buyBuilding(key) {
    const b = buildings.value[key];
    if (!b) return;
    if (checkCost(b.cost)) {
      payCost(b.cost);
      b.count++;
      addLog(`Constructed ${b.name}.`, 'build');
      if (key === 'farm') alignment.value.nature += 5;
      else if (key === 'library') alignment.value.chaos += 5;
      else alignment.value.industry += 2;
      
      if (key === 'barracks') combat.value.active = true;
    }
  }

  function buyMinion(key) {
    const m = minions.value[key];
    if (!m) return;
    if (population.value >= populationCap.value) {
      addLog("Not enough housing!", "error");
      return;
    }
    if (checkCost(m.cost)) {
      payCost(m.cost);
      m.count++;
      addLog(`Recruited ${m.name}.`, 'recruit');
    }
  }

  function buyUpgrade(key) {
    const u = upgrades.value[key];
    if (!u || u.owned) return;
    if (checkCost(u.cost)) {
      payCost(u.cost);
      u.owned = true;
      addLog(`Researched ${u.name}!`, 'build');
      alignment.value.industry += 5;
    }
  }

  function castSpell(key) {
    const s = spells.value[key];
    if (!s || s.cooldown > 0) return;
    if (checkCost(s.cost)) {
      payCost(s.cost);
      s.cooldown = s.maxCooldown;
      addLog(`Casted ${s.name}!`, 'magic');
      alignment.value.chaos += 2;

      if (key === 'growth') { resources.value.wood += 100; resources.value.food += 100; }
      if (key === 'smite' && combat.value.active) {
        combat.value.enemy.hp -= 50;
        checkEnemyDeath();
      }
      if (key === 'warp') { for(let i=0; i<30; i++) tick(false); }
    }
  }

  // NEW: Zone Changing
  function changeZone(direction) {
    const newIndex = combat.value.currentZone + direction;
    if (newIndex >= 0 && newIndex < zones.length) {
      combat.value.currentZone = newIndex;
      spawnEnemy();
      addLog(`Traveled to ${zones[newIndex].name}.`, 'neutral');
    }
  }

  function spawnEnemy() {
    const zone = zones[combat.value.currentZone];
    combat.value.enemy = {
      name: zone.enemy,
      symbol: zone.symbol,
      maxHp: zone.hp,
      hp: zone.hp,
      color: zone.color,
      reward: zone.reward
    };
  }

  function checkEnemyDeath() {
    if (combat.value.enemy.hp <= 0) {
      addLog(`Slain ${combat.value.enemy.name}!`, 'combat');
      // Grant Rewards
      const r = combat.value.enemy.reward;
      if (r.gold) resources.value.gold += r.gold;
      if (r.food) resources.value.food += r.food;
      if (r.stone) resources.value.stone += r.stone;
      if (r.mana) resources.value.mana += r.mana;
      
      alignment.value.chaos += 1;
      spawnEnemy(); // Respawn
    }
  }

  // GAME LOOP
  function tick(atmosphere = true) {
    const woodMult = upgrades.value.steelAxes.owned ? 2 : 1;
    const stoneMult = upgrades.value.ironPicks.owned ? 2 : 1;
    const dmgBonus = upgrades.value.broadswords.owned ? 1 : 0;

    // Production
    if (minions.value.woodcutter.count > 0) {
      resources.value.wood += (minions.value.woodcutter.count * minions.value.woodcutter.rate * woodMult);
      if(atmosphere) alignment.value.nature += 0.01 * minions.value.woodcutter.count;
    }
    if (minions.value.miner.count > 0) {
      resources.value.stone += (minions.value.miner.count * minions.value.miner.rate * stoneMult);
      if(atmosphere) alignment.value.industry += 0.01 * minions.value.miner.count;
    }
    if (minions.value.farmer.count > 0) {
      resources.value.food += (minions.value.farmer.count * minions.value.farmer.rate);
      if(atmosphere) alignment.value.nature += 0.02 * minions.value.farmer.count;
    }
    if (minions.value.acolyte.count > 0) {
      resources.value.mana += (minions.value.acolyte.count * minions.value.acolyte.rate);
      if(atmosphere) alignment.value.chaos += 0.05 * minions.value.acolyte.count;
    }

    // Cooldowns
    for (const key in spells.value) {
      if (spells.value[key].cooldown > 0) spells.value[key].cooldown--;
    }

    // Combat
    if (combat.value.active && minions.value.squire.count > 0) {
      const totalDmg = minions.value.squire.count * (minions.value.squire.damage + dmgBonus);
      combat.value.enemy.hp -= totalDmg;
      checkEnemyDeath();
    }

    if (atmosphere && Math.random() < 0.01) triggerAtmosphere();
  }

  function triggerAtmosphere() {
    const nature = alignment.value.nature;
    const chaos = alignment.value.chaos;
    if (chaos > nature && chaos > 20) addLog("Shadows flicker near the fire.", "magic");
    else if (nature > 50) addLog("The crops whisper in the wind.", "nature");
  }

  // --- PERSISTENCE ---
  const savedState = localStorage.getItem('camp-idle-save');
  if (savedState) {
    const parsed = JSON.parse(savedState);
    if (parsed.resources) Object.assign(resources.value, parsed.resources);
    
    if (parsed.buildings) {
      for (const key in buildings.value) {
        if (parsed.buildings[key]) buildings.value[key].count = parsed.buildings[key].count;
      }
    }
    if (parsed.minions) {
      for (const key in minions.value) {
        if (parsed.minions[key]) minions.value[key].count = parsed.minions[key].count;
      }
    }
    if (parsed.upgrades) {
      for (const key in upgrades.value) {
        if (parsed.upgrades[key]) upgrades.value[key].owned = parsed.upgrades[key].owned;
      }
    }
    if (parsed.spells) {
      for (const key in spells.value) {
        if (parsed.spells[key]) spells.value[key].cooldown = parsed.spells[key].cooldown;
      }
    }
    
    if (parsed.alignment) alignment.value = parsed.alignment;
    if (parsed.combat) {
      combat.value.active = parsed.combat.active;
      combat.value.currentZone = parsed.combat.currentZone || 0;
      // Re-init enemy based on zone to ensure correct stats if code changed
      spawnEnemy(); 
    }
  }

  watch([resources, buildings, minions, alignment, combat, upgrades, spells], () => {
    localStorage.setItem('camp-idle-save', JSON.stringify({
      resources: resources.value,
      buildings: buildings.value,
      minions: minions.value,
      alignment: alignment.value,
      combat: combat.value,
      upgrades: upgrades.value,
      spells: spells.value
    }));
  }, { deep: true });

  return {
    resources, buildings, minions, log, population, populationCap, combat, upgrades, spells, zones,
    gatherResource, buyBuilding, buyMinion, buyUpgrade, castSpell, changeZone, tick
  };
});