<template>
  <q-layout view="hhh lpr fff">
    <q-page-container>
      <q-page class="not-found">
        <p class="not-found__code">404</p>
        <h1>Nothing here.</h1>
        <p class="not-found__text">That route isn't one of the five apps.</p>
        <q-btn unelevated color="primary" text-color="white" to="/" label="Back to the apps" />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.not-found {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
}

.not-found__code {
  margin: 0;
  color: var(--t-muted);
  font-family: var(--t-font-mono);
}

.not-found__text {
  margin: 0 0 16px;
  color: var(--t-muted);
}
</style>
