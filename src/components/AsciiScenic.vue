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

// --- ASCII ART ASSETS ---
const ART = {
  moon: [
    "   _.._   ",
    " .      . ",
    ".        .",
    " .      . ",
    "   `--`   "
  ],
  mountain: [
    "           /\\           ",
    "          /  \\          ",
    "         /    \\   /\\    ",
    "  /\\    /      \\ /  \\   ",
    " /  \\  /        /    \\  ",
    "/____\\/__________\\____\\ "
  ],
  tent: [
    "  / \\  ",
    " /   \\ ",
    "/_____\\"
  ],
  hut: [
    "  ___  ",
    " /   \\ ",
    "|  _  |",
    "|_____|"
  ],
  barracks: [
    "  |   |  ",
    " [=====] ",
    " | [ ] | ",
    " |_____| "
  ]
};

// --- RENDER LOGIC ---
function drawSprite(x, y, spriteLines, color) {
  spriteLines.forEach((line, i) => {
    // drawText allows strings. null = no max width.
    display.drawText(x, y + i, `%c{${color}}${line}`);
  });
}

function draw() {
  if (!display) return;
  display.clear();

  // 1. DRAW SKY (Stars)
  // We use a pseudo-random seed based on coordinates so stars don't flicker
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT - 6; y++) {
      // Simple hash to keep stars static
      const hash = (x * 37 + y * 13) % 100; 
      if (hash > 97) display.draw(x, y, ".", "#555");
      if (hash === 50) display.draw(x, y, "+", "#333");
    }
  }

  // 2. DRAW MOON (Top Right)
  drawSprite(45, 2, ART.moon, "#ff9");

  // 3. DRAW MOUNTAINS (Background Horizon)
  // We repeat mountains across the back
  drawSprite(0, 10, ART.mountain, "#222");
  drawSprite(25, 10, ART.mountain, "#222");
  drawSprite(50, 10, ART.mountain, "#222");

  // 4. DRAW GROUND
  for (let x = 0; x < WIDTH; x++) {
    display.draw(x, 16, "_", "#2d4a22"); // Grass line
    for (let y = 17; y < HEIGHT; y++) {
       display.draw(x, y, "#", "#1a2f16"); // Dirt/Ground
    }
  }

  // 5. DRAW BUILDINGS (Foreground)
  // We place them in specific "slots" along the ground (y=13 roughly)
  
  // Slot 1: The Tent (Always there)
  drawSprite(5, 13, ART.tent, "#ccc");

  // Slot 2: Campfire (If built)
  if (gameStore.buildings.campfire.count > 0) {
    const flicker = Math.random() > 0.5 ? "#ffb000" : "#ff4500";
    display.drawText(14, 15, `%c{${flicker}} ( )`);
    display.drawText(14, 14, `%c{${flicker}}  ^ `);
    // Smoke
    if (Math.random() < 0.2) display.draw(15, 12, "§", "#555");
    if (Math.random() < 0.2) display.draw(16, 11, "§", "#555");
  }

  // Slot 3 & 4: Huts (Draw up to 2 for visuals)
  if (gameStore.buildings.hut.count > 0) {
    drawSprite(20, 12, ART.hut, "#8b4513");
  }
  if (gameStore.buildings.hut.count > 2) {
    drawSprite(28, 12, ART.hut, "#8b4513");
  }

  // Slot 5: Barracks
  if (gameStore.buildings.barracks.count > 0) {
    drawSprite(40, 11, ART.barracks, "#888");
  }

  animationId = requestAnimationFrame(draw);
}

onMounted(() => {
  display = new ROT.Display({ width: WIDTH, height: HEIGHT, bg: "#0d1117", fontSize: 16, fontFamily: "monospace" });
  displayContainer.value.appendChild(display.getContainer());
  draw();
});

onUnmounted(() => cancelAnimationFrame(animationId));
</script>

<template>
  <div ref="displayContainer" class="border border-green-900 shadow-[0_0_15px_rgba(74,246,38,0.1)]"></div>
</template>