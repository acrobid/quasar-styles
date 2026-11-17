// Theme registry. Each id is also the class put on <body>; the styles for it
// live in src/css/themes/ and are bundled globally via quasar.config.ts.

export const themes = [
  { id: 'theme1', label: 'Modern Linear', dark: true },
  { id: 'theme2', label: 'Brutalist Digital', dark: false },
  { id: 'theme3', label: 'Organic Minimalism', dark: false },
  { id: 'theme4', label: 'Neo-Skeuomorphism', dark: false },
  { id: 'theme5', label: 'Kinetic Typography', dark: true },
  { id: 'theme6', label: 'Shadcn-inspired', dark: true },
] as const;

export type Theme = (typeof themes)[number];
export type ThemeId = Theme['id'];

export const DEFAULT_THEME: ThemeId = 'theme1';

export function findTheme(id: string | null): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}
