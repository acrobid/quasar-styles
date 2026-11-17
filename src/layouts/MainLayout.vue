<template>
  <q-layout view="hHh lpR fFf">
    <header class="app-header">
      <div class="app-header__inner">
        <a class="brand" href="#/">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__name">Quasar Dashboard</span>
        </a>

        <div class="app-header__actions">
          <label class="theme-picker">
            <span class="theme-picker__label">Theme</span>
            <span class="theme-picker__control">
              <select v-model="currentTheme" class="theme-picker__select">
                <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                  {{ theme.label }}
                </option>
              </select>
              <q-icon name="unfold_more" class="theme-picker__icon" aria-hidden="true" />
            </span>
          </label>
          <span class="app-header__version">v{{ $q.version }}</span>
        </div>
      </div>
    </header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Dark } from 'quasar';
import { DEFAULT_THEME, findTheme, themes, type ThemeId } from 'src/themes';

const STORAGE_KEY = 'quasar-theme';

function readSavedTheme(): ThemeId {
  try {
    return findTheme(localStorage.getItem(STORAGE_KEY))?.id ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME; // storage blocked (private mode, sandboxed iframe, …)
  }
}

function applyTheme(id: ThemeId) {
  const theme = findTheme(id) ?? themes[0];
  const { classList } = document.body;

  for (const { id: other } of themes) {
    classList.toggle(other, other === theme.id);
  }
  Dark.set(theme.dark);
  document.documentElement.style.colorScheme = theme.dark ? 'dark' : 'light';

  try {
    localStorage.setItem(STORAGE_KEY, theme.id);
  } catch {
    // Preference just won't persist.
  }
}

const currentTheme = ref<ThemeId>(readSavedTheme());

// Applied synchronously during setup so the first paint is already themed.
watch(currentTheme, applyTheme, { immediate: true });
</script>
