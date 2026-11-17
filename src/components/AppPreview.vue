<template>
  <!-- Decorative miniature of each app, painted with that app's theme tokens. -->
  <div class="pv theme-scope" :class="[themeClass(theme), `pv--${app}`]" aria-hidden="true">
    <template v-if="app === 'chat'">
      <div class="pv-chat__side"><i /><i /><i /></div>
      <div class="pv-chat__main">
        <p class="pv-chat__title">Good morning.</p>
        <p class="pv-chat__q">Plan my week around two deadlines</p>
        <p class="pv-chat__a">
          Start with the hard one on Monday while your focus is fresh<span class="pv-caret" />
        </p>
        <div class="pv-chat__composer">Ask anything…<span>↑</span></div>
      </div>
    </template>

    <template v-else-if="app === 'issues'">
      <div class="pv-iss__bar"><b>Issues</b><kbd>C</kbd></div>
      <div v-for="row in issueRows" :key="row.id" class="pv-iss__row" :class="{ on: row.on }">
        <i class="pv-iss__status" :class="row.status" />
        <span class="pv-iss__id">{{ row.id }}</span>
        <span class="pv-iss__title">{{ row.title }}</span>
      </div>
    </template>

    <template v-else-if="app === 'tracker'">
      <div class="pv-bento">
        <div class="pv-bento__tile pv-bento__tile--big">
          <small>This week</small><strong>$184</strong>
        </div>
        <div class="pv-bento__tile pv-bento__tile--bars">
          <i v-for="(h, i) in [40, 70, 30, 90, 55, 20, 65]" :key="i" :style="{ height: h + '%' }" />
        </div>
        <div class="pv-bento__tile pv-bento__tile--streak">
          <strong>5</strong><small>day streak</small>
        </div>
        <div class="pv-bento__tile pv-bento__tile--add">+</div>
      </div>
    </template>

    <template v-else-if="app === 'focus'">
      <div class="pv-glass">
        <div class="pv-glass__dial"><span>24:59</span></div>
        <div class="pv-glass__knobs"><i /><i /><i /></div>
      </div>
    </template>

    <template v-else>
      <div class="pv-ind__bar">FIELD INSPECT</div>
      <div class="pv-ind__steps">
        <i class="done">1</i><i class="done">2</i><i class="now">3</i><i>4</i><i>5</i>
      </div>
      <p class="pv-ind__item">EMERGENCY STOP FUNCTIONAL</p>
      <div class="pv-ind__choices"><b class="pass">PASS</b><b>FAIL</b><b>N/A</b></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { themeClass, type ThemeId } from 'src/themes';

export type PreviewApp = 'chat' | 'issues' | 'tracker' | 'focus' | 'inspect';

defineProps<{ app: PreviewApp; theme: ThemeId }>();

const issueRows = [
  { id: 'NW-142', title: 'Token refresh race on resume', status: 'progress', on: true },
  { id: 'NW-139', title: 'Keyboard nav in command menu', status: 'todo', on: false },
  { id: 'NW-131', title: 'Export CSV with filters', status: 'done', on: false },
  { id: 'NW-128', title: 'Empty state copy', status: 'todo', on: false },
];
</script>

<style scoped lang="scss">
.pv {
  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--t-bg-image), var(--t-bg);
  color: var(--t-text);
  font-family: var(--t-font-body);
  font-size: 11px;
  line-height: 1.35;

  p {
    margin: 0;
  }
}

// Chat ------------------------------------------------------------------------
.pv--chat {
  display: grid;
  grid-template-columns: 26% 1fr;
}

.pv-chat__side {
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 18px 12px;
  border-right: 1px solid var(--t-border);

  i {
    height: 6px;
    border-radius: 3px;
    background: var(--t-surface-2);
  }

  i:first-child {
    background: var(--t-border);
  }
}

.pv-chat__main {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 18px 18px 0;
}

.pv-chat__title {
  font-family: var(--t-font-display);
  font-size: 22px;
  font-weight: 500;
  line-height: 1.1;
}

.pv-chat__q {
  justify-self: end;
  max-width: 80%;
  padding: 6px 10px;
  border-radius: 12px;
  background: var(--t-surface-2);
}

.pv-chat__a {
  max-width: 90%;
  font-family: var(--t-font-display);
  font-size: 13px;
}

.pv-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 2px;
  vertical-align: -2px;
  background: var(--t-primary);
}

.pv-chat__composer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding: 6px 6px 6px 12px;
  border: 1px solid var(--t-border);
  border-radius: 14px;
  background: var(--t-surface);
  color: var(--t-muted);

  span {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--t-primary);
    color: var(--t-on-primary);
  }
}

// Issues ----------------------------------------------------------------------
.pv--issues {
  padding: 14px 0;
  font-size: 11px;
}

.pv-iss__bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 14px 10px;
  border-bottom: 1px solid var(--t-border);

  kbd {
    padding: 0 5px;
    border: 1px solid var(--t-border-strong);
    border-radius: 4px;
    color: var(--t-muted);
    font-family: var(--t-font-mono);
    font-size: 10px;
  }
}

.pv-iss__row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 34px;
  padding: 0 14px;
  border-bottom: 1px solid var(--t-border);
  white-space: nowrap;

  &.on {
    background: var(--t-surface-2);
    box-shadow: inset 2px 0 0 var(--t-primary);
  }
}

.pv-iss__status {
  flex: none;
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--t-muted);
  border-radius: 50%;

  &.progress {
    border-color: var(--t-primary);
    background: conic-gradient(var(--t-primary) 50%, transparent 0);
  }

  &.done {
    border-color: var(--t-muted);
    background: var(--t-muted);
  }
}

.pv-iss__id {
  color: var(--t-muted);
  font-family: var(--t-font-mono);
}

.pv-iss__title {
  overflow: hidden;
  text-overflow: ellipsis;
}

// Tracker ---------------------------------------------------------------------
.pv-bento {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 8px;
  height: 100%;
  padding: 12px;
  color: var(--bento-ink);
}

.pv-bento__tile {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px 12px;
  border-radius: 18px;

  strong {
    font-family: var(--t-font-display);
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
  }
}

.pv-bento__tile--big {
  background: var(--bento-lemon);
}

.pv-bento__tile--bars {
  flex-direction: row;
  align-items: flex-end;
  gap: 4px;
  background: var(--bento-mint);

  i {
    flex: 1;
    border-radius: 4px;
    background: var(--bento-ink);
  }
}

.pv-bento__tile--streak {
  background: var(--bento-lilac);
}

.pv-bento__tile--add {
  align-items: center;
  justify-content: center;
  background: var(--bento-coral);
  font-family: var(--t-font-display);
  font-size: 34px;
  font-weight: 800;
}

// Focus -----------------------------------------------------------------------
.pv-glass {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 14px;
  height: 100%;
}

.pv-glass__dial {
  display: grid;
  place-items: center;
  width: 108px;
  height: 108px;
  border: 1px solid var(--t-border);
  border-radius: 50%;
  background: var(--t-surface);
  box-shadow:
    var(--t-shadow),
    inset 0 0 0 5px rgb(255 255 255 / 0.08);
  backdrop-filter: var(--t-blur);
  font-size: 26px;
  font-weight: 300;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

.pv-glass__knobs {
  display: flex;
  gap: 10px;

  i {
    width: 26px;
    height: 26px;
    border: 1px solid var(--t-border);
    border-radius: 50%;
    background: conic-gradient(var(--t-accent) 0 var(--v, 60%), rgb(255 255 255 / 0.1) 0);
    backdrop-filter: var(--t-blur);
  }

  i:nth-child(2) {
    --v: 30%;
  }

  i:nth-child(3) {
    --v: 80%;
  }
}

// Inspect ---------------------------------------------------------------------
.pv--inspect {
  display: grid;
  align-content: start;
  gap: 10px;
  font-family: var(--t-font-mono);
}

.pv-ind__bar {
  padding: 10px 12px;
  border-bottom: 6px solid transparent;
  border-image: repeating-linear-gradient(-45deg, var(--t-primary) 0 8px, #0d0d0d 8px 16px) 6;
  background: var(--t-header-bg);
  color: #fff;
  font-family: var(--t-font-display);
  font-size: 13px;
  font-weight: 800;
  font-stretch: 75%;
  letter-spacing: 0.04em;
}

.pv-ind__steps {
  display: flex;
  gap: 6px;
  padding: 0 12px;

  i {
    display: grid;
    flex: 1;
    place-items: center;
    height: 20px;
    border: 2px solid var(--t-border);
    font-style: normal;
    font-weight: 700;
  }

  .done {
    background: var(--t-text);
    color: var(--t-surface);
  }

  .now {
    background: var(--t-primary);
  }
}

.pv-ind__item {
  padding: 0 12px;
  font-weight: 600;
}

.pv-ind__choices {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 0 12px;

  b {
    display: grid;
    place-items: center;
    height: 34px;
    border: 2px solid var(--t-border);
    background: var(--t-surface);
  }

  .pass {
    background: var(--t-positive);
    color: #fff;
  }
}
</style>
