<template>
  <q-layout view="hhh lpr fff">
    <q-page-container>
      <q-page class="launcher">
        <header class="launcher__top">
          <span class="launcher__brand">
            <span class="launcher__mark" aria-hidden="true">Q</span>
            Quasar, five ways
          </span>
          <span class="launcher__version">Quasar v{{ $q.version }}</span>
        </header>

        <section class="launcher__hero" aria-labelledby="launcher-title">
          <h1 id="launcher-title">Five working apps. One framework, every platform.</h1>
          <p class="launcher__lede">
            Quasar is for building applications that do things. Each app below is small but real
            (data, state, keyboard and touch), and each could ship from the same source as a web
            app, an installable PWA, a Capacitor mobile app or an Electron desktop app.
          </p>
          <ul class="launcher__targets" aria-label="Build targets">
            <li v-for="target in targets" :key="target.label">
              <q-icon :name="target.icon" aria-hidden="true" />{{ target.label }}
            </li>
          </ul>
        </section>

        <ol class="launcher__grid">
          <li v-for="app in apps" :key="app.to" class="launcher__item">
            <router-link :to="app.to" class="app-card">
              <AppPreview :app="app.id" :theme="app.theme" class="app-card__preview" />
              <span class="app-card__body">
                <span class="app-card__kind">{{ app.kind }}</span>
                <span class="app-card__name">{{ app.name }}</span>
                <span class="app-card__why">{{ app.why }}</span>
                <span class="app-card__foot">
                  <span class="app-card__style">{{ themes[app.theme].label }}</span>
                  <span class="app-card__open">
                    Open <q-icon name="arrow_forward" aria-hidden="true" />
                  </span>
                </span>
              </span>
            </router-link>
          </li>
        </ol>

        <footer class="launcher__foot">
          Front-end only: every app runs on fake data and keeps its state in your browser's
          localStorage. Nothing is sent anywhere.
        </footer>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import AppPreview, { type PreviewApp } from 'components/AppPreview.vue';
import { themes, type ThemeId } from 'src/themes';

const targets = [
  { icon: 'language', label: 'SPA' },
  { icon: 'install_mobile', label: 'PWA' },
  { icon: 'phone_iphone', label: 'iOS & Android' },
  { icon: 'desktop_windows', label: 'Desktop' },
];

const apps: {
  id: PreviewApp;
  to: string;
  theme: ThemeId;
  kind: string;
  name: string;
  why: string;
}[] = [
  {
    id: 'chat',
    to: '/chat',
    theme: 'editorial',
    kind: 'AI chat assistant',
    name: 'Quill',
    why: 'q-layout drawers collapse from desktop to phone, so one codebase becomes an installable PWA.',
  },
  {
    id: 'issues',
    to: '/issues',
    theme: 'precision',
    kind: 'Issue tracker',
    name: 'Northwind Issues',
    why: 'Dense lists, a right-drawer detail panel and keyboard shortcuts: a desktop tool that builds as an Electron app.',
  },
  {
    id: 'tracker',
    to: '/tracker',
    theme: 'bento',
    kind: 'Spending & habit tracker',
    name: 'Pocket',
    why: 'q-footer tabs, swipeable q-slide-item rows and offline storage: phone-first, shippable via Capacitor.',
  },
  {
    id: 'focus',
    to: '/focus',
    theme: 'glass',
    kind: 'Focus timer & sound mixer',
    name: 'Drift',
    why: 'q-knob and q-circular-progress over the Web Audio API: an Electron-ready desktop utility.',
  },
  {
    id: 'inspect',
    to: '/inspect',
    theme: 'industrial',
    kind: 'Field inspection checklist',
    name: 'Field Inspect',
    why: 'q-stepper with validation rules, q-file photo previews and an offline queue, built for a tablet on site.',
  },
];
</script>

<style scoped lang="scss">
.launcher {
  max-width: 1200px;
  margin-inline: auto;
  padding: 0 16px 48px;

  @media (min-width: 600px) {
    padding-inline: 32px;
  }
}

.launcher__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 72px;
}

.launcher__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.launcher__mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--t-primary);
  color: var(--t-on-primary);
  font-family: var(--t-font-mono);
  font-size: 14px;
}

.launcher__version {
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 12px;
}

.launcher__hero {
  max-width: 760px;
  padding: clamp(24px, 6vw, 72px) 0 clamp(28px, 5vw, 56px);

  h1 {
    margin: 0;
    font-family: var(--t-font-display);
    font-size: clamp(2rem, 1.2rem + 3.6vw, 3.5rem);
    font-weight: var(--t-display-weight);
    line-height: 1.04;
    letter-spacing: var(--t-display-tracking);
    text-wrap: balance;
  }
}

.launcher__lede {
  max-width: 60ch;
  margin: 20px 0 0;
  color: var(--t-muted);
  font-size: 1.0625rem;
  line-height: 1.6;
  text-wrap: pretty;
}

.launcher__targets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;

  li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px 6px 10px;
    border: 1px solid var(--t-border);
    border-radius: var(--t-radius-pill);
    background: var(--t-surface);
    font-size: 13px;
    font-weight: 500;
  }

  .q-icon {
    color: var(--t-muted);
    font-size: 16px;
  }
}

// Six-column grid: two wide cards, then three.
.launcher__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    .launcher__item:last-child {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 1080px) {
    grid-template-columns: repeat(6, minmax(0, 1fr));

    .launcher__item {
      grid-column: span 2;
    }

    .launcher__item:nth-child(-n + 2) {
      grid-column: span 3;
    }

    .launcher__item:last-child {
      grid-column: span 2;
    }
  }
}

.launcher__item {
  display: flex;
}

.app-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--t-border);
  border-radius: var(--t-radius);
  background: var(--t-surface);
  box-shadow: var(--t-shadow);
  color: inherit;
  text-decoration: none;
  transition:
    translate 200ms var(--t-ease),
    box-shadow 200ms var(--t-ease);

  &:hover {
    translate: 0 -3px;
    box-shadow: var(--t-shadow-pop);
  }

  &:focus-visible {
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover {
      translate: none;
    }
  }
}

.app-card__preview {
  height: 200px;
  border-bottom: 1px solid var(--t-border);
}

.app-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px 20px;
}

.app-card__kind {
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.app-card__name {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.app-card__why {
  color: var(--t-muted);
  font-size: 14px;
  line-height: 1.5;
}

.app-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 14px;
  font-size: 13px;
}

.app-card__style {
  color: var(--t-muted);
}

.app-card__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;

  .q-icon {
    font-size: 16px;
    transition: translate 200ms var(--t-ease);
  }
}

.app-card:hover .app-card__open .q-icon {
  translate: 3px 0;
}

.launcher__foot {
  margin-top: 40px;
  color: var(--t-muted);
  font-size: 13px;
}
</style>
