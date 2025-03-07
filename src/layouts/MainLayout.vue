<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title> Quasar Dashboard </q-toolbar-title>

        <q-select
          v-model="currentTheme"
          :options="themeOptions"
          label="Theme"
          emit-value
          map-options
          dense
          outlined
          class="q-mr-md"
          style="min-width: 150px"
          @update:model-value="changeTheme"
        />

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentTheme = ref('theme1');
const themeOptions = [
  { label: 'Claymorphism', value: 'theme1' },
  { label: 'Brutalist Digital', value: 'theme2' },
  { label: 'Organic Minimalism', value: 'theme3' },
  { label: 'Neo-Skeuomorphism', value: 'theme4' },
  { label: 'Kinetic Typography', value: 'theme5' },
];

function changeTheme(theme: string) {
  document.body.className = theme;
  localStorage.setItem('quasar-theme', theme);
}

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
