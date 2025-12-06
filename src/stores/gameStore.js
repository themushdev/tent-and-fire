import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useGameStore = defineStore('game', () => {
  // --- STATE ---
  const resources = ref({ wood: 0, food: 0, stone: 0, gold: 0, mana: 0 });
  const inventory = ref({ unidentified: 0 }); 
  const deity = ref(null);

  const legacy = ref({
    runs: 0, amber: 0,
    upgrades: {
      titanGrip: { name: "Titan's Grip", desc: "Production +50%", level: 0, cost: 10 },
      starterKit: { name: "Merchant's Guild", desc: "Start with 100 Gold", level: 0, cost: 25 },
      ancientKnowledge: { name: "Ancient Knowledge", desc: "Start with Library", level: 0, cost: 50, max: 1 }
    }
  });

  const buildings = ref(getInitialBuildings());
  const minions = ref(getInitialMinions());
  const upgrades = ref(getInitialUpgrades());
  const spells = ref(getInitialSpells());

  const discoveredRelics = ref([]); 
  const relicDatabase = [
    { id: 'coin', name: "Ancient Coin", desc: "Gold Drops +20%", lore: "Minted during the Golden Age.", buff: { stat: 'gold', val: 0.2 } },
    { id: 'petrified', name: "Petrified Root", desc: "Wood Prod +10%", lore: "A piece of the World Tree.", buff: { stat: 'wood', val: 0.1 } },
    { id: 'canary', name: "Bone Canary", desc: "Stone Prod +10%", lore: "It doesn't sing.", buff: { stat: 'stone', val: 0.1 } },
    { id: 'rat_tail', name: "Rat King's Tail", desc: "Dmg vs Rats +2", lore: "A trophy from the plague.", buff: { stat: 'dmg_rat', val: 2 } },
    { id: 'prism', name: "Shattered Prism", desc: "Mana Gen +10%", lore: "It hums under the moon.", buff: { stat: 'mana', val: 0.1 } }
  ];

  const quests = ref([]); 
  const reputation = ref(0);
  const totalQuestsCompleted = ref(0);

  const zones = [
    { id: 0, name: "Rat Cellar", enemy: "Giant Rat", symbol: "r", hp: 20, dmg: 0, reward: { gold: 2, food: 5 }, color: "#e33" },
    { id: 1, name: "Dark Forest", enemy: "Dire Wolf", symbol: "w", hp: 50, dmg: 1, reward: { gold: 5, food: 20 }, color: "#94a3b8" },
    { id: 2, name: "Iron Mines", enemy: "Goblin", symbol: "g", hp: 100, dmg: 2, reward: { gold: 15, stone: 10 }, color: "#16a34a" },
    { id: 3, name: "Dragon's Peak", enemy: "Wyvern", symbol: "D", hp: 500, dmg: 10, reward: { gold: 100, mana: 5 }, color: "#a855f7" }
  ];

  const combat = ref({
    active: false,
    currentZone: 0,
    enemy: { name: "Giant Rat", symbol: "r", hp: 20, maxHp: 20, color: "#e33", reward: { gold: 2, food: 5 } }
  });

  const alignment = ref({ nature: 0, industry: 0, chaos: 0 });
  const log = ref([]);

  // --- INITIALIZERS ---
  function getInitialBuildings() {
    return {
      tent: { count: 1, name: "Tattered Tent", desc: "Base population.", cap: 2 },
      hut: { count: 0, name: "Wooden Hut", cost: { wood: 50 }, cap: 3, desc: "Simple shelter." },
      farm: { count: 0, name: "Wheat Field", cost: { wood: 100, stone: 10 }, desc: "Unlocks farming." },
      barracks: { count: 0, name: "Barracks", cost: { wood: 100, stone: 20 }, desc: "Unlocks combat." },
      archery: { count: 0, name: "Archery Range", cost: { wood: 300, gold: 50 }, desc: "Unlocks Rangers." }, 
      temple: { count: 0, name: "Temple", cost: { stone: 400, gold: 100 }, desc: "Unlocks Mages." }, 
      smithy: { count: 0, name: "Smithy", cost: { wood: 200, stone: 100 }, desc: "Unlocks upgrades." },
      library: { count: 0, name: "Arcane Library", cost: { wood: 300, stone: 150, gold: 10 }, desc: "Unlocks magic." },
      citadel: { count: 0, name: "The Citadel", cost: { wood: 1000, stone: 500, gold: 100, mana: 500 }, desc: "Ascend." },
      campfire: { count: 0, name: "Campfire", cost: { wood: 10 }, desc: "Warmth." },
    };
  }

  function getInitialMinions() {
    return {
      woodcutter: { count: 0, name: "Woodcutter", cost: { food: 10 }, rate: 1, alignment: 'nature' },
      farmer: { count: 0, name: "Farmer", cost: { food: 20 }, rate: 1, alignment: 'nature' },
      miner: { count: 0, name: "Miner", cost: { food: 15 }, rate: 0.5, alignment: 'industry' },
      squire: { count: 0, name: "Squire", cost: { food: 50 }, damage: 1, alignment: 'order' },
      knight: { count: 0, name: "Knight", damage: 5, alignment: 'order' }, 
      ranger: { count: 0, name: "Ranger", damage: 3, alignment: 'nature' }, 
      acolyte: { count: 0, name: "Acolyte", cost: { food: 50, gold: 5 }, rate: 0.2, alignment: 'chaos' },
      mage: { count: 0, name: "Mage", damage: 8, rate: 0.5, alignment: 'chaos' }
    };
  }

  function getInitialUpgrades() {
    return {
      steelAxes: { name: "Steel Axes", cost: { gold: 10 }, owned: false, desc: "Wood production x2" },
      ironPicks: { name: "Iron Picks", cost: { gold: 20 }, owned: false, desc: "Stone production x2" },
      broadswords: { name: "Broadswords", cost: { gold: 50 }, owned: false, desc: "Squire Damage +1" },
    };
  }

  function getInitialSpells() {
    return {
      growth: { name: "Nature's Boon", cost: { mana: 10 }, cooldown: 0, maxCooldown: 60, desc: "Instantly grow 100 Wood & Food." },
      smite: { name: "Arcane Smite", cost: { mana: 20 }, cooldown: 0, maxCooldown: 10, desc: "Deal 50 Damage." },
      warp: { name: "Chrono Shift", cost: { mana: 50 }, cooldown: 0, maxCooldown: 300, desc: "Skip 30s time." }
    };
  }

  const population = computed(() => 
    minions.value.woodcutter.count + minions.value.miner.count + 
    minions.value.squire.count + minions.value.knight.count + minions.value.ranger.count +
    minions.value.farmer.count + 
    minions.value.acolyte.count + minions.value.mage.count
  );
  
  const populationCap = computed(() => {
    let cap = 0;
    if (buildings.value.tent) cap += buildings.value.tent.count * buildings.value.tent.cap;
    if (buildings.value.hut) cap += buildings.value.hut.count * buildings.value.hut.cap;
    return cap;
  });

  const potentialAmber = computed(() => Math.floor(population.value / 5));

  const relicBonuses = computed(() => {
    const bonuses = { wood: 1, stone: 1, gold: 1, mana: 1, dmg_rat: 0 };
    discoveredRelics.value.forEach(rId => {
      const r = relicDatabase.find(db => db.id === rId);
      if (r && r.buff) if (bonuses[r.buff.stat] !== undefined) bonuses[r.buff.stat] += r.buff.val;
    });
    return bonuses;
  });

  // --- ACTIONS ---
  function addLog(msg, type = 'neutral') {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    // Increase log limit since we have 3 columns now
    log.value.unshift({ time, msg, type });
    if (log.value.length > 60) log.value.pop();
  }

  function gatherResource(type, amount) {
    resources.value[type] += amount;
    checkQuestProgress('gather', type, amount);
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
      addLog(`Constructed ${b.name}.`, 'build'); // CIVILIZATION
      if (key === 'farm') alignment.value.nature += 5;
      else if (key === 'library' || key === 'temple') alignment.value.chaos += 5;
      else if (key === 'citadel') addLog("THE END IS NIGH.", "magic");
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
      addLog(`Recruited ${m.name}.`, 'recruit'); // CIVILIZATION
    }
  }

  function promoteMinion(fromKey, toKey, cost) {
    if (minions.value[fromKey].count <= 0) {
      addLog(`Need ${minions.value[fromKey].name} to promote!`, 'error');
      return;
    }
    if (checkCost(cost)) {
      payCost(cost);
      minions.value[fromKey].count--;
      minions.value[toKey].count++;
      addLog(`Promoted ${minions.value[fromKey].name} to ${minions.value[toKey].name}!`, 'recruit'); // CIVILIZATION
    }
  }

  function worshipDeity(choice) {
    if (deity.value) return;
    deity.value = choice;
    
    if (choice === 'sylva') {
      addLog("Sylva, the Mother Tree, embraces you.", 'nature'); // AETHER
      minions.value.woodcutter.name = "Treant Sapling";
      minions.value.woodcutter.cost = { wood: 50 }; 
      minions.value.farmer.name = "Dryad";
      minions.value.farmer.cost = { wood: 50 };
    } else if (choice === 'crom') {
      addLog("Crom, God of Steel, forges you anew.", 'industry'); // AETHER
      minions.value.miner.name = "Automaton";
      minions.value.miner.cost = { stone: 50 }; 
    } else if (choice === 'xol') {
      addLog("Xol, the Void, whispers secrets.", 'magic'); // AETHER
      minions.value.acolyte.name = "Cultist";
      minions.value.mage.name = "Warlock";
    }
  }

  function buyUpgrade(key) {
    const u = upgrades.value[key];
    if (!u || u.owned) return;
    if (checkCost(u.cost)) {
      payCost(u.cost);
      u.owned = true;
      addLog(`Researched ${u.name}!`, 'build'); // CIVILIZATION
      alignment.value.industry += 5;
    }
  }

  function castSpell(key) {
    const s = spells.value[key];
    if (!s || s.cooldown > 0) return;
    if (checkCost(s.cost)) {
      payCost(s.cost);
      s.cooldown = s.maxCooldown;
      addLog(`Casted ${s.name}!`, 'magic'); // AETHER
      alignment.value.chaos += 2;

      if (key === 'growth') { resources.value.wood += 100; resources.value.food += 100; }
      if (key === 'smite' && combat.value.active) {
        combat.value.enemy.hp -= 50;
        checkEnemyDeath();
      }
      if (key === 'warp') { for(let i=0; i<30; i++) tick(false); }
    }
  }

  function identifyArtifact() {
    if (inventory.value.unidentified <= 0) return;
    if (resources.value.mana < 50) return;
    resources.value.mana -= 50;
    inventory.value.unidentified--;
    const potential = relicDatabase.filter(r => !discoveredRelics.value.includes(r.id));
    if (potential.length > 0) {
      const found = potential[Math.floor(Math.random() * potential.length)];
      discoveredRelics.value.push(found.id);
      addLog(`Identified: ${found.name}!`, 'magic'); // AETHER
    } else {
      addLog("The artifact crumbles (Duplicate).", 'error');
      resources.value.gold += 50;
    }
  }

  function changeZone(direction) {
    const newIndex = combat.value.currentZone + direction;
    if (newIndex >= 0 && newIndex < zones.length) {
      combat.value.currentZone = newIndex;
      spawnEnemy();
      addLog(`Traveled to ${zones[newIndex].name}.`, 'neutral'); // FRONTLINE
    }
  }

  function spawnEnemy() {
    const zone = zones[combat.value.currentZone];
    combat.value.enemy = {
      name: zone.enemy, symbol: zone.symbol, maxHp: zone.hp, hp: zone.hp, 
      color: zone.color, reward: zone.reward
    };
  }

  function checkEnemyDeath() {
    if (combat.value.enemy.hp <= 0) {
      addLog(`Slain ${combat.value.enemy.name}!`, 'combat'); // FRONTLINE
      const r = combat.value.enemy.reward;
      const goldMult = relicBonuses.value.gold;
      if (r.gold) resources.value.gold += (r.gold * goldMult);
      if (r.food) resources.value.food += r.food;
      if (r.stone) resources.value.stone += r.stone;
      if (r.mana) resources.value.mana += r.mana;
      
      if (Math.random() < 0.005) {
        inventory.value.unidentified++;
        addLog("Found an Unidentified Artifact!", 'loot'); // FRONTLINE
      }
      alignment.value.chaos += 1;
      checkQuestProgress('kill', combat.value.enemy.name, 1);
      spawnEnemy();
    }
  }

  function generateQuest() {
    if (quests.value.length >= 3) return; 
    const types = ['gather', 'kill'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Date.now() + Math.random();
    let quest = {};
    if (type === 'gather') {
      const resTypes = ['wood', 'stone', 'food'];
      const res = resTypes[Math.floor(Math.random() * resTypes.length)];
      const amount = 50 + (reputation.value * 10) + Math.floor(Math.random() * 50);
      const goldReward = 5 + Math.floor(amount / 20);
      quest = { id, type: 'gather', target: res, amount, current: 0, title: `Supply ${res}`, desc: `Gather ${amount} ${res}.`, reward: { gold: goldReward }, time: 120 };
    } else if (type === 'kill') {
      const zone = zones[combat.value.currentZone]; 
      const amount = 3 + Math.floor(reputation.value / 5);
      const goldReward = 10 + (amount * 2);
      quest = { id, type: 'kill', target: zone.enemy, amount, current: 0, title: `Hunt ${zone.enemy}`, desc: `Slay ${amount} ${zone.enemy}s.`, reward: { gold: goldReward }, time: 180 };
    }
    quests.value.push(quest);
    addLog(`New Quest: ${quest.title}`, 'build'); // CIVILIZATION
  }

  function checkQuestProgress(type, target, amount) {
    quests.value.forEach(q => {
      if (q.type === type && q.target === target && q.current < q.amount) {
        q.current += amount;
        if (q.current > q.amount) q.current = q.amount;
      }
    });
  }

  function completeQuest(id) {
    const idx = quests.value.findIndex(q => q.id === id);
    if (idx === -1) return;
    const q = quests.value[idx];
    if (q.current >= q.amount) {
      resources.value.gold += q.reward.gold;
      reputation.value += 1;
      totalQuestsCompleted.value += 1;
      addLog(`Completed: ${q.title} (+${q.reward.gold}G)`, 'loot'); // FRONTLINE/ECO
      quests.value.splice(idx, 1);
    }
  }

  function buyLegacyUpgrade(key) {
    const up = legacy.value.upgrades[key];
    if (legacy.value.amber >= up.cost) {
      if (up.max && up.level >= up.max) return;
      legacy.value.amber -= up.cost;
      up.level++;
    }
  }

  function ascend() {
    legacy.value.amber += potentialAmber.value;
    legacy.value.runs += 1;
    resources.value = { wood: 0, food: 0, stone: 0, gold: 0, mana: 0 };
    deity.value = null; 
    buildings.value = getInitialBuildings();
    minions.value = getInitialMinions();
    upgrades.value = getInitialUpgrades();
    spells.value = getInitialSpells();
    combat.value = { active: false, currentZone: 0, enemy: zones[0] };
    spawnEnemy();
    alignment.value = { nature: 0, industry: 0, chaos: 0 };
    quests.value = []; 
    reputation.value = 0;
    inventory.value.unidentified = 0;
    discoveredRelics.value = []; 
    log.value = [];
    addLog(`World Reset. Run #${legacy.value.runs + 1} started.`, 'magic'); // AETHER
    if (legacy.value.upgrades.starterKit.level > 0) resources.value.gold += 100;
    if (legacy.value.upgrades.ancientKnowledge.level > 0) {
      buildings.value.library.count = 1;
      addLog("Ancient knowledge restored the Library.", "magic");
    }
  }

  function tick(atmosphere = true) {
    const legacyMult = 1 + (legacy.value.upgrades.titanGrip.level * 0.5);
    const relicWood = relicBonuses.value.wood;
    const relicStone = relicBonuses.value.stone;
    const relicMana = relicBonuses.value.mana;

    const woodMult = (upgrades.value.steelAxes.owned ? 2 : 1) * legacyMult * relicWood;
    const stoneMult = (upgrades.value.ironPicks.owned ? 2 : 1) * legacyMult * relicStone;
    const farmMult = legacyMult;
    const manaMult = legacyMult * relicMana;
    const dmgBonus = (upgrades.value.broadswords.owned ? 1 : 0);

    let godWood = deity.value === 'sylva' ? 2 : 1;
    let godStone = deity.value === 'crom' ? 2 : 1;
    let godMana = deity.value === 'xol' ? 2 : 1;

    if (minions.value.woodcutter.count > 0) {
      const amt = minions.value.woodcutter.count * minions.value.woodcutter.rate * woodMult * godWood;
      resources.value.wood += amt;
      checkQuestProgress('gather', 'wood', amt);
      if(atmosphere) alignment.value.nature += 0.01 * minions.value.woodcutter.count;
    }
    if (minions.value.miner.count > 0) {
      const amt = minions.value.miner.count * minions.value.miner.rate * stoneMult * godStone;
      resources.value.stone += amt;
      checkQuestProgress('gather', 'stone', amt);
      if(atmosphere) alignment.value.industry += 0.01 * minions.value.miner.count;
    }
    if (minions.value.farmer.count > 0) {
      const amt = minions.value.farmer.count * minions.value.farmer.rate * farmMult * godWood;
      resources.value.food += amt;
      checkQuestProgress('gather', 'food', amt);
      if(atmosphere) alignment.value.nature += 0.02 * minions.value.farmer.count;
    }
    const acolyteMana = minions.value.acolyte.count * minions.value.acolyte.rate;
    const mageMana = minions.value.mage.count * minions.value.mage.rate;
    if (acolyteMana + mageMana > 0) {
      resources.value.mana += (acolyteMana + mageMana) * manaMult * godMana;
      if(atmosphere) alignment.value.chaos += 0.05 * (minions.value.acolyte.count + minions.value.mage.count);
    }

    if (Math.random() < 0.05) generateQuest();
    for (let i = quests.value.length - 1; i >= 0; i--) {
      quests.value[i].time -= 1;
      if (quests.value[i].time <= 0) {
        addLog(`Quest Expired: ${quests.value[i].title}`, 'error');
        quests.value.splice(i, 1);
      }
    }

    for (const key in spells.value) { if (spells.value[key].cooldown > 0) spells.value[key].cooldown--; }

    if (combat.value.active) {
      let totalDmg = 0;
      let bonusDmg = dmgBonus;
      if (combat.value.enemy.name === 'Giant Rat') bonusDmg += relicBonuses.value.dmg_rat;

      totalDmg += minions.value.squire.count * (minions.value.squire.damage + bonusDmg);
      totalDmg += minions.value.knight.count * minions.value.knight.damage;
      totalDmg += minions.value.ranger.count * minions.value.ranger.damage;
      const mageDmg = minions.value.mage.count * minions.value.mage.damage * (deity.value === 'xol' ? 2 : 1);
      totalDmg += mageDmg;

      if (totalDmg > 0) {
        combat.value.enemy.hp -= totalDmg;
        checkEnemyDeath();
      }
    }

    if (atmosphere && Math.random() < 0.01) triggerAtmosphere();
  }

  function triggerAtmosphere() {
    const nature = alignment.value.nature;
    const chaos = alignment.value.chaos;
    if (chaos > nature && chaos > 20) addLog("Reality thins around the edges.", "magic"); // AETHER
    else if (nature > 50) addLog("The forest is watching you.", "nature"); // AETHER
  }

  // Persistence block omitted for brevity, assumes same logic as before but saving all new state
  const savedState = localStorage.getItem('camp-idle-save');
  if (savedState) {
    const parsed = JSON.parse(savedState);
    if (parsed.resources) Object.assign(resources.value, parsed.resources);
    if (parsed.legacy) legacy.value = parsed.legacy;
    if (parsed.quests) quests.value = parsed.quests;
    if (parsed.reputation) reputation.value = parsed.reputation;
    if (parsed.inventory) inventory.value = parsed.inventory; 
    if (parsed.discoveredRelics) discoveredRelics.value = parsed.discoveredRelics; 
    if (parsed.deity) deity.value = parsed.deity;

    if (parsed.buildings) {
      for (const key in buildings.value) { if (parsed.buildings[key]) buildings.value[key].count = parsed.buildings[key].count; }
    }
    if (parsed.minions) {
      for (const key in minions.value) { 
        if (parsed.minions[key]) {
          minions.value[key].count = parsed.minions[key].count;
          if (parsed.minions[key].name) minions.value[key].name = parsed.minions[key].name;
          if (parsed.minions[key].cost) minions.value[key].cost = parsed.minions[key].cost;
        }
      }
    }
    if (parsed.upgrades) {
      for (const key in upgrades.value) { if (parsed.upgrades[key]) upgrades.value[key].owned = parsed.upgrades[key].owned; }
    }
    if (parsed.spells) {
      for (const key in spells.value) { if (parsed.spells[key]) spells.value[key].cooldown = parsed.spells[key].cooldown; }
    }
    if (parsed.alignment) alignment.value = parsed.alignment;
    if (parsed.combat) {
      combat.value.active = parsed.combat.active;
      combat.value.currentZone = parsed.combat.currentZone || 0;
      spawnEnemy(); 
    }
  }

  watch([resources, buildings, minions, alignment, combat, upgrades, spells, legacy, quests, reputation, inventory, discoveredRelics, deity], () => {
    localStorage.setItem('camp-idle-save', JSON.stringify({
      resources: resources.value,
      buildings: buildings.value,
      minions: minions.value,
      alignment: alignment.value,
      combat: combat.value,
      upgrades: upgrades.value,
      spells: spells.value,
      legacy: legacy.value,
      quests: quests.value,
      reputation: reputation.value,
      inventory: inventory.value,
      discoveredRelics: discoveredRelics.value,
      deity: deity.value
    }));
  }, { deep: true });

  return {
    resources, buildings, minions, log, population, populationCap, combat, upgrades, spells, zones, legacy, potentialAmber, quests, reputation, inventory, discoveredRelics, relicDatabase, alignment, deity,
    gatherResource, buyBuilding, buyMinion, buyUpgrade, castSpell, changeZone, buyLegacyUpgrade, ascend, tick, completeQuest, identifyArtifact, promoteMinion, worshipDeity
  };
});