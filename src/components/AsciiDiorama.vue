<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import * as ROT from 'rot-js';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const displayContainer = ref(null);
let display = null;
let animationId = null;

const WIDTH = 125;  
const HEIGHT = 50;  
const FONT_SIZE = 11; 

const particles = ref([]); 
const visualMinions = ref([]); 
const terrainMap = ref([]); 

const SPRITES = {
  tent: [ { x: 0, y: -1, ch: '/', c: '#888' }, { x: 1, y: -1, ch: '\\', c: '#888' }, { x: 0, y: 0, ch: '/', c: '#888' }, { x: 1, y: 0, ch: '\\', c: '#888' }, { x: 0, y: 1, ch: '-', c: '#666' }, { x: 1, y: 1, ch: '-', c: '#666' } ],
  hut: [ { x: 0, y: -1, ch: 'A', c: '#8b4513' }, { x: -1, y: 0, ch: '[', c: '#5e3a18' }, { x: 0, y: 0, ch: '_', c: '#3e270e' }, { x: 1, y: 0, ch: ']', c: '#5e3a18' } ],
  barracks: [ { x: -1, y: -1, ch: '|', c: '#777' }, { x: 1, y: -1, ch: '|', c: '#777' }, { x: -1, y: 0, ch: '[', c: '#555' }, { x: 0, y: 0, ch: 'X', c: '#a00' }, { x: 1, y: 0, ch: ']', c: '#555' } ],
  archery: [ { x: 0, y: -2, ch: 'O', c: '#eab308' }, { x: 0, y: -1, ch: '|', c: '#8b4513' }, { x: -1, y: 0, ch: '/', c: '#8b4513' }, { x: 1, y: 0, ch: '\\', c: '#8b4513' } ], 
  temple: [ { x: 0, y: -2, ch: '+', c: '#d8b4fe' }, { x: -1, y: -1, ch: '^', c: '#aaa' }, { x: 1, y: -1, ch: '^', c: '#aaa' }, { x: -1, y: 0, ch: '|', c: '#aaa' }, { x: 1, y: 0, ch: '|', c: '#aaa' }, { x: 0, y: 0, ch: '_', c: '#aaa' } ],
  smithy: [ { x: 0, y: -1, ch: 'T', c: '#aaa' }, { x: -1, y: 0, ch: 'c', c: '#444' }, { x: 0, y: 0, ch: '=', c: '#444' }, { x: 1, y: 0, ch: 'ɔ', c: '#444' } ],
  library: [ { x: 0, y: -2, ch: '*', c: '#d8b4fe' }, { x: -1, y: -1, ch: '/', c: '#8b5cf6' }, { x: 0, y: -1, ch: 'O', c: '#fff' }, { x: 1, y: -1, ch: '\\', c: '#8b5cf6' }, { x: -1, y: 0, ch: '|', c: '#555' }, { x: 0, y: 0, ch: '_', c: '#555' }, { x: 1, y: 0, ch: '|', c: '#555' } ],
  citadel: [ { x: 0, y: -3, ch: 'A', c: '#06b6d4' }, { x: -1, y: -2, ch: '/', c: '#0891b2' }, { x: 1, y: -2, ch: '\\', c: '#0891b2' }, { x: -2, y: -1, ch: '/', c: '#0891b2' }, { x: -1, y: -1, ch: '|', c: '#0e7490' }, { x: 0, y: -1, ch: '^', c: '#fff' }, { x: 1, y: -1, ch: '|', c: '#0e7490' }, { x: 2, y: -1, ch: '\\', c: '#0891b2' }, { x: -2, y: 0, ch: '|', c: '#155e75' }, { x: -1, y: 0, ch: '_', c: '#155e75' }, { x: 0, y: 0, ch: '#', c: '#000' }, { x: 1, y: 0, ch: '_', c: '#155e75' }, { x: 2, y: 0, ch: '|', c: '#155e75' } ]
};

watch(() => gameStore.resources.mana, (newVal, oldVal) => {
  if (newVal > oldVal) {
    const cx = Math.floor(WIDTH / 2) + 12;
    const cy = Math.floor(HEIGHT / 2) - 2;
    spawnParticle(cx, cy, "*", "#d8b4fe", 20);
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
      const noise = Math.sin(x / 8) + Math.cos(y / 8) + Math.random(); 
      if (x < 35) { if (noise > 1.6) { char = "T"; color = "#142810"; } else if (noise > 0.8) { char = "t"; color = "#2d4a22"; } else if (Math.random() < 0.15) { char = "."; color = "#223322"; } }
      else if (x > 90) { if (noise > 1.6) { char = "▲"; color = "#222"; } else if (noise > 0.8) { char = "o"; color = "#444"; } else if (Math.random() < 0.15) { char = "."; color = "#222"; } }
      else { if (Math.random() < 0.03) { char = ","; color = "#1a2a1a"; } }
      terrainMap.value[x][y] = { char, color };
    }
  }
}

function updateMinions() {
  const counts = {
    woodcutter: gameStore.minions.woodcutter.count,
    miner: gameStore.minions.miner.count,
    squire: gameStore.minions.squire.count,
    knight: gameStore.minions.knight.count,
    ranger: gameStore.minions.ranger.count,
    farmer: gameStore.minions.farmer.count,
    acolyte: gameStore.minions.acolyte.count,
    mage: gameStore.minions.mage.count,
  };
  
  const totalNeeded = Object.values(counts).reduce((a, b) => a + b, 0);

  if (visualMinions.value.length < totalNeeded) {
    let currentCounts = { woodcutter:0, miner:0, squire:0, knight:0, ranger:0, farmer:0, acolyte:0, mage:0 };
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
      const workTime = (m.type === 'squire' || m.type === 'knight') ? 300 : 150;
      if (m.idleTimer > workTime) {
        assignJobSite(m, index);
        m.idleTimer = 0;
      }
    } else {
      const dx = (m.targetX - m.x) / dist;
      const dy = (m.targetY - m.y) / dist;
      m.x += dx * 0.03; 
      m.y += dy * 0.03;
    }
  });
}

function assignJobSite(m, index) {
  const seed = Math.random(); 
  if (m.type === 'woodcutter') { m.targetX = 2 + (seed * 30); m.targetY = 2 + (Math.random() * 45); } 
  else if (m.type === 'miner') { m.targetX = 92 + (seed * 30); m.targetY = 2 + (Math.random() * 45); } 
  else if (m.type === 'farmer') { m.targetX = 40 + (seed * 45); m.targetY = 40 + (Math.random() * 8); }
  else if (m.type === 'squire' || m.type === 'knight') { 
    const angle = seed * Math.PI * 2;
    m.targetX = (WIDTH/2) + Math.cos(angle) * 20; 
    m.targetY = (HEIGHT/2) + Math.sin(angle) * 12;
  }
  else if (m.type === 'ranger') { m.targetX = 25 + (seed * 20); m.targetY = 10 + (Math.random() * 10); }
  else if (m.type === 'acolyte' || m.type === 'mage') { m.targetX = (WIDTH/2) + 12 + (Math.random() * 5); m.targetY = (HEIGHT/2) - 4 + (Math.random() * 5); }
}

function getChar(type) {
  if (type === 'woodcutter') return gameStore.deity === 'sylva' ? 'T' : '@';
  if (type === 'miner') return gameStore.deity === 'crom' ? 'A' : 'M';
  if (type === 'farmer') return gameStore.deity === 'sylva' ? 'D' : 'F';
  if (type === 'squire') return 'S';
  if (type === 'knight') return 'K';
  if (type === 'ranger') return 'R';
  if (type === 'acolyte') return '?';
  if (type === 'mage') return 'W';
  return '@';
}

function getColor(type) {
  if (type === 'woodcutter') return '#4af626';
  if (type === 'miner') return '#888';
  if (type === 'farmer') return '#eab308';
  if (type === 'squire') return '#3b82f6';
  if (type === 'knight') return '#93c5fd';
  if (type === 'ranger') return '#15803d';
  if (type === 'acolyte') return '#a855f7';
  if (type === 'mage') return '#d8b4fe';
  return '#fff';
}

function drawBuilding(cx, cy, spriteName) {
  const sprite = SPRITES[spriteName];
  if (!sprite) return;
  sprite.forEach(p => {
    display.draw(cx + p.x, cy + p.y, p.ch, p.c);
  });
}

function draw() {
  if (!display) return;
  display.clear();

  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT; y++) {
      const t = terrainMap.value[x][y];
      if (t.char !== " ") display.draw(x, y, t.char, t.color);
    }
  }

  const cx = Math.floor(WIDTH / 2);
  const cy = Math.floor(HEIGHT / 2);

  if (gameStore.buildings.citadel.count > 0) {
    drawBuilding(cx, cy - 2, 'citadel');
    if (Math.random() < 0.1) spawnParticle(cx, cy - 6, "+", "#06b6d4", 50);
  } else {
    drawBuilding(cx, cy, 'tent');
  }

  if (gameStore.buildings.campfire.count > 0) {
    const fireColor = Math.random() > 0.5 ? "#ffb000" : "#ff4500";
    display.draw(cx + 3, cy + 1, "^", fireColor);
    if (Math.random() < 0.1) spawnParticle(cx + 3, cy, "§", "#555", 30);
  }

  if (gameStore.buildings.barracks.count > 0) drawBuilding(cx - 8, cy, 'barracks'); 
  if (gameStore.buildings.archery.count > 0) drawBuilding(cx - 12, cy - 2, 'archery'); 
  if (gameStore.buildings.smithy.count > 0) drawBuilding(cx - 8, cy + 5, 'smithy'); 
  if (gameStore.buildings.library.count > 0) drawBuilding(cx + 10, cy - 3, 'library'); 
  if (gameStore.buildings.temple.count > 0) drawBuilding(cx + 14, cy, 'temple'); 

  const hutCount = gameStore.buildings.hut.count;
  for (let i = 0; i < hutCount; i++) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const hx = cx - 14 + (col * 4); 
    const hy = cy - 8 - (row * 3); 
    drawBuilding(hx, hy, 'hut');
  }

  const farmCount = gameStore.buildings.farm.count;
  for (let i = 0; i < farmCount; i++) {
    const fx = 40 + (i % 45); 
    const fy = 40 + Math.floor(i / 45);
    display.draw(fx, fy, "\"", "#eab308");
  }

  if (gameStore.combat.active && gameStore.combat.enemy.hp > 0) {
    const ex = WIDTH - 5; 
    const ey = cy;
    display.draw(ex, ey, gameStore.combat.enemy.symbol, gameStore.combat.enemy.color);
  }

  updateMinions();
  visualMinions.value.forEach(m => {
    display.draw(Math.floor(m.x), Math.floor(m.y), m.char, m.color);
  });

  for (let i = particles.value.length - 1; i >= 0; i--) {
    const p = particles.value[i];
    display.draw(Math.floor(p.x), Math.floor(p.y), p.char, p.color);
    p.life--;
    if (p.char === "§" && p.life % 5 === 0) p.y--; 
    if (p.char === "*" || p.char === "o" || p.char === "+") p.y -= (Math.random() * 0.1); 
    if (p.life <= 0) particles.value.splice(i, 1);
  }

  animationId = requestAnimationFrame(draw);
}

onMounted(() => {
  display = new ROT.Display({ width: WIDTH, height: HEIGHT, bg: "#0d1117", fontSize: FONT_SIZE, fontFamily: "monospace" });
  displayContainer.value.appendChild(display.getContainer());
  generateMap();
  draw();
});

onUnmounted(() => cancelAnimationFrame(animationId));
</script>

<template>
  <div ref="displayContainer" class="w-full h-full flex justify-center items-center bg-black overflow-hidden"></div>
</template>