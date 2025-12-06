<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useGameStore } from './stores/gameStore'; 
import AsciiDiorama from './components/AsciiDiorama.vue';
import AsciiScenic from './components/AsciiScenic.vue';

const store = useGameStore();
const currentView = ref('map'); 
const rightTab = ref('command'); 
const showAscensionModal = ref(false);

let loopId;
onMounted(() => {
  loopId = setInterval(() => store.tick(), 1000);
});
onUnmounted(() => clearInterval(loopId));

function handleAscend() {
  store.ascend();
  showAscensionModal.value = false;
}

function getLogClass(type) {
  if (type === 'error') return 'text-red-500';
  if (type === 'combat') return 'text-red-400 font-bold';
  if (type === 'nature') return 'text-emerald-400';
  if (type === 'industry') return 'text-amber-400';
  if (type === 'build') return 'text-blue-400';
  if (type === 'recruit') return 'text-green-400';
  if (type === 'loot') return 'text-yellow-400 font-bold';
  if (type === 'magic') return 'text-purple-400 font-bold';
  return 'text-green-500';
}

const enemyHpBar = computed(() => {
  if (!store.combat.active) return "";
  const max = 20; 
  const percent = store.combat.enemy.hp / store.combat.enemy.maxHp;
  const filled = Math.floor(max * percent);
  const empty = max - filled;
  return "[" + "=".repeat(filled) + ".".repeat(empty) + "]";
});

const currentZoneName = computed(() => store.zones[store.combat.currentZone].name);
const ownedRelics = computed(() => {
  return store.discoveredRelics.map(id => store.relicDatabase.find(r => r.id === id)).filter(Boolean);
});

// LOG FILTERS
const civilizationLog = computed(() => store.log.filter(l => ['build', 'recruit', 'error'].includes(l.type)));
const combatLog = computed(() => store.log.filter(l => ['combat', 'loot', 'neutral'].includes(l.type)));
const aetherLog = computed(() => store.log.filter(l => ['magic', 'nature', 'industry', 'chaos'].includes(l.type)));

</script>

<template>
  <div class="min-h-screen bg-black text-green-500 p-8 font-mono selection:bg-green-900 selection:text-white overflow-hidden">
    
    <div v-if="showAscensionModal || (store.buildings.citadel && store.buildings.citadel.count > 0 && !showAscensionModal)" class="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div class="border-bloom p-8 max-w-md w-full bg-black text-center">
        <h2 class="text-3xl font-bold title-glow text-cyan-400 mb-4">THE CITADEL IS COMPLETE</h2>
        <p class="text-gray-400 mb-6">The cycle is complete. Will you ascend?</p>
        <div class="bg-gray-900 p-4 mb-6 text-left border border-gray-700">
          <div class="flex justify-between text-lg mb-2"><span>Population:</span> <span class="text-white">{{ store.population }}</span></div>
          <div class="flex justify-between text-lg text-amber-500 font-bold"><span>Amber Gain:</span> <span>+{{ store.potentialAmber }}</span></div>
        </div>
        <button @click="handleAscend" class="btn-retro w-full border border-cyan-500 text-cyan-400 py-3 text-xl hover:bg-cyan-900/30 mb-2">[ ASCEND ]</button>
        <button @click="showAscensionModal = false" class="text-xs text-gray-500 hover:text-white">Wait, I have more to do...</button>
      </div>
    </div>

    <div class="flex justify-between border-b border-green-900 pb-2 mb-4 h-12">
      <h1 class="text-3xl font-bold title-glow">Tent & Fire <span v-if="store.legacy.runs > 0" class="text-xs text-amber-500 ml-2">Run {{ store.legacy.runs + 1 }}</span></h1>
      <div class="flex gap-4 items-end">
        <span class="text-xs text-gray-500">[AUTO-SAVING]</span>
        <div class="text-right leading-none">
          <div class="text-[10px] text-gray-400">POPULATION</div>
          <div class="text-xl font-bold">{{ store.population }} / {{ store.populationCap }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      
      <div class="col-span-8 flex flex-col gap-4 h-full">
        <div class="flex gap-2 shrink-0">
          <button @click="currentView = 'map'" :class="currentView === 'map' ? 'bg-green-900 text-black shadow-[0_0_10px_#4af626]' : 'text-gray-500 hover:text-green-500'" class="px-4 py-1 border border-green-900 text-xs transition-all uppercase">[ Tactical Map ]</button>
          <button @click="currentView = 'scenic'" :class="currentView === 'scenic' ? 'bg-green-900 text-black shadow-[0_0_10px_#4af626]' : 'text-gray-500 hover:text-green-500'" class="px-4 py-1 border border-green-900 text-xs transition-all uppercase">[ Scenic View ]</button>
        </div>

        <div class="flex-grow bg-black/50 p-4 border-bloom relative">
          <AsciiDiorama v-if="currentView === 'map'" />
          <AsciiScenic v-else />
        </div>
        
        <div class="h-48 shrink-0 grid grid-cols-3 gap-2 text-xs font-mono">
          
          <div class="border-bloom bg-black/50 flex flex-col">
            <div class="bg-green-900/30 text-green-300 px-2 py-1 uppercase tracking-widest text-[10px] border-b border-green-900">Civilization</div>
            <div class="overflow-y-auto p-2 space-y-1 scrollbar-hide h-full">
              <div v-for="(entry, index) in civilizationLog" :key="index" class="opacity-90">
                <span class="text-gray-600">[{{ entry.time }}]</span> <span :class="getLogClass(entry.type)">{{ entry.msg }}</span>
              </div>
            </div>
          </div>

          <div class="border-bloom bg-black/50 flex flex-col">
            <div class="bg-red-900/30 text-red-300 px-2 py-1 uppercase tracking-widest text-[10px] border-b border-red-900">Frontline</div>
            <div class="overflow-y-auto p-2 space-y-1 scrollbar-hide h-full">
              <div v-for="(entry, index) in combatLog" :key="index" class="opacity-90">
                <span class="text-gray-600">[{{ entry.time }}]</span> <span :class="getLogClass(entry.type)">{{ entry.msg }}</span>
              </div>
            </div>
          </div>

          <div class="border-bloom bg-black/50 flex flex-col">
            <div class="bg-purple-900/30 text-purple-300 px-2 py-1 uppercase tracking-widest text-[10px] border-b border-purple-900">The Aether</div>
            <div class="overflow-y-auto p-2 space-y-1 scrollbar-hide h-full">
              <div v-for="(entry, index) in aetherLog" :key="index" class="opacity-90">
                <span class="text-gray-600">[{{ entry.time }}]</span> <span :class="getLogClass(entry.type)">{{ entry.msg }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="col-span-4 flex flex-col gap-4 h-full">
        <div class="border-bloom p-3 bg-green-900/5 shrink-0">
          <h2 class="text-sm text-green-700 border-b border-green-900/50 mb-2">> STOCKPILE</h2>
          <div class="grid grid-cols-3 gap-2 text-sm">
            <div><div class="text-[10px] text-green-800">WOOD</div><div class="font-bold">{{ store.resources.wood.toFixed(0) }}</div></div>
            <div><div class="text-[10px] text-green-800">FOOD</div><div class="font-bold">{{ store.resources.food.toFixed(0) }}</div></div>
            <div><div class="text-[10px] text-gray-600">STONE</div><div class="font-bold text-gray-400">{{ store.resources.stone.toFixed(0) }}</div></div>
            <div><div class="text-[10px] text-yellow-800">GOLD</div><div class="font-bold text-yellow-500">{{ store.resources.gold.toFixed(0) }}</div></div>
            <div v-if="store.buildings.library.count > 0"><div class="text-[10px] text-purple-800">MANA</div><div class="font-bold text-purple-400 title-glow">{{ store.resources.mana.toFixed(0) }}</div></div>
            <div v-if="store.legacy.runs > 0"><div class="text-[10px] text-amber-800">AMBER</div><div class="font-bold text-amber-500">{{ store.legacy.amber }}</div></div>
          </div>
        </div>

        <div v-if="store.combat.active" class="border border-red-900/50 p-3 bg-red-900/5 shrink-0">
          <div class="flex justify-between items-center mb-2 bg-black p-1 border border-red-900/30">
            <button @click="store.changeZone(-1)" class="text-gray-500 hover:text-white px-2">&lt;</button>
            <div class="text-xs font-bold text-red-300 uppercase tracking-widest">{{ currentZoneName }}</div>
            <button @click="store.changeZone(1)" class="text-gray-500 hover:text-white px-2">&gt;</button>
          </div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-red-400" :style="{ color: store.combat.enemy.color }">{{ store.combat.enemy.name }}</span>
            <span class="text-gray-500">{{ Math.floor(store.combat.enemy.hp) }} HP</span>
          </div>
          <div class="font-mono text-red-600 text-xs tracking-tighter">{{ enemyHpBar }}</div>
          <div class="text-[10px] text-gray-500 mt-1">
            Units: {{ store.minions.squire.count }} S | {{ store.minions.knight.count }} K | {{ store.minions.ranger.count }} R | {{ store.minions.mage.count }} W
          </div>
        </div>

        <div class="flex border-b border-green-900 shrink-0">
          <button @click="rightTab = 'command'" :class="rightTab === 'command' ? 'bg-green-900 text-black' : 'text-gray-600 hover:text-green-500'" class="flex-1 py-1 text-xs font-bold transition-all border-r border-green-900">CMD</button>
          <button @click="rightTab = 'build'" :class="rightTab === 'build' ? 'bg-green-900 text-black' : 'text-gray-600 hover:text-green-500'" class="flex-1 py-1 text-xs font-bold transition-all border-r border-green-900">BUILD</button>
          <button @click="rightTab = 'quests'" :class="rightTab === 'quests' ? 'bg-green-900 text-black' : 'text-gray-600 hover:text-green-500'" class="flex-1 py-1 text-xs font-bold transition-all border-r border-green-900">QUESTS <span v-if="store.quests.length > 0" class="text-yellow-400 animate-pulse">!</span></button>
          <button v-if="store.buildings.smithy.count > 0" @click="rightTab = 'mystic'" :class="rightTab === 'mystic' ? 'bg-green-900 text-black' : 'text-gray-600 hover:text-green-500'" class="flex-1 py-1 text-xs font-bold transition-all border-r border-green-900">MAGIC <span v-if="store.inventory.unidentified > 0" class="text-purple-400 animate-pulse">!</span></button>
          <button v-if="store.legacy.runs > 0" @click="rightTab = 'legacy'" :class="rightTab === 'legacy' ? 'bg-amber-900 text-black' : 'text-gray-600 hover:text-amber-500'" class="flex-1 py-1 text-xs font-bold transition-all">LEGACY</button>
        </div>

        <div class="overflow-y-auto flex-grow p-1 pr-2 space-y-4">
          <div v-if="rightTab === 'command'" class="space-y-4">
            <div class="space-y-2">
              <div class="text-[10px] text-gray-600 uppercase tracking-widest border-b border-gray-800 mb-1">Manual</div>
              <button @click="store.gatherResource('wood', 1)" class="btn-retro w-full border border-green-800 py-2 text-sm hover:bg-green-900">[ GATHER WOOD ]</button>
              <button @click="store.gatherResource('food', 1)" class="btn-retro w-full border border-green-800 py-2 text-sm hover:bg-green-900">[ FORAGE FOOD ]</button>
              <button @click="store.gatherResource('stone', 1)" class="btn-retro w-full border border-gray-700 text-gray-400 py-2 text-sm hover:bg-gray-900">[ MINE STONE ]</button>
            </div>
            <div class="space-y-1">
              <div class="text-[10px] text-gray-600 uppercase tracking-widest border-b border-gray-800 mb-1">Recruitment</div>
              <button @click="store.buyMinion('woodcutter')" class="w-full text-left border border-green-800 text-green-400 hover:bg-green-900/30 py-1 px-2 text-xs flex justify-between"><span>> {{ store.minions.woodcutter.name }}</span> <span>{{ store.minions.woodcutter.cost.food ? store.minions.woodcutter.cost.food + 'F' : store.minions.woodcutter.cost.wood + 'W' }}</span></button>
              <button v-if="store.buildings.farm.count > 0" @click="store.buyMinion('farmer')" class="w-full text-left border border-yellow-800 text-yellow-400 hover:bg-yellow-900/30 py-1 px-2 text-xs flex justify-between"><span>> {{ store.minions.farmer.name }}</span> <span>{{ store.minions.farmer.cost.food ? store.minions.farmer.cost.food + 'F' : store.minions.farmer.cost.wood + 'W' }}</span></button>
              <button @click="store.buyMinion('miner')" class="w-full text-left border border-gray-700 text-gray-400 hover:bg-gray-900/30 py-1 px-2 text-xs flex justify-between"><span>> {{ store.minions.miner.name }}</span> <span>{{ store.minions.miner.cost.food ? store.minions.miner.cost.food + 'F' : store.minions.miner.cost.stone + 'S' }}</span></button>
              <button v-if="store.combat.active" @click="store.buyMinion('squire')" class="w-full text-left border border-blue-800 text-blue-400 hover:bg-blue-900/30 py-1 px-2 text-xs flex justify-between"><span>> Squire</span> <span>50 F</span></button>
              <button v-if="store.buildings.library.count > 0" @click="store.buyMinion('acolyte')" class="w-full text-left border border-purple-800 text-purple-400 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between"><span>> {{ store.minions.acolyte.name }}</span> <span>50F/5G</span></button>
            </div>
            <div v-if="store.combat.active" class="space-y-1 mt-4 border-t border-gray-800 pt-2">
              <div class="text-[10px] text-blue-400 uppercase tracking-widest border-b border-blue-900/30 mb-1">Promotions</div>
              <button v-if="store.buildings.barracks.count > 0" @click="store.promoteMinion('squire', 'knight', { stone: 100, gold: 10 })" class="w-full text-left border border-blue-600 text-blue-300 hover:bg-blue-900/30 py-1 px-2 text-xs flex justify-between"><span>> Promote Knight (5 Dmg)</span> <span>100S/10G</span></button>
              <button v-if="store.buildings.archery && store.buildings.archery.count > 0" @click="store.promoteMinion('squire', 'ranger', { wood: 100, gold: 10 })" class="w-full text-left border border-green-600 text-green-300 hover:bg-green-900/30 py-1 px-2 text-xs flex justify-between"><span>> Promote Ranger (3 Dmg)</span> <span>100W/10G</span></button>
              <button v-if="store.buildings.temple && store.buildings.temple.count > 0" @click="store.promoteMinion('acolyte', 'mage', { mana: 100, gold: 20 })" class="w-full text-left border border-purple-600 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between"><span>> Promote Mage (8 Dmg)</span> <span>100M/20G</span></button>
            </div>
          </div>

          <div v-if="rightTab === 'quests'" class="space-y-3">
            <div class="flex justify-between items-center border-b border-gray-800 pb-1">
              <div class="text-[10px] text-gray-600 uppercase tracking-widest">Notice Board</div>
              <div class="text-[10px] text-yellow-600">Reputation: {{ store.reputation }}</div>
            </div>
            <div v-if="store.quests.length === 0" class="text-gray-600 text-xs italic text-center py-4">No requests at the moment...</div>
            <div v-for="quest in store.quests" :key="quest.id" class="border border-green-900 p-2 bg-green-900/10">
              <div class="flex justify-between text-sm font-bold text-green-300"><span>{{ quest.title }}</span><span class="text-xs text-gray-500">{{ quest.time }}s</span></div>
              <div class="text-xs text-gray-400 mb-2">{{ quest.desc }}</div>
              <div class="w-full bg-gray-900 h-1 mb-2"><div class="bg-green-500 h-1 transition-all duration-300" :style="{ width: (quest.current / quest.amount * 100) + '%' }"></div></div>
              <div class="flex justify-between items-center">
                <div class="text-[10px] text-yellow-500">Reward: {{ quest.reward.gold }} Gold</div>
                <button @click="store.completeQuest(quest.id)" :disabled="quest.current < quest.amount" class="text-[10px] border border-green-700 px-2 py-1 uppercase hover:bg-green-900/50 disabled:opacity-50 disabled:border-gray-800">{{ quest.current >= quest.amount ? 'Claim Reward' : `${Math.floor(quest.current)}/${quest.amount}` }}</button>
              </div>
            </div>
          </div>

          <div v-if="rightTab === 'build'" class="space-y-2">
            <div class="text-[10px] text-gray-600 uppercase tracking-widest border-b border-gray-800 mb-1">Infrastructure</div>
            <button @click="store.buyBuilding('hut')" class="w-full text-left border border-amber-800 text-amber-500 hover:bg-amber-900/30 py-1 px-2 text-xs flex justify-between"><span>> Hut (+3 Pop)</span> <span>50 W</span></button>
            <button @click="store.buyBuilding('farm')" class="w-full text-left border border-yellow-800 text-yellow-500 hover:bg-yellow-900/30 py-1 px-2 text-xs flex justify-between"><span>> Wheat Field</span> <span>100W/10S</span></button>
            <button v-if="!store.combat.active" @click="store.buyBuilding('barracks')" class="w-full text-left border border-red-800 text-red-500 hover:bg-red-900/30 py-1 px-2 text-xs flex justify-between"><span>> Barracks</span> <span>100W/20S</span></button>
            <button v-if="store.combat.active" @click="store.buyBuilding('archery')" class="w-full text-left border border-green-800 text-green-500 hover:bg-green-900/30 py-1 px-2 text-xs flex justify-between"><span>> Archery Range</span> <span>300W/50G</span></button>
            <button v-if="store.combat.active" @click="store.buyBuilding('temple')" class="w-full text-left border border-purple-800 text-purple-500 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between"><span>> Temple</span> <span>400S/100G</span></button>
            <button v-if="store.combat.active && store.buildings.smithy.count === 0" @click="store.buyBuilding('smithy')" class="w-full text-left border border-gray-600 text-gray-400 hover:bg-gray-800/30 py-1 px-2 text-xs flex justify-between"><span>> Smithy</span> <span>200W/100S</span></button>
            <button v-if="store.buildings.smithy.count > 0 && store.buildings.library.count === 0" @click="store.buyBuilding('library')" class="w-full text-left border border-purple-600 text-purple-400 hover:bg-purple-800/30 py-1 px-2 text-xs flex justify-between"><span>> Library</span> <span>300W/10G</span></button>
            <button v-if="store.buildings.library.count > 0 && store.buildings.citadel.count === 0" @click="store.buyBuilding('citadel')" class="w-full text-left border border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 py-2 px-2 text-xs flex justify-between font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)] mt-4"><span>> THE CITADEL</span> <span>1000W/500M</span></button>
            <button v-if="store.buildings.citadel.count > 0" @click="showAscensionModal = true" class="w-full text-center border border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 py-2 text-xs font-bold animate-pulse mt-4">[ INITIATE ASCENSION ]</button>
          </div>

          <div v-if="rightTab === 'mystic'" class="space-y-4">
            <div class="space-y-1">
              <div class="text-[10px] text-amber-700 uppercase tracking-widest border-b border-amber-900/30 mb-1">Blacksmith</div>
              <button @click="store.buyUpgrade('steelAxes')" :disabled="store.upgrades.steelAxes.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Steel Axes</span> <span>10 G</span></button>
              <button @click="store.buyUpgrade('ironPicks')" :disabled="store.upgrades.ironPicks.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Iron Picks</span> <span>20 G</span></button>
              <button @click="store.buyUpgrade('broadswords')" :disabled="store.upgrades.broadswords.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Broadswords</span> <span>50 G</span></button>
            </div>
            <div v-if="store.buildings.temple && store.buildings.temple.count > 0" class="space-y-1">
              <div class="text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-800 mb-2">Pantheon Alignment</div>
              <div class="flex items-center gap-1 text-[10px] mb-1">
                <span class="w-12 text-green-500">Nature</span>
                <div class="flex-grow bg-gray-900 h-2"><div class="bg-green-500 h-2" :style="{ width: Math.min((store.alignment.nature / 500) * 100, 100) + '%' }"></div></div>
                <span>{{ store.alignment.nature.toFixed(0) }}</span>
              </div>
              <div class="flex items-center gap-1 text-[10px] mb-1">
                <span class="w-12 text-gray-400">Industry</span>
                <div class="flex-grow bg-gray-900 h-2"><div class="bg-gray-500 h-2" :style="{ width: Math.min((store.alignment.industry / 500) * 100, 100) + '%' }"></div></div>
                <span>{{ store.alignment.industry.toFixed(0) }}</span>
              </div>
              <div class="flex items-center gap-1 text-[10px] mb-2">
                <span class="w-12 text-purple-500">Chaos</span>
                <div class="flex-grow bg-gray-900 h-2"><div class="bg-purple-500 h-2" :style="{ width: Math.min((store.alignment.chaos / 500) * 100, 100) + '%' }"></div></div>
                <span>{{ store.alignment.chaos.toFixed(0) }}</span>
              </div>
              <div v-if="!store.deity" class="grid grid-cols-3 gap-1">
                <button @click="store.worshipDeity('sylva')" :disabled="store.alignment.nature < 500" class="border border-green-700 text-[9px] text-green-400 py-1 hover:bg-green-900 disabled:opacity-30">PRAY TO SYLVA</button>
                <button @click="store.worshipDeity('crom')" :disabled="store.alignment.industry < 500" class="border border-gray-600 text-[9px] text-gray-400 py-1 hover:bg-gray-800 disabled:opacity-30">PRAY TO CROM</button>
                <button @click="store.worshipDeity('xol')" :disabled="store.alignment.chaos < 500" class="border border-purple-700 text-[9px] text-purple-400 py-1 hover:bg-purple-900 disabled:opacity-30">PRAY TO XOL</button>
              </div>
              <div v-else class="text-center text-xs border border-white/20 p-2 uppercase tracking-widest text-white">DEDICATED TO {{ store.deity }}</div>
            </div>
            <div v-if="store.buildings.library.count > 0" class="space-y-1">
              <div class="text-[10px] text-purple-700 uppercase tracking-widest border-b border-purple-900/30 mb-1">Grimoire</div>
              <button @click="store.castSpell('growth')" :disabled="store.spells.growth.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Nature's Boon</span> <span v-if="store.spells.growth.cooldown > 0">{{ store.spells.growth.cooldown }}s</span><span v-else>10 Mana</span></button>
              <button @click="store.castSpell('smite')" :disabled="store.spells.smite.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Arcane Smite</span> <span v-if="store.spells.smite.cooldown > 0">{{ store.spells.smite.cooldown }}s</span><span v-else>20 Mana</span></button>
              <button @click="store.castSpell('warp')" :disabled="store.spells.warp.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-xs flex justify-between disabled:opacity-50"><span>Chrono Shift</span> <span v-if="store.spells.warp.cooldown > 0">{{ store.spells.warp.cooldown }}s</span><span v-else>50 Mana</span></button>
            </div>
            <div v-if="store.buildings.library.count > 0" class="space-y-1 mt-4">
              <div class="flex justify-between items-center border-b border-purple-900/30 mb-1">
                <div class="text-[10px] text-purple-700 uppercase tracking-widest">Reliquary</div>
                <div class="text-[10px] text-gray-500">Unidentified: {{ store.inventory.unidentified }}</div>
              </div>
              <button @click="store.identifyArtifact()" :disabled="store.inventory.unidentified <= 0 || store.resources.mana < 50" class="w-full text-center border border-purple-600 text-purple-400 py-1 mb-2 hover:bg-purple-900/30 disabled:opacity-50 text-xs">[ IDENTIFY ARTIFACT (50 Mana) ]</button>
              <div v-for="relic in ownedRelics" :key="relic.id" class="text-xs border border-purple-900 p-2 bg-purple-900/5 mb-1">
                <div class="text-purple-300 font-bold">{{ relic.name }}</div>
                <div class="text-gray-500 italic text-[10px]">{{ relic.lore }}</div>
                <div class="text-green-400 text-[10px] mt-1">{{ relic.desc }}</div>
              </div>
              <div v-if="ownedRelics.length === 0" class="text-gray-600 text-xs italic text-center">No relics discovered yet.</div>
            </div>
          </div>

          <div v-if="rightTab === 'legacy'" class="space-y-2">
            <div class="text-[10px] text-amber-500 uppercase tracking-widest border-b border-amber-900/50 mb-1">Permanent Upgrades</div>
            <button @click="store.buyLegacyUpgrade('titanGrip')" class="w-full border border-amber-600 p-2 hover:bg-amber-900/30 text-left">
              <div class="text-amber-400 font-bold text-xs">{{ store.legacy.upgrades.titanGrip.name }} (Lvl {{store.legacy.upgrades.titanGrip.level}})</div>
              <div class="text-[10px] text-gray-400">{{ store.legacy.upgrades.titanGrip.desc }}</div>
              <div class="text-[10px] text-right mt-1 text-amber-200">Cost: {{ store.legacy.upgrades.titanGrip.cost }} Amber</div>
            </button>
             <button @click="store.buyLegacyUpgrade('starterKit')" class="w-full border border-amber-600 p-2 hover:bg-amber-900/30 text-left">
              <div class="text-amber-400 font-bold text-xs">{{ store.legacy.upgrades.starterKit.name }} (Lvl {{store.legacy.upgrades.starterKit.level}})</div>
              <div class="text-[10px] text-gray-400">{{ store.legacy.upgrades.starterKit.desc }}</div>
              <div class="text-[10px] text-right mt-1 text-amber-200">Cost: {{ store.legacy.upgrades.starterKit.cost }} Amber</div>
            </button>
             <button @click="store.buyLegacyUpgrade('ancientKnowledge')" :disabled="store.legacy.upgrades.ancientKnowledge.level > 0" class="w-full border border-amber-600 p-2 hover:bg-amber-900/30 text-left disabled:opacity-50">
              <div class="text-amber-400 font-bold text-xs">{{ store.legacy.upgrades.ancientKnowledge.name }}</div>
              <div class="text-[10px] text-gray-400">{{ store.legacy.upgrades.ancientKnowledge.desc }}</div>
              <div class="text-[10px] text-right mt-1 text-amber-200" v-if="store.legacy.upgrades.ancientKnowledge.level === 0">Cost: {{ store.legacy.upgrades.ancientKnowledge.cost }} Amber</div>
              <div class="text-[10px] text-right mt-1 text-green-400" v-else>[OWNED]</div>
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>