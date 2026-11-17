# Quasar, five ways

A showcase of what Quasar is _for_: five small, working front-end apps, each a
different kind of thing people build, each in its own visual style, all from
one Quasar 2 + Vue 3 + TypeScript codebase that can ship as an SPA, PWA,
Capacitor mobile app or Electron desktop app.

The launcher at `/` previews every app in its own style. Everything runs on fake
data in the browser (state lives in `localStorage`); there are no network calls
besides Google Fonts.

| Route      | App                        | Style              | Shows off                                                                     |
| ---------- | -------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `/chat`    | Quill, AI chat assistant   | Calm editorial     | Drawer layout, simulated streaming with stop, model picker, copy, auto-grow   |
| `/issues`  | Northwind Issues           | Precision dark     | Search/filter/sort, right-drawer detail editing, create dialog, `c / j k esc` |
| `/tracker` | Pocket, spending & habits  | Bento & bouncy     | Bottom tabs, quick-add bottom sheet, swipe-to-delete, weekly summary          |
| `/focus`   | Drift, focus timer & mixer | Frosted glass      | Pomodoro dial, Web Audio noise mixer with knobs, drifting gradient mesh       |
| `/inspect` | Field Inspect              | Industrial utility | Stepper with validation, local photo previews, canvas signature, outbox sync  |

## How it's put together

- `src/router/routes.ts`: one lazily loaded route per app; `meta.theme` names its style.
- `src/themes.ts` + `src/router/index.ts`: an `afterEach` hook puts `theme-<id>` on `<body>`
  and sets Quasar's dark mode (`/chat` follows the system light/dark setting).
- `src/css/themes/*.scss`: each style is a set of CSS custom-property tokens;
  `src/css/app.scss` maps them onto Quasar's components and brand colours.
- `src/apps/<app>/`: each app's layout, logic and scoped styles.
- `src/composables/useStoredRef.ts`: the shared, storage-safe `localStorage` ref.

## Develop

```bash
npm install
npx quasar dev     # dev server with hot reload
npm run lint
npm run build      # production SPA in dist/spa
```
