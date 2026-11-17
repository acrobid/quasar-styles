<template>
  <q-layout view="hHh lpr fFf" class="drift">
    <!-- Drifting gradient mesh; static under prefers-reduced-motion. -->
    <div class="mesh" aria-hidden="true"><i /><i /><i /><i /></div>

    <q-header class="drift__header">
      <div class="drift__bar">
        <AppBackLink />
        <span class="drift__brand">Drift</span>
        <span class="drift__sessions" :aria-label="`${sessionsToday} focus sessions today`">
          <i v-for="n in 4" :key="n" :class="{ on: n <= cycleDots }" />
          <span>{{ sessionsToday }} today</span>
        </span>
      </div>
    </q-header>

    <q-page-container>
      <q-page class="drift__page">
        <!-- Timer -->
        <section class="panel timer" aria-labelledby="timer-title">
          <h1 id="timer-title" class="visually-hidden">Focus timer</h1>
          <q-btn-toggle
            :model-value="mode"
            no-caps
            toggle-text-color="on-primary"
            unelevated
            spread
            class="segmented"
            :options="modeOptions"
            aria-label="Timer mode"
            @update:model-value="setMode"
          />

          <div class="dial">
            <q-circular-progress
              :value="progress"
              :min="0"
              :max="1"
              size="var(--dial)"
              :thickness="0.035"
              color="accent"
              track-color="transparent"
              class="dial__ring"
              aria-hidden="true"
            />
            <div class="dial__face">
              <p class="dial__time" role="timer" :aria-label="`${clock} remaining`">{{ clock }}</p>
              <p class="dial__mode">{{ running ? modes[mode].running : modes[mode].label }}</p>
            </div>
          </div>

          <div class="timer__controls">
            <q-btn
              round
              flat
              icon="restart_alt"
              class="ctl"
              aria-label="Reset timer"
              @click="reset"
            />
            <q-btn
              round
              unelevated
              :icon="running ? 'pause' : 'play_arrow'"
              class="ctl ctl--main"
              :aria-label="running ? 'Pause timer' : 'Start timer'"
              @click="running ? pause() : start()"
            />
            <q-btn
              round
              flat
              icon="skip_next"
              class="ctl"
              aria-label="Skip to next session"
              @click="advance(false)"
            />
          </div>
          <p class="timer__hint">{{ modes[mode].minutes }} min · every 4th break is long</p>
        </section>

        <!-- Mixer -->
        <section class="panel mixer" aria-labelledby="mixer-title">
          <div class="mixer__head">
            <h2 id="mixer-title">Soundscape</h2>
            <q-btn
              unelevated
              no-caps
              :icon="playing ? 'pause' : 'play_arrow'"
              :label="playing ? 'Pause sound' : 'Play sound'"
              class="pill"
              @click="toggleSound"
            />
          </div>

          <div class="mixer__scenes" role="group" aria-label="Scenes">
            <q-btn
              v-for="scene in scenes"
              :key="scene.name"
              flat
              no-caps
              :label="scene.name"
              class="chip"
              @click="applyScene(scene.mix)"
            />
          </div>

          <ul class="channels">
            <li
              v-for="ch in channels"
              :key="ch.id"
              class="channel"
              :class="{ 'is-muted': settings.muted[ch.id] }"
            >
              <q-knob
                v-model="settings.volumes[ch.id]"
                :min="0"
                :max="100"
                :step="1"
                size="76px"
                :thickness="0.14"
                color="accent"
                track-color="transparent"
                class="channel__knob"
                :aria-label="`${ch.label} volume`"
                show-value
              >
                <q-icon :name="ch.icon" size="22px" aria-hidden="true" />
              </q-knob>
              <span class="channel__label">{{ ch.label }}</span>
              <span class="channel__value">{{ settings.volumes[ch.id] }}%</span>
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="settings.muted[ch.id] ? 'volume_off' : 'volume_up'"
                class="channel__mute"
                :aria-label="`Mute ${ch.label}`"
                :aria-pressed="settings.muted[ch.id]"
                @click="settings.muted[ch.id] = !settings.muted[ch.id]"
              />
            </li>
          </ul>

          <div class="master">
            <q-icon name="volume_down" size="20px" aria-hidden="true" />
            <q-slider
              v-model="settings.master"
              :min="0"
              :max="100"
              color="accent"
              thumb-size="18px"
              aria-label="Master volume"
              class="master__slider"
            />
            <q-icon name="volume_up" size="20px" aria-hidden="true" />
          </div>
          <p class="mixer__note">
            Generated live with the Web Audio API from filtered noise. Nothing plays until you press
            Play.
          </p>
        </section>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppBackLink from 'components/AppBackLink.vue';
import { useStoredRef } from 'src/composables/useStoredRef';
import { AmbientEngine, channels, type ChannelId } from './ambient';

type Mode = 'focus' | 'short' | 'long';
type Mix = Record<ChannelId, number>;

const $q = useQuasar();

const modes: Record<Mode, { label: string; running: string; minutes: number }> = {
  focus: { label: 'Focus', running: 'Focusing', minutes: 25 },
  short: { label: 'Short break', running: 'Breathe', minutes: 5 },
  long: { label: 'Long break', running: 'Step away', minutes: 15 },
};
// Short labels keep the segmented control on one line at phone width.
const modeOptions = (Object.keys(modes) as Mode[]).map((value) => ({
  value,
  label: value === 'focus' ? 'Focus' : value === 'short' ? 'Short' : 'Long',
}));

const today = new Date().toDateString();
const settings = useStoredRef(
  'focus',
  () => ({
    volumes: { rain: 60, waves: 0, cafe: 25, wind: 0, white: 0 } as Mix,
    muted: { rain: false, waves: false, cafe: false, wind: false, white: false } as Record<
      ChannelId,
      boolean
    >,
    master: 70,
    sessions: { day: today, count: 0 },
  }),
  (stored) => {
    // A new day starts a new session count.
    if (stored.sessions?.day !== today) stored.sessions = { day: today, count: 0 };
    return stored;
  },
);
const sessionsToday = computed(() => settings.value.sessions.count);
// Dots for the current cycle of four (all four lit right after a long-break run).
const cycleDots = computed(() => sessionsToday.value % 4 || (sessionsToday.value ? 4 : 0));

// --- Timer ------------------------------------------------------------------------
// Counts down to a wall-clock deadline, so throttled background tabs stay accurate.

const mode = ref<Mode>('focus');
const remaining = ref(modes.focus.minutes * 60_000);
const running = ref(false);
let deadline = 0;
let interval: ReturnType<typeof setInterval> | undefined;

const duration = computed(() => modes[mode.value].minutes * 60_000);
const progress = computed(() => 1 - remaining.value / duration.value);
const clock = computed(() => {
  const total = Math.ceil(remaining.value / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

function tick() {
  remaining.value = Math.max(0, deadline - Date.now());
  if (remaining.value === 0) advance(true);
}

function start() {
  deadline = Date.now() + remaining.value;
  running.value = true;
  clearInterval(interval);
  interval = setInterval(tick, 250);
}

function pause() {
  if (running.value) tick();
  running.value = false;
  clearInterval(interval);
}

function reset() {
  pause();
  remaining.value = duration.value;
}

function setMode(next: Mode) {
  pause();
  mode.value = next;
  remaining.value = duration.value;
}

/** Move to the next session; `completed` counts it and plays the chime. */
function advance(completed: boolean) {
  const wasFocus = mode.value === 'focus';
  if (completed && wasFocus) settings.value.sessions.count++;
  const count = settings.value.sessions.count;
  setMode(wasFocus ? (count > 0 && count % 4 === 0 ? 'long' : 'short') : 'focus');
  if (completed) {
    engine.chime();
    $q.notify({
      message: wasFocus ? 'Focus session done. Time for a break.' : 'Break over. Ready to focus?',
      icon: 'notifications',
    });
  }
}

// Title shows the countdown while running, like a desktop utility in the dock.
const originalTitle = document.title;
watch([clock, running], () => {
  document.title = running.value ? `${clock.value} · ${modes[mode.value].label}` : originalTitle;
});

// --- Sound ---------------------------------------------------------------------------

const engine = new AmbientEngine();
const playing = ref(false);

function syncMix() {
  for (const { id } of channels) {
    engine.setVolume(id, settings.value.muted[id] ? 0 : settings.value.volumes[id] / 100);
  }
  engine.setMaster(settings.value.master / 100);
}

async function toggleSound() {
  try {
    if (playing.value) {
      await engine.pause();
      playing.value = false;
    } else {
      await engine.start(); // first call creates the AudioContext inside this click
      syncMix();
      playing.value = true;
    }
  } catch {
    $q.notify('Audio is not available in this browser.');
  }
}

watch(settings, syncMix, { deep: true });

const scenes: { name: string; mix: Mix }[] = [
  { name: 'Rainy café', mix: { rain: 65, waves: 0, cafe: 45, wind: 0, white: 0 } },
  { name: 'Seaside', mix: { rain: 0, waves: 75, cafe: 0, wind: 30, white: 0 } },
  { name: 'Deep work', mix: { rain: 20, waves: 0, cafe: 0, wind: 0, white: 40 } },
];

function applyScene(mix: Mix) {
  settings.value.volumes = { ...mix };
  for (const { id } of channels) settings.value.muted[id] = false;
}

onBeforeUnmount(() => {
  clearInterval(interval);
  document.title = originalTitle;
  void engine.dispose();
});
</script>

<style scoped lang="scss">
// Mesh ----------------------------------------------------------------------------

.mesh {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;

  i {
    position: absolute;
    width: 60vmax;
    height: 60vmax;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.55;
    animation: drift 38s ease-in-out infinite alternate;
  }

  i:nth-child(1) {
    top: -20vmax;
    left: -15vmax;
    background: #7c5cff;
  }

  i:nth-child(2) {
    top: -10vmax;
    right: -20vmax;
    background: #1fb5a8;
    animation-duration: 46s;
    animation-delay: -12s;
  }

  i:nth-child(3) {
    bottom: -25vmax;
    right: -5vmax;
    background: #e3489a;
    animation-duration: 52s;
    animation-delay: -20s;
  }

  i:nth-child(4) {
    bottom: -20vmax;
    left: -10vmax;
    background: #3b82f6;
    animation-duration: 42s;
    animation-delay: -5s;
  }

  // Scrim: keeps the brightest blobs from washing out text.
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgb(12 10 30 / 0.35);
  }

  @media (prefers-reduced-motion: reduce) {
    i {
      animation: none;
    }
  }
}

@keyframes drift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(12vw, 8vh) scale(1.15);
  }
  100% {
    transform: translate(-8vw, 14vh) scale(0.95);
  }
}

// Shell ---------------------------------------------------------------------------

.drift__header {
  z-index: 2;
}

.drift__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 1080px;
  height: 64px;
  margin-inline: auto;
  padding: 0 16px;
}

.drift__brand {
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.drift__sessions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 12px;
  border: 1px solid var(--t-border);
  border-radius: 999px;
  background: var(--t-surface);
  backdrop-filter: var(--t-blur);
  font-size: 13px;

  i {
    width: 8px;
    height: 8px;
    border: 1px solid var(--t-muted);
    border-radius: 50%;
  }

  i.on {
    border-color: var(--t-accent);
    background: var(--t-accent);
  }

  span {
    margin-left: 4px;
    font-variant-numeric: tabular-nums;
  }
}

.drift__page {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  max-width: 1080px;
  margin-inline: auto;
  padding: 8px 16px 40px;

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 24px;
    padding-top: 24px;
  }
}

// Frosted panel; near-opaque where backdrop-filter is unsupported.
.panel {
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius);
  background: var(--t-surface);
  box-shadow: var(--t-shadow);
  backdrop-filter: var(--t-blur);

  @supports not (backdrop-filter: blur(1px)) {
    background: rgb(22 18 48 / 0.92);
  }
}

// Shared glass controls
.segmented {
  padding: 4px;
  border: 1px solid var(--t-border);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.18);

  :deep(.q-btn) {
    min-height: 38px;
    padding: 0 8px;
    border-radius: 999px;
    font-weight: 500;
    white-space: nowrap;
  }

  :deep(.q-btn:not(.text-on-primary)) {
    color: var(--t-muted);
  }
}

.pill,
.chip {
  border-radius: 999px;
  font-weight: 500;
}

.pill {
  min-height: 40px;
  padding: 0 16px;
  background: var(--t-primary);
  color: var(--t-on-primary);
}

.chip {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--t-border);
  background: var(--t-surface-2);
  color: var(--t-text);

  &:hover {
    border-color: var(--t-border-strong);
  }
}

// Timer ---------------------------------------------------------------------------

.timer {
  display: grid;
  justify-items: center;
  gap: 20px;
}

.timer .segmented {
  width: 100%;
  max-width: 420px;
}

.dial {
  --dial: min(300px, 72vw);
  position: relative;
  display: grid;
  place-items: center;
  width: var(--dial);
  height: var(--dial);
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 0.06), rgb(255 255 255 / 0.02) 70%);
  box-shadow:
    inset 0 0 0 1px var(--t-border),
    inset 0 20px 40px rgb(255 255 255 / 0.05),
    0 30px 60px -30px rgb(0 0 0 / 0.6);
}

.dial__ring {
  position: absolute;
  inset: 0;

  :deep(.q-circular-progress__circle) {
    stroke-linecap: round;
  }
}

.dial__face {
  text-align: center;

  p {
    margin: 0;
  }
}

.dial__time {
  font-size: calc(var(--dial) * 0.24);
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  letter-spacing: -0.05em;
}

.dial__mode {
  margin-top: 8px;
  color: var(--t-muted);
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.timer__controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ctl {
  width: 52px;
  height: 52px;
  border: 1px solid var(--t-border);
  background: var(--t-surface-2);
  color: var(--t-text);
  transition: transform var(--t-duration) var(--t-ease);

  &:active {
    transform: scale(0.94);
  }
}

.ctl--main {
  width: 72px;
  height: 72px;
  border: 0;
  background: var(--t-primary);
  box-shadow: 0 12px 30px -10px rgb(143 240 224 / 0.6);
  color: var(--t-on-primary);
  font-size: 20px;
}

.timer__hint {
  margin: 0;
  color: var(--t-muted);
  font-size: 13px;
}

// Mixer ---------------------------------------------------------------------------

.mixer {
  display: grid;
  gap: 20px;
}

.mixer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 300;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
}

.mixer__scenes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.channels {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.channel {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 14px 8px 10px;
  border: 1px solid var(--t-border);
  border-radius: 22px;
  background: var(--t-surface-2);
  transition: opacity var(--t-duration) var(--t-ease);

  &.is-muted {
    opacity: 0.55;
  }
}

.channel__knob {
  color: var(--t-accent);
  border-radius: 50%;
  background: radial-gradient(circle, rgb(255 255 255 / 0.12) 52%, rgb(255 255 255 / 0.05) 53%);
  box-shadow: inset 0 0 0 1px var(--t-border);

  :deep(.q-circular-progress__text) {
    color: var(--t-text);
  }
}

.channel__label {
  font-size: 13px;
  font-weight: 500;
}

.channel__value {
  color: var(--t-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.channel__mute {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--t-muted);
}

.master {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border: 1px solid var(--t-border);
  border-radius: 999px;
  background: rgb(0 0 0 / 0.15);
  color: var(--t-muted);
}

.master__slider {
  flex: 1;

  :deep(.q-slider__track) {
    background: rgb(255 255 255 / 0.18);
  }
}

.mixer__note {
  margin: 0;
  color: var(--t-muted);
  font-size: 12px;
}
</style>
