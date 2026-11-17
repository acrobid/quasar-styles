# Quasar styles

Five small sample apps built from standard Quasar 2 components, each styled a
different way. The launcher at `/` links to each one.

Everything runs in the browser on sample data; state is kept in `localStorage`.
The only network requests are for Google Fonts.

| Route      | App                        | Style              | Features                                                                      |
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
