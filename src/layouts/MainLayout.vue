<template>
  <q-layout view="lHh Lpr lFf">
    <header class="layout-header">
      <div class="header-container">
        <div class="logo-section">
          <h1 class="app-title">Quasar Dashboard</h1>
        </div>

        <div class="theme-selector-section">
          <div class="theme-selector">
            <select v-model="currentTheme" @change="changeTheme(currentTheme)">
              <option v-for="option in themeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <div class="select-icon">
              <q-icon name="expand_more" />
            </div>
          </div>
        </div>

        <div class="version-section">
          <span class="version-text">v{{ $q.version }}</span>
        </div>
      </div>
    </header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Dark } from 'quasar'; // added for built-in dark mode support

const currentTheme = ref('theme1');
const themeOptions = [
  { label: 'Modern Linear', value: 'theme1' },
  { label: 'Brutalist Digital', value: 'theme2' },
  { label: 'Organic Minimalism', value: 'theme3' },
  { label: 'Neo-Skeuomorphism', value: 'theme4' },
  { label: 'Kinetic Typography', value: 'theme5' },
  { label: 'Shadcn-inspired', value: 'theme6' },
];

// Map of theme values to stylesheet paths
const themeStylesheets = {
  theme1: '/src/css/themes/theme1-linear.scss',
  theme2: '/src/css/themes/theme2-brutalist.scss',
  theme3: '/src/css/themes/theme3-organic.scss',
  theme4: '/src/css/themes/theme4-skeuomorph.scss',
  theme5: '/src/css/themes/theme5-kinetic.scss',
  theme6: '/src/css/themes/theme6-shadcn.scss',
};

// Keep track of the current stylesheet element
let currentStylesheetLink: HTMLLinkElement | null = null;

function changeTheme(theme: string) {
  // Remove the old stylesheet if it exists
  if (currentStylesheetLink && document.head.contains(currentStylesheetLink)) {
    document.head.removeChild(currentStylesheetLink);
  }

  // Create and add the new stylesheet
  if (themeStylesheets[theme as keyof typeof themeStylesheets]) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = themeStylesheets[theme as keyof typeof themeStylesheets];
    document.head.appendChild(stylesheet);
    currentStylesheetLink = stylesheet;
  }

  // Set the body class
  document.body.className = theme;

  // Use Quasar's built-in dark mode if "theme1" is dark
  Dark.set(theme === 'theme1'); // adjust condition if additional themes are dark

  // Save the theme preference
  localStorage.setItem('quasar-theme', theme);
}

watch(currentTheme, (newTheme) => {
  changeTheme(newTheme);
});

onMounted(() => {
  const savedTheme = localStorage.getItem('quasar-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
    changeTheme(savedTheme);
  } else {
    changeTheme('theme1');
  }
});
</script>

<style lang="scss" scoped>
.layout-header {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  padding: 0 24px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1400px;
  margin: 0 auto;
}

.app-title {
  margin: 0;
  font-size: 24px;
}

.theme-selector {
  position: relative;
  min-width: 180px;

  select {
    appearance: none;
    width: 100%;
    padding: 10px 16px;
    font-size: 16px;
    border: none;
    outline: none;
    background: transparent;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .select-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 0;
  }
}

.version-text {
  opacity: 0.7;
  font-size: 14px;
}

/* Theme-specific styles will be applied through the body class */
body.theme1 .theme-selector {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg-color);
}

body.theme2 .theme-selector {
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
  background-color: #fff;
}

body.theme3 .theme-selector {
  border: 2px solid var(--tertiary-color);
  border-radius: 22px !important;
  background-color: transparent;
}

body.theme4 .theme-selector {
  border-radius: 10px !important;
  background-color: var(--surface-color);
  box-shadow:
    inset 3px 3px 6px var(--shadow-dark),
    inset -3px -3px 6px var(--shadow-light);
}

body.theme5 .theme-selector {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px !important;
  background-color: rgba(255, 255, 255, 0.05);
}

/* Force dark background for the q-layout container */
::v-deep q-layout {
  background-color: var(--background-color) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .header-container {
    padding: 0 16px;
    height: auto;
    flex-direction: column;
    padding-top: 16px;
    padding-bottom: 16px;
    gap: 12px;
  }

  .version-section {
    display: none;
  }
}
</style>
