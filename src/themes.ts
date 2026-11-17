// Theme registry. Each id maps to a class (`theme-<id>`) that carries the
// theme's tokens; the styles live in src/css/themes/ and are bundled globally
// so the launcher can preview every app in its own style.
//
// The active theme follows the route (`meta.theme`, applied in router/index.ts).

import { Dark } from 'quasar';

export const themes = {
  launcher: { label: 'Launcher', dark: false },
  editorial: { label: 'Calm editorial', dark: 'auto' },
  precision: { label: 'Precision dark', dark: true },
  bento: { label: 'Bento & bouncy', dark: false },
  glass: { label: 'Frosted glass', dark: true },
  industrial: { label: 'Industrial utility', dark: false },
} as const satisfies Record<string, { label: string; dark: boolean | 'auto' }>;

export type ThemeId = keyof typeof themes;

export const DEFAULT_THEME: ThemeId = 'launcher';

export const themeClass = (id: ThemeId) => `theme-${id}`;

export function applyTheme(id: ThemeId = DEFAULT_THEME) {
  const { classList } = document.body;
  for (const other of Object.keys(themes) as ThemeId[]) {
    classList.toggle(themeClass(other), other === id);
  }

  const { dark } = themes[id];
  Dark.set(dark); // 'auto' follows prefers-color-scheme via body--dark/body--light
  document.documentElement.style.colorScheme =
    dark === 'auto' ? 'light dark' : dark ? 'dark' : 'light';
}
