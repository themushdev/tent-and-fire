<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as ROT from 'rot-js';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const displayContainer = ref(null);
let display = null;
let animationId = null;

const WIDTH = 60;
const HEIGHT = 20;

const particles = ref([]); 
const visualMinions = ref([]); 
const terrainMap = ref([]); 

// Magic Particles
watch(() => gameStore.resources.mana, (newVal, oldVal) => {
  if (newVal > oldVal) {
    const cx = Math.floor(WIDTH / 2);
    const cy = Math.floor(HEIGHT / 2);
    spawnParticle(cx + 6, cy - 2, "*", "#d8b4fe", 20);
  }
});

function spawnParticle(x, y, char, color, life) {
  particles.value.push({ x, y, char, color, life });
}

function generateMap() {
  terrainMap.value = [];
  for (let x = 0; x < WIDTH; x++) {
    terrainMap.value[x] = [];
    for (let y = 0; y < HEIGHT; y++) {
      let char = " ";
      let color = "#111"; 
      
      // WEST: Forest
      if (x < 15) {
        if (Math.random() < 0.2) { char = "T"; color = "#1e3a18"; } 
        else if (Math.random() < 0.3) { char = "."; color = "#2d4a22"; }
      }
      // EAST: Quarry
      else if (x > 45) {
        if (Math.random() < 0.1) { char = "o"; color = "#555"; } 
        else if (Math.random() < 0.3) { char = "."; color = "#333"; } 
      }
      // CENTER
      else {
        if (Math.random() < 0.05) { char = "."; color = "#222"; } 
      }
      terrainMap.value[x][y] = { char, color };
    }
  }
}

function updateMinions() {
  const counts = {
    woodcutter: gameStore.minions.woodcutter.count,
    miner: gameStore.minions.miner.count,
    squire: gameStore.minions.squire.count,
    farmer: gameStore.minions.farmer.count,
    acolyte: gameStore.minions.acolyte.count,
  };
  
  const totalNeeded = Object.values(counts).reduce((a, b) => a + b, 0);

  if (visualMinions.value.length < totalNeeded) {
    let currentCounts = { woodcutter:0, miner:0, squire:0, farmer:0, acolyte:0 };
    visualMinions.value.forEach(m => currentCounts[m.type]++);

    for (const [type, count] of Object.entries(counts)) {
      if (currentCounts[type] < count) {
        visualMinions.value.push({
          x: WIDTH / 2, y: HEIGHT / 2, type: type,
          char: getChar(type), color: getColor(type),
          targetX: null, targetY: null, idleTimer: 0
        });
        break; 
      }
    }
  } else if (visualMinions.value.length > totalNeeded) {
    visualMinions.value.pop();
  }

  visualMinions.value.forEach((m, index) => {
    if (m.targetX === null) assignJobSite(m, index);

    const dist = Math.sqrt(Math.pow(m.targetX - m.x, 2) + Math.pow(m.targetY - m.y, 2));

    if (dist < 0.5) {
      m.idleTimer++;
      if (m.idleTimer > 200) {
        assignJobSite(m, index);
        m.idleTimer = 0;
      }
    } else {
      const dx = (m.targetX - m.x) / dist;
      const dy = (m.targetY - m.y) / dist;
      m.x += dx * 0.02; 
      m.y += dy * 0.02;
    }
  });
}

function assignJobSite(m, index) {
  const seed = Math.random(); 
  if (m.type === 'woodcutter') { m.targetX = 1 + (seed * 13); m.targetY = 1 + (Math.random() * 18); } 
  else if (m.type === 'miner') { m.targetX = 46 + (seed * 13); m.targetY = 1 + (Math.random() * 18); } 
  else if (m.type === 'farmer') { m.targetX = 20 + (seed * 20); m.targetY = 14 + (Math.random() * 5); }
  else if (m.type === 'squire') { m.targetX = 35 + (seed * 8); m.targetY = 4 + (Math.random() * 8); }
  else if (m.type === 'acolyte') { m.targetX = 33 + (Math.random() * 3); m.targetY = 8 + (Math.random() * 3); }
}

function getChar(type) {
  if (type === 'woodcutter') return '@';
  if (type === 'miner') return 'M';
  if (type === 'farmer') return 'F';
  if (type === 'squire') return 'S';
  if (type === 'acolyte') return '?';
  return '@';
}

function getColor(type) {
  if (type === 'woodcutter') return '#4af626';
  if (type === 'miner') return '#888';
  if (type === 'farmer') return '#eab308';
  if (type === 'squire') return '#3b82f6';
  if (type === 'acolyte') return '#a855f7';
  return '#fff';
}

function draw() {
  if (!display) return;
  display.clear();

  // 1. Terrain
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const t = terrainMap.value[x][y];
      if (t.char !== " ") display.draw(x, y, t.char, t.color);
    }
  }

  // 2. Buildings
  const cx = Math.floor(WIDTH / 2);
  const cy = Math.floor(HEIGHT / 2);

  display.draw(cx, cy, "A", "#ccc");
  if (gameStore.buildings.campfire.count > 0) {
    const fireColor = Math.random() > 0.5 ? "#ffb000" : "#ff4500";
    display.draw(cx + 1, cy + 1, "^", fireColor);
    if (Math.random() < 0.1) spawnParticle(cx + 1, cy, "§", "#555", 30);
  }

  const hutCount = gameStore.buildings.hut.count;
  for (let i = 0; i < hutCount; i++) {
    const hx = cx - 5 + (i*2 % 10);
    const hy = cy - 3 + (Math.floor(i/5)*2);
    display.draw(hx, hy, "n", "#8b4513");
  }

  if (gameStore.buildings.barracks.count > 0) display.draw(cx + 5, cy, "B", "#555");
  if (gameStore.buildings.smithy.count > 0) display.draw(cx + 8, cy + 2, "T", "#888");
  if (gameStore.buildings.library.count > 0) {
    display.draw(cx + 6, cy - 2, "L", "#d8b4fe");
    if (Math.random() < 0.02) spawnParticle(cx + 6, cy - 3, "o", "#a855f7", 40);
  }

  const farmCount = gameStore.buildings.farm.count;
  for (let i = 0; i < farmCount; i++) {
    const fx = 20 + (i % 20);
    const fy = 15 + Math.floor(i / 20);
    display.draw(fx, fy, "\"", "#eab308");
  }

  // 3. Enemy (DYNAMIC COLOR NOW)
  if (gameStore.combat.active && gameStore.combat.enemy.hp > 0) {
    const ex = cx + 8; 
    const ey = cy - 4;
    // Uses the store's enemy symbol and color
    display.draw(ex, ey, gameStore.combat.enemy.symbol, gameStore.combat.enemy.color);
  }

  // 4. Minions
  updateMinions();
  visualMinions.value.forEach(m => {
    display.draw(Math.floor(m.x), Math.floor(m.y), m.char, m.color);
  });

  // 5. Particles
  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i];
    display.draw(Math.floor(p.x), Math.floor(p.y), p.char, p.color);
    p.life--;
    if (p.char === "§" && p.life % 5 === 0) p.y--; 
    if (p.char === "*" || p.char === "o") p.y -= (Math.random() * 0.1); 
    if (p.life <= 0) particles.value.splice(i, 1);
  }

  animationId = requestAnimationFrame(draw);
}

onMounted(() => {
  display = new ROT.Display({ width: WIDTH, height: HEIGHT, bg: "#0d1117", fontSize: 16, fontFamily: "monospace" });
  displayContainer.value.appendChild(display.getContainer());
  generateMap();
  draw();
});

onUnmounted(() => cancelAnimationFrame(animationId));
</script>

<template>
  <div ref="displayContainer" class="border border-green-900 shadow-[0_0_15px_rgba(74,246,38,0.1)]"></div>
</template>