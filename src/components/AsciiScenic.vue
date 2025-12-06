<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import * as ROT from 'rot-js';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
const displayContainer = ref(null);
let display = null;
let animationId = null;

// MATCHING HD RESOLUTION
const WIDTH = 125; 
const HEIGHT = 50; 
const FONT_SIZE = 11;

const ART = {
  moon: [
    "   _.._   ", " .      . ", ".        .", " .      . ", "   `--`   "
  ],
  mountain: [
    "           /\\           ", "          /  \\          ", "         /    \\   /\\    ",
    "  /\\    /      \\ /  \\   ", " /  \\  /        /    \\  ", "/____\\/__________\\____\\ "
  ],
  tent: [ "  / \\  ", " /   \\ ", "/_____\\" ],
  hut: [ "  ___  ", " /   \\ ", "|  _  |", "|_____|" ],
  barracks: [ "  |   |  ", " [=====] ", " | [ ] | ", " |_____| " ]
};

function drawSprite(x, y, spriteLines, color) {
  spriteLines.forEach((line, i) => {
    display.drawText(x, y + i, `%c{${color}}${line}`);
  });
}

function draw() {
  if (!display) return;
  display.clear();

  // SKY
  for (let x = 0; x < WIDTH; x++) {
    for (let y = 0; y < HEIGHT - 15; y++) {
      const hash = (x * 37 + y * 13) % 100; 
      if (hash > 98) display.draw(x, y, ".", "#555");
    }
  }

  // MOON (Far Right)
  drawSprite(100, 5, ART.moon, "#ff9");

  // MOUNTAINS (Backdrop - Stretched for 125 width)
  drawSprite(0, 30, ART.mountain, "#222");
  drawSprite(30, 25, ART.mountain, "#222");
  drawSprite(60, 30, ART.mountain, "#222");
  drawSprite(90, 25, ART.mountain, "#222");

  // GROUND
  for (let x = 0; x < WIDTH; x++) {
    display.draw(x, 36, "_", "#2d4a22"); 
    for (let y = 37; y < HEIGHT; y++) {
       display.draw(x, y, "#", "#1a2f16");
    }
  }

  // BUILDINGS
  drawSprite(20, 33, ART.tent, "#ccc");

  if (gameStore.buildings.campfire.count > 0) {
    const flicker = Math.random() > 0.5 ? "#ffb000" : "#ff4500";
    display.drawText(30, 35, `%c{${flicker}} ( )`);
    display.drawText(30, 34, `%c{${flicker}}  ^ `);
  }

  if (gameStore.buildings.hut.count > 0) drawSprite(45, 32, ART.hut, "#8b4513");
  if (gameStore.buildings.hut.count > 2) drawSprite(60, 32, ART.hut, "#8b4513");
  if (gameStore.buildings.barracks.count > 0) drawSprite(80, 31, ART.barracks, "#888");

  animationId = requestAnimationFrame(draw);
}

onMounted(() => {
  display = new ROT.Display({ width: WIDTH, height: HEIGHT, bg: "#0d1117", fontSize: FONT_SIZE, fontFamily: "monospace" });
  displayContainer.value.appendChild(display.getContainer());
  draw();
});

onUnmounted(() => cancelAnimationFrame(animationId));
</script>

<template>
  <div ref="displayContainer" class="w-full h-full flex justify-center items-center bg-black overflow-hidden"></div>
</template>