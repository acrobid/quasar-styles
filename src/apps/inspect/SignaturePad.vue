<template>
  <div class="sig" :class="{ 'sig--error': error }">
    <canvas
      ref="canvas"
      class="sig__canvas"
      role="img"
      :aria-label="
        empty ? 'Signature pad, empty. Draw with a finger, pen or mouse.' : 'Signature captured'
      "
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointercancel="up"
    />
    <span v-if="empty" class="sig__hint" aria-hidden="true">Sign here</span>
    <span class="sig__line" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

// Strokes are kept in CSS pixels so the pad can be redrawn crisply after a resize.
type Point = { x: number; y: number };

defineProps<{ error?: boolean }>();
const emit = defineEmits<{ change: [signed: boolean] }>();

const canvas = ref<HTMLCanvasElement | null>(null);
const strokes: Point[][] = [];
let typed = '';
const empty = ref(true);
let drawing = false;
let observer: ResizeObserver | undefined;

function context() {
  return canvas.value?.getContext('2d') ?? null;
}

function resize() {
  const el = canvas.value;
  if (!el) return;
  const ratio = window.devicePixelRatio || 1;
  el.width = Math.round(el.clientWidth * ratio);
  el.height = Math.round(el.clientHeight * ratio);
  context()?.setTransform(ratio, 0, 0, ratio, 0, 0);
  redraw();
}

function redraw() {
  const ctx = context();
  const el = canvas.value;
  if (!ctx || !el) return;
  ctx.clearRect(0, 0, el.width, el.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, el.clientWidth, el.clientHeight);
  ctx.strokeStyle = '#0d0d0d';
  ctx.fillStyle = '#0d0d0d';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (typed) {
    ctx.font = `italic 600 ${Math.min(44, el.clientWidth / 9)}px Newsreader, Georgia, serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(typed, 20, el.clientHeight * 0.68, el.clientWidth - 40);
  }
  for (const stroke of strokes) {
    ctx.beginPath();
    stroke.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (stroke.length === 1) ctx.lineTo(stroke[0]!.x + 0.1, stroke[0]!.y);
    ctx.stroke();
  }
}

function point(e: PointerEvent): Point {
  const rect = canvas.value!.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function down(e: PointerEvent) {
  canvas.value?.setPointerCapture(e.pointerId);
  drawing = true;
  strokes.push([point(e)]);
  redraw();
}

function move(e: PointerEvent) {
  if (!drawing) return;
  strokes[strokes.length - 1]?.push(point(e));
  redraw();
}

function up() {
  if (!drawing) return;
  drawing = false;
  setEmpty(false);
}

function setEmpty(value: boolean) {
  empty.value = value;
  emit('change', !value);
}

function clear() {
  strokes.length = 0;
  typed = '';
  redraw();
  setEmpty(true);
}

/** Keyboard-friendly alternative: render a typed name as the signature. */
function signTyped(name: string) {
  strokes.length = 0;
  typed = name;
  redraw();
  setEmpty(!name);
}

/** A small PNG (max 480px wide) so queued inspections stay light in localStorage. */
function toDataURL() {
  const src = canvas.value;
  if (empty.value || !src) return null;
  const scale = Math.min(1, 480 / src.width);
  const out = document.createElement('canvas');
  out.width = Math.round(src.width * scale);
  out.height = Math.round(src.height * scale);
  out.getContext('2d')?.drawImage(src, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

onMounted(() => {
  resize();
  observer = new ResizeObserver(resize);
  if (canvas.value) observer.observe(canvas.value);
});
onBeforeUnmount(() => observer?.disconnect());

defineExpose({ clear, signTyped, toDataURL });
</script>

<style scoped lang="scss">
.sig {
  position: relative;
  height: 200px;
  border: 2px solid var(--t-border);
  background: #fff;

  &--error {
    border-color: var(--t-negative);
    box-shadow: inset 0 0 0 2px var(--t-negative);
  }
}

.sig__canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none; // the pad owns touch gestures; no scrolling while signing
  cursor: crosshair;
}

.sig__hint {
  position: absolute;
  top: 12px;
  left: 14px;
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 13px;
  pointer-events: none;
}

.sig__line {
  position: absolute;
  right: 20px;
  bottom: 44px;
  left: 20px;
  border-top: 2px dashed #8f8f87;
  pointer-events: none;
}
</style>
