<template>
  <!-- Status: a ring that fills as work progresses. Priority: signal bars. -->
  <span
    v-if="status"
    class="glyph glyph--status"
    :class="`is-${status}`"
    role="img"
    :aria-label="statusLabel(status)"
  />
  <span
    v-else-if="priority !== undefined"
    class="glyph glyph--priority"
    :class="`is-p${priority}`"
    role="img"
    :aria-label="priorityLabel(priority)"
  >
    <template v-if="priority === 1">!</template>
    <template v-else><i /><i /><i /></template>
  </span>
</template>

<script setup lang="ts">
import { priorityLabel, statusLabel, type Priority, type Status } from './data';

defineProps<{ status?: Status; priority?: Priority }>();
</script>

<style scoped lang="scss">
.glyph {
  display: inline-grid;
  flex: none;
  width: 14px;
  height: 14px;
}

.glyph--status {
  border: 1.5px solid var(--t-muted);
  border-radius: 50%;

  &.is-backlog {
    border-style: dashed;
  }

  &.is-progress {
    border-color: var(--t-primary);
    background: conic-gradient(var(--t-primary) 0 50%, transparent 0) content-box;
    padding: 2px;
  }

  &.is-review {
    border-color: var(--t-text);
    background: conic-gradient(var(--t-text) 0 75%, transparent 0) content-box;
    padding: 2px;
  }

  &.is-done {
    border-color: var(--t-muted);
    background:
      linear-gradient(var(--t-bg), var(--t-bg)) 50% 50% / 2px 2px no-repeat,
      var(--t-muted);
  }
}

.glyph--priority {
  grid-auto-flow: column;
  align-items: end;
  gap: 2px;
  padding: 1px;

  i {
    width: 3px;
    border-radius: 1px;
    background: var(--t-border-strong);
  }

  i:nth-child(1) {
    height: 5px;
  }
  i:nth-child(2) {
    height: 8px;
  }
  i:nth-child(3) {
    height: 11px;
  }

  &.is-p2 i,
  &.is-p3 i:nth-child(-n + 2),
  &.is-p4 i:first-child {
    background: var(--t-text);
  }

  &.is-p0 i {
    height: 2px;
  }

  &.is-p1 {
    place-items: center;
    border-radius: 3px;
    background: var(--t-primary);
    color: var(--t-on-primary);
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }
}
</style>
