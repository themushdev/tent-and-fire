<script setup>
import { onMounted, onUnmounted, computed, ref } from 'vue';
import { useGameStore } from './stores/gameStore'; 
import AsciiDiorama from './components/AsciiDiorama.vue';
import AsciiScenic from './components/AsciiScenic.vue';

const store = useGameStore();
const currentView = ref('map'); 

let loopId;
onMounted(() => {
  loopId = setInterval(() => store.tick(), 1000);
});
onUnmounted(() => clearInterval(loopId));

function getLogClass(type) {
  if (type === 'error') return 'text-red-500';
  if (type === 'combat') return 'text-red-400 font-bold';
  if (type === 'nature') return 'text-emerald-400';
  if (type === 'industry') return 'text-amber-400';
  if (type === 'build') return 'text-blue-400';
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
</script>

<template>
  <div class="min-h-screen bg-black text-green-500 p-8 font-mono selection:bg-green-900 selection:text-white">
    
    <div class="flex justify-between border-b border-green-900 pb-2 mb-6">
      <h1 class="text-3xl font-bold title-glow">Tent & Fire</h1>
      <div class="flex gap-4">
        <span class="text-xs text-gray-500 self-end">[AUTO-SAVING]</span>
        <div class="text-right">
          <div class="text-sm">POPULATION</div>
          <div class="text-xl font-bold">{{ store.population }} / {{ store.populationCap }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      
      <div class="col-span-8 flex flex-col gap-4">
        
        <div class="flex gap-2">
          <button 
            @click="currentView = 'map'"
            :class="currentView === 'map' ? 'bg-green-900 text-black shadow-[0_0_10px_#4af626]' : 'text-gray-500 hover:text-green-500'"
            class="px-4 py-1 border border-green-900 text-sm transition-all uppercase">
            [ Tactical Map ]
          </button>
          <button 
            @click="currentView = 'scenic'"
             :class="currentView === 'scenic' ? 'bg-green-900 text-black shadow-[0_0_10px_#4af626]' : 'text-gray-500 hover:text-green-500'"
            class="px-4 py-1 border border-green-900 text-sm transition-all uppercase">
            [ Scenic View ]
          </button>
        </div>

        <div class="flex justify-center bg-black/50 p-4 border-bloom min-h-[350px]">
          <AsciiDiorama v-if="currentView === 'map'" />
          <AsciiScenic v-else />
        </div>
        
        <div class="h-48 overflow-y-auto border-bloom p-2 text-sm font-mono bg-black/50 scrollbar-hide">
          <div v-for="(entry, index) in store.log" :key="index" class="mb-1 opacity-90">
            <span class="text-gray-600">[{{ entry.time }}]</span> 
            <span :class="getLogClass(entry.type)"> {{ entry.msg }}</span>
          </div>
        </div>
      </div>

      <div class="col-span-4 space-y-6">
        
        <div class="border-bloom p-4 bg-green-900/5">
          <h2 class="text-xl mb-2 border-b border-green-900/50">> INVENTORY</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-green-700">WOOD</div>
              <div class="text-xl">{{ store.resources.wood.toFixed(0) }}</div>
            </div>
            <div>
              <div class="text-xs text-green-700">FOOD</div>
              <div class="text-xl">{{ store.resources.food.toFixed(0) }}</div>
            </div>
             <div>
              <div class="text-xs text-gray-500">STONE</div>
              <div class="text-xl text-gray-400">{{ store.resources.stone.toFixed(0) }}</div>
            </div>
             <div>
              <div class="text-xs text-yellow-600">GOLD</div>
              <div class="text-xl text-yellow-400">{{ store.resources.gold.toFixed(0) }}</div>
            </div>
             <div v-if="store.buildings.library.count > 0">
              <div class="text-xs text-purple-400 font-bold">MANA</div>
              <div class="text-xl text-purple-300 title-glow">{{ store.resources.mana.toFixed(1) }}</div>
            </div>
          </div>
        </div>

        <div class="border-bloom p-4">
          <h2 class="text-xl mb-2 border-b border-green-900/50">> ACTIONS</h2>
          <div class="space-y-2">
            <button @click="store.gatherResource('wood', 1)" class="btn-retro w-full border border-green-800 hover:bg-green-900 py-1">
              [ GATHER WOOD ]
            </button>
            <button @click="store.gatherResource('food', 1)" class="btn-retro w-full border border-green-800 hover:bg-green-900 py-1">
              [ FORAGE FOOD ]
            </button>
             <button @click="store.gatherResource('stone', 1)" class="btn-retro w-full border border-gray-700 text-gray-400 hover:bg-gray-900 py-1">
              [ MINE STONE ]
            </button>
          </div>
        </div>

        <div v-if="store.buildings.library.count > 0" class="border border-purple-500/30 p-4 bg-purple-900/10 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
           <h2 class="text-xl mb-2 border-b border-purple-900/50 text-purple-400">> GRIMOIRE</h2>
           <div class="space-y-2">
             <button @click="store.castSpell('growth')" :disabled="store.spells.growth.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span>> Nature's Boon</span> <span v-if="store.spells.growth.cooldown > 0">({{ store.spells.growth.cooldown }}s)</span> <span v-else>10 Mana</span>
             </button>
             <button @click="store.castSpell('smite')" :disabled="store.spells.smite.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span>> Arcane Smite</span> <span v-if="store.spells.smite.cooldown > 0">({{ store.spells.smite.cooldown }}s)</span> <span v-else>20 Mana</span>
             </button>
             <button @click="store.castSpell('warp')" :disabled="store.spells.warp.cooldown > 0" class="w-full text-left border border-purple-800 text-purple-300 hover:bg-purple-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span>> Chrono Shift</span> <span v-if="store.spells.warp.cooldown > 0">({{ store.spells.warp.cooldown }}s)</span> <span v-else>50 Mana</span>
             </button>
           </div>
        </div>

        <div v-if="store.combat.active" class="border border-red-900/50 p-4 bg-red-900/5">
          <h2 class="text-xl mb-2 border-b border-red-900/50 text-red-500">> THREAT DETECTED</h2>
          
          <div class="flex justify-between items-center mb-4 bg-black p-1 border border-red-900/30">
            <button @click="store.changeZone(-1)" class="text-gray-500 hover:text-white px-2">&lt;</button>
            <div class="text-sm font-bold text-red-300">{{ currentZoneName }}</div>
            <button @click="store.changeZone(1)" class="text-gray-500 hover:text-white px-2">&gt;</button>
          </div>

          <div class="flex justify-between items-center mb-1">
            <span class="text-lg text-red-400" :style="{ color: store.combat.enemy.color }">{{ store.combat.enemy.name }}</span>
            <span class="text-sm text-gray-500">{{ store.combat.enemy.hp }}/{{ store.combat.enemy.maxHp }} HP</span>
          </div>
          <div class="font-mono text-red-600 mb-2 whitespace-pre tracking-tighter">
            {{ enemyHpBar }}
          </div>
          <div class="text-xs text-gray-500">
            DPS: {{ store.minions.squire.count * (store.minions.squire.damage + (store.upgrades.broadswords.owned ? 1 : 0)) }}/sec
          </div>
        </div>

        <div v-if="store.buildings.smithy.count > 0" class="border-bloom p-4 border-amber-500/30">
           <h2 class="text-xl mb-2 border-b border-amber-900/50 text-amber-500">> BLACKSMITH</h2>
           <div class="space-y-2">
             <button @click="store.buyUpgrade('steelAxes')" :disabled="store.upgrades.steelAxes.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span><span v-if="store.upgrades.steelAxes.owned">[X] </span> Steel Axes</span> <span v-if="!store.upgrades.steelAxes.owned">10 G</span>
             </button>
             <button @click="store.buyUpgrade('ironPicks')" :disabled="store.upgrades.ironPicks.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span><span v-if="store.upgrades.ironPicks.owned">[X] </span> Iron Picks</span> <span v-if="!store.upgrades.ironPicks.owned">20 G</span>
             </button>
             <button @click="store.buyUpgrade('broadswords')" :disabled="store.upgrades.broadswords.owned" class="w-full text-left border border-amber-800 text-amber-400 hover:bg-amber-900/30 py-1 px-2 text-sm flex justify-between disabled:opacity-50">
               <span><span v-if="store.upgrades.broadswords.owned">[X] </span> Broadswords</span> <span v-if="!store.upgrades.broadswords.owned">50 G</span>
             </button>
           </div>
        </div>

        <div class="border-bloom p-4">
          <h2 class="text-xl mb-2 border-b border-green-900/50">> EXPANSION</h2>
          <div class="space-y-2 mb-4">
            <button @click="store.buyBuilding('hut')" class="w-full text-left border border-amber-800 text-amber-500 hover:bg-amber-900/30 py-1 px-2 text-sm flex justify-between"><span>> Build Hut</span> <span>50 W</span></button>
            <button @click="store.buyBuilding('farm')" class="w-full text-left border border-yellow-800 text-yellow-500 hover:bg-yellow-900/30 py-1 px-2 text-sm flex justify-between"><span>> Wheat Field</span> <span>100W/10S</span></button>
            <button v-if="!store.combat.active" @click="store.buyBuilding('barracks')" class="w-full text-left border border-red-800 text-red-500 hover:bg-red-900/30 py-1 px-2 text-sm flex justify-between"><span>> Build Barracks</span> <span>100W/20S</span></button>
            <button v-if="store.combat.active && store.buildings.smithy.count === 0" @click="store.buyBuilding('smithy')" class="w-full text-left border border-gray-600 text-gray-400 hover:bg-gray-800/30 py-1 px-2 text-sm flex justify-between"><span>> Build Smithy</span> <span>200W/100S</span></button>
            <button v-if="store.buildings.smithy.count > 0 && store.buildings.library.count === 0" @click="store.buyBuilding('library')" class="w-full text-left border border-purple-600 text-purple-400 hover:bg-purple-800/30 py-1 px-2 text-sm flex justify-between"><span>> Arcane Library</span> <span>300W/10G</span></button>
          </div>
          <div class="space-y-1 mt-2 border-t border-gray-800 pt-2">
            <button @click="store.buyMinion('woodcutter')" class="w-full text-left border border-green-800 text-green-400 hover:bg-green-900/30 py-1 px-2 text-sm flex justify-between"><span>> Woodcutter</span> <span>10 F</span></button>
            <button v-if="store.buildings.farm.count > 0" @click="store.buyMinion('farmer')" class="w-full text-left border border-yellow-800 text-yellow-400 hover:bg-yellow-900/30 py-1 px-2 text-sm flex justify-between"><span>> Farmer</span> <span>20 F</span></button>
            <button @click="store.buyMinion('miner')" class="w-full text-left border border-gray-700 text-gray-400 hover:bg-gray-900/30 py-1 px-2 text-sm flex justify-between"><span>> Miner</span> <span>15 F</span></button>
            <button v-if="store.combat.active" @click="store.buyMinion('squire')" class="w-full text-left border border-blue-800 text-blue-400 hover:bg-blue-900/30 py-1 px-2 text-sm flex justify-between"><span>> Squire</span> <span>50 F</span></button>
            <button v-if="store.buildings.library.count > 0" @click="store.buyMinion('acolyte')" class="w-full text-left border border-purple-800 text-purple-400 hover:bg-purple-900/30 py-1 px-2 text-sm flex justify-between"><span>> Acolyte</span> <span>50F/5G</span></button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>