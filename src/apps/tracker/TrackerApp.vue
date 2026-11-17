<template>
  <q-layout view="hHh lpr fFf" class="pocket">
    <q-header class="pocket__header">
      <div class="pocket__frame pocket__bar">
        <AppBackLink />
        <span class="pocket__brand">Pocket</span>
        <span class="pocket__date">{{ todayLabel }}</span>
      </div>
    </q-header>

    <q-page-container>
      <q-page class="pocket__frame pocket__page">
        <q-tab-panels v-model="tab" :animated="!reducedMotion" swipeable class="pocket__panels">
          <!-- Today: bento overview -->
          <q-tab-panel name="today" class="pocket__panel">
            <h1 class="pocket__title">Hi there.</h1>
            <div class="bento">
              <section class="tile tile--lemon tile--wide" style="--i: 0" aria-labelledby="t-week">
                <h2 id="t-week" class="tile__label">Spent this week</h2>
                <p class="tile__big">{{ formatMoney(weekTotal) }}</p>
                <q-linear-progress
                  :value="Math.min(weekTotal / state.weeklyBudgetCents, 1)"
                  rounded
                  size="10px"
                  class="tile__progress"
                  :aria-label="`${budgetPct}% of weekly budget used`"
                />
                <p class="tile__note">
                  {{
                    budgetLeft >= 0
                      ? `${formatMoney(budgetLeft, true)} left`
                      : `${formatMoney(-budgetLeft, true)} over`
                  }}
                  of {{ formatMoney(state.weeklyBudgetCents, true) }}
                </p>
              </section>

              <section
                class="tile tile--mint tile--wide"
                style="--i: 1"
                aria-labelledby="t-summary"
              >
                <div class="tile__row">
                  <h2 id="t-summary" class="tile__label">Weekly summary</h2>
                  <span class="tile__note">avg {{ formatMoney(dailyAverage, true) }}/day</span>
                </div>
                <ol class="bars" aria-label="Spending per day this week">
                  <li v-for="d in weekBars" :key="d.key" :class="{ 'is-today': d.isToday }">
                    <span class="bars__bar" :style="{ '--h': d.pct + '%' }" />
                    <span class="bars__day" aria-hidden="true">{{ d.short }}</span>
                    <span class="visually-hidden">{{ d.long }}: {{ formatMoney(d.cents) }}</span>
                  </li>
                </ol>
                <p class="tile__note">
                  Most on <strong>{{ topCategory?.label ?? 'nothing yet' }}</strong>
                  <template v-if="topCategory">
                    · {{ formatMoney(topCategory.cents, true) }}</template
                  >
                </p>
              </section>

              <section class="tile tile--lilac" style="--i: 2" aria-labelledby="t-habits">
                <h2 id="t-habits" class="tile__label">Habits today</h2>
                <p class="tile__big">
                  {{ doneToday }}<span class="tile__of">/{{ state.habits.length }}</span>
                </p>
              </section>

              <section class="tile tile--coral" style="--i: 3" aria-labelledby="t-streak">
                <h2 id="t-streak" class="tile__label">Best streak</h2>
                <p class="tile__big">
                  {{ bestStreak
                  }}<span class="tile__of">&nbsp;{{ bestStreak === 1 ? 'day' : 'days' }}</span>
                </p>
              </section>

              <section class="tile tile--sky tile--wide" style="--i: 4" aria-labelledby="t-checkin">
                <h2 id="t-checkin" class="tile__label">Check in</h2>
                <div class="checkins">
                  <button
                    v-for="h in state.habits"
                    :key="h.id"
                    type="button"
                    class="checkin"
                    :class="{ 'is-done': isDone(h, todayKey) }"
                    :aria-pressed="isDone(h, todayKey)"
                    @click="toggle(h, todayKey)"
                  >
                    <q-icon
                      :name="isDone(h, todayKey) ? 'check_circle' : 'radio_button_unchecked'"
                      aria-hidden="true"
                    />
                    {{ h.name }}
                  </button>
                  <p v-if="!state.habits.length" class="tile__note">
                    Add a habit with the + button.
                  </p>
                </div>
              </section>

              <section
                class="tile tile--plain tile--wide"
                style="--i: 5"
                aria-labelledby="t-latest"
              >
                <div class="tile__row">
                  <h2 id="t-latest" class="tile__label">Latest</h2>
                  <button type="button" class="tile__link" @click="tab = 'spend'">See all</button>
                </div>
                <ul class="latest">
                  <li v-for="e in latest" :key="e.id">
                    <span class="cat-dot" :class="`tile--${category(e.category).tile}`">
                      <q-icon :name="category(e.category).icon" aria-hidden="true" />
                    </span>
                    <span class="latest__note">{{ e.note || category(e.category).label }}</span>
                    <span class="latest__amt">{{ formatMoney(e.cents) }}</span>
                  </li>
                </ul>
              </section>
            </div>
          </q-tab-panel>

          <!-- Spending list -->
          <q-tab-panel name="spend" class="pocket__panel">
            <h1 class="pocket__title">Spending</h1>
            <p class="pocket__sub">Swipe an entry left to delete it.</p>
            <section v-for="group in expenseGroups" :key="group.key" class="group">
              <h2 class="group__head">
                <span>{{ group.label }}</span
                ><span>{{ formatMoney(group.total) }}</span>
              </h2>
              <q-list class="group__list">
                <q-slide-item
                  v-for="e in group.items"
                  :key="e.id"
                  right-color="negative"
                  class="entry"
                  @right="({ reset }) => removeExpense(e, reset)"
                >
                  <template #right>
                    <span class="entry__swipe"><q-icon name="delete" /> Delete</span>
                  </template>
                  <q-item class="entry__item">
                    <q-item-section avatar>
                      <span class="cat-dot" :class="`tile--${category(e.category).tile}`">
                        <q-icon :name="category(e.category).icon" aria-hidden="true" />
                      </span>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="entry__note">{{
                        e.note || category(e.category).label
                      }}</q-item-label>
                      <q-item-label caption>{{ category(e.category).label }}</q-item-label>
                    </q-item-section>
                    <q-item-section side class="entry__amt">{{
                      formatMoney(e.cents)
                    }}</q-item-section>
                    <button
                      type="button"
                      class="entry__delete"
                      :aria-label="`Delete ${e.note || category(e.category).label}`"
                      @click="removeExpense(e)"
                    >
                      <q-icon name="close" aria-hidden="true" />
                    </button>
                  </q-item>
                </q-slide-item>
              </q-list>
            </section>
            <p v-if="!state.expenses.length" class="pocket__empty">
              No spending yet. Tap + to add some.
            </p>
          </q-tab-panel>

          <!-- Habits -->
          <q-tab-panel name="habits" class="pocket__panel">
            <h1 class="pocket__title">Habits</h1>
            <p class="pocket__sub">Tap a day to check in. Swipe left to delete a habit.</p>
            <q-list class="habits">
              <q-slide-item
                v-for="h in state.habits"
                :key="h.id"
                right-color="negative"
                class="habit-slide"
                @right="({ reset }) => removeHabit(h, reset)"
              >
                <template #right>
                  <span class="entry__swipe"><q-icon name="delete" /> Delete</span>
                </template>
                <article class="habit" :class="`tile--${h.tile}`">
                  <div class="habit__top">
                    <h2 class="habit__name">{{ h.name }}</h2>
                    <span class="habit__streak">
                      <q-icon name="local_fire_department" aria-hidden="true" />{{ streak(h.done) }}
                      <span class="visually-hidden">day streak</span>
                    </span>
                  </div>
                  <div class="week" role="group" :aria-label="`${h.name} this week`">
                    <button
                      v-for="d in week"
                      :key="d.key"
                      type="button"
                      class="week__day"
                      :class="{ 'is-done': isDone(h, d.key), 'is-today': d.key === todayKey }"
                      :aria-pressed="isDone(h, d.key)"
                      :aria-label="d.long"
                      :disabled="d.future"
                      @click="toggle(h, d.key)"
                    >
                      {{ d.short }}
                    </button>
                  </div>
                </article>
              </q-slide-item>
            </q-list>
            <p v-if="!state.habits.length" class="pocket__empty">
              No habits yet. Tap + to add one.
            </p>
          </q-tab-panel>
        </q-tab-panels>

        <q-page-sticky position="bottom-right" :offset="[20, 20]">
          <q-btn round unelevated icon="add" class="fab" aria-label="Quick add" @click="openAdd" />
        </q-page-sticky>
      </q-page>
    </q-page-container>

    <q-footer class="pocket__footer">
      <q-tabs
        v-model="tab"
        no-caps
        class="pocket__frame pocket__tabs"
        indicator-color="transparent"
        aria-label="Sections"
      >
        <q-tab name="today" icon="dashboard" label="Today" />
        <q-tab name="spend" icon="payments" label="Spending" />
        <q-tab name="habits" icon="self_improvement" label="Habits" />
      </q-tabs>
    </q-footer>

    <!-- Quick add: a bottom sheet -->
    <q-dialog v-model="addOpen" position="bottom" @hide="resetForms">
      <q-card class="sheet">
        <div class="sheet__grip" aria-hidden="true" />
        <q-btn-toggle
          v-model="addMode"
          spread
          no-caps
          unelevated
          class="sheet__mode"
          :options="[
            { label: 'Expense', value: 'expense' },
            { label: 'Habit', value: 'habit' },
          ]"
        />

        <q-form v-if="addMode === 'expense'" class="sheet__form" @submit="addExpense">
          <q-input
            v-model="amount"
            outlined
            autofocus
            inputmode="decimal"
            label="Amount"
            prefix="$"
            class="sheet__amount"
            :rules="[
              (v: string) => !!v || 'Enter an amount',
              (v: string) => /^\d+(\.\d{1,2})?$/.test(v) || 'Use a number like 12.50',
              (v: string) => (Number(v) > 0 && Number(v) <= 10000) || 'Between $0.01 and $10,000',
            ]"
          />
          <fieldset class="sheet__cats">
            <legend class="sheet__legend">Category</legend>
            <button
              v-for="c in categories"
              :key="c.id"
              type="button"
              class="cat-pick"
              :class="[`tile--${c.tile}`, { 'is-on': newCategory === c.id }]"
              :aria-pressed="newCategory === c.id"
              @click="newCategory = c.id"
            >
              <q-icon :name="c.icon" aria-hidden="true" />{{ c.label }}
            </button>
          </fieldset>
          <q-input v-model="note" outlined label="Note (optional)" maxlength="60" />
          <q-btn type="submit" unelevated no-caps label="Add expense" class="sheet__submit" />
        </q-form>

        <q-form v-else class="sheet__form" @submit="addHabit">
          <q-input
            v-model="habitName"
            outlined
            autofocus
            label="Habit"
            placeholder="e.g. Drink water"
            maxlength="40"
            :rules="[(v: string) => v.trim().length >= 2 || 'Give it a short name']"
          />
          <fieldset class="sheet__cats sheet__cats--colors">
            <legend class="sheet__legend">Colour</legend>
            <button
              v-for="t in tiles"
              :key="t"
              type="button"
              class="swatch"
              :class="[`tile--${t}`, { 'is-on': habitTile === t }]"
              :aria-pressed="habitTile === t"
              :aria-label="t"
              @click="habitTile = t"
            />
          </fieldset>
          <q-btn type="submit" unelevated no-caps label="Add habit" class="sheet__submit" />
        </q-form>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppBackLink from 'components/AppBackLink.vue';
import { uid, useStoredRef } from 'src/composables/useStoredRef';
import {
  categories,
  category,
  dayKey,
  dayLabel,
  formatMoney,
  seedTracker,
  streak,
  tiles,
  weekDays,
  type CategoryId,
  type Expense,
  type Habit,
  type Tile,
} from './data';

const $q = useQuasar();
const reducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = useStoredRef('tracker', seedTracker, (stored) =>
  Array.isArray(stored.expenses) && Array.isArray(stored.habits) ? stored : seedTracker(),
);

const tab = ref<'today' | 'spend' | 'habits'>('today');
const todayKey = dayKey(new Date());
const todayLabel = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

// --- Week + summaries ---------------------------------------------------------

const week = weekDays().map((d) => ({
  key: dayKey(d),
  short: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
  long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  future: dayKey(d) > todayKey,
}));

const weekExpenses = computed(() => {
  const keys = new Set(week.map((d) => d.key));
  return state.value.expenses.filter((e) => keys.has(dayKey(e.at)));
});

const weekTotal = computed(() => weekExpenses.value.reduce((sum, e) => sum + e.cents, 0));
const budgetLeft = computed(() => state.value.weeklyBudgetCents - weekTotal.value);
const budgetPct = computed(() =>
  Math.round((weekTotal.value / state.value.weeklyBudgetCents) * 100),
);
const daysSoFar = week.filter((d) => !d.future).length;
const dailyAverage = computed(() => weekTotal.value / daysSoFar);

const weekBars = computed(() => {
  const totals = week.map((d) =>
    weekExpenses.value.filter((e) => dayKey(e.at) === d.key).reduce((s, e) => s + e.cents, 0),
  );
  const max = Math.max(...totals, 1);
  return week.map((d, i) => ({
    ...d,
    cents: totals[i] ?? 0,
    pct: Math.max(((totals[i] ?? 0) / max) * 100, 4),
    isToday: d.key === todayKey,
  }));
});

const topCategory = computed(() => {
  const sums = categories.map((c) => ({
    label: c.label,
    cents: weekExpenses.value.filter((e) => e.category === c.id).reduce((s, e) => s + e.cents, 0),
  }));
  const top = sums.sort((a, b) => b.cents - a.cents)[0];
  return top && top.cents > 0 ? top : null;
});

const sortedExpenses = computed(() => [...state.value.expenses].sort((a, b) => b.at - a.at));
const latest = computed(() => sortedExpenses.value.slice(0, 3));

const expenseGroups = computed(() => {
  const groups: { key: string; label: string; total: number; items: Expense[] }[] = [];
  for (const e of sortedExpenses.value) {
    const key = dayKey(e.at);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: dayLabel(e.at), total: 0, items: [] };
      groups.push(group);
    }
    group.items.push(e);
    group.total += e.cents;
  }
  return groups;
});

// --- Habits -----------------------------------------------------------------------

const isDone = (h: Habit, key: string) => h.done.includes(key);
const doneToday = computed(() => state.value.habits.filter((h) => isDone(h, todayKey)).length);
const bestStreak = computed(() => Math.max(0, ...state.value.habits.map((h) => streak(h.done))));

function toggle(h: Habit, key: string) {
  h.done = isDone(h, key) ? h.done.filter((k) => k !== key) : [...h.done, key];
}

// --- Delete with undo --------------------------------------------------------------

function undoable(message: string, undo: () => void) {
  $q.notify({ message, actions: [{ label: 'Undo', color: 'toast', handler: undo }] });
}

function removeExpense(e: Expense, reset?: () => void) {
  const list = state.value.expenses;
  const index = list.findIndex((x) => x.id === e.id);
  if (index < 0) return;
  list.splice(index, 1);
  reset?.();
  undoable(`Deleted ${formatMoney(e.cents)}`, () => list.splice(index, 0, e));
}

function removeHabit(h: Habit, reset: () => void) {
  const list = state.value.habits;
  const index = list.findIndex((x) => x.id === h.id);
  if (index < 0) return;
  list.splice(index, 1);
  reset();
  undoable(`Deleted “${h.name}”`, () => list.splice(index, 0, h));
}

// --- Quick add sheet -----------------------------------------------------------------

const addOpen = ref(false);
const addMode = ref<'expense' | 'habit'>('expense');
const amount = ref('');
const note = ref('');
const newCategory = ref<CategoryId>('food');
const habitName = ref('');
const habitTile = ref<Tile>('lemon');

function openAdd() {
  addMode.value = tab.value === 'habits' ? 'habit' : 'expense';
  addOpen.value = true;
}

function resetForms() {
  amount.value = '';
  note.value = '';
  newCategory.value = 'food';
  habitName.value = '';
  habitTile.value = 'lemon';
}

function addExpense() {
  const cents = Math.round(Number(amount.value) * 100);
  state.value.expenses.push({
    id: uid(),
    cents,
    category: newCategory.value,
    note: note.value.trim(),
    at: Date.now(),
  });
  addOpen.value = false;
  $q.notify(`Added ${formatMoney(cents)}`);
}

function addHabit() {
  state.value.habits.push({
    id: uid(),
    name: habitName.value.trim(),
    tile: habitTile.value,
    done: [],
  });
  addOpen.value = false;
  tab.value = 'habits';
  $q.notify('Habit added');
}
</script>

<style scoped lang="scss">
// Phone-first: everything sits in a 520px column, centred on wider screens.
.pocket__frame {
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
}

.pocket__header {
  backdrop-filter: blur(12px);
}

.pocket__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 56px;
  padding: 0 12px;
}

.pocket__brand {
  font-family: var(--t-font-display);
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.pocket__date {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--t-surface);
  color: var(--t-muted);
  font-size: 13px;
  font-weight: 500;
}

.pocket__panels {
  background: transparent;
}

.pocket__panel {
  padding: 8px 16px 112px;
}

.pocket__title {
  margin: 8px 4px 16px;
  font-family: var(--t-font-display);
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.04em;
}

.pocket__sub {
  margin: -8px 4px 16px;
  color: var(--t-muted);
  font-size: 14px;
}

.pocket__empty {
  padding: 32px 4px;
  color: var(--t-muted);
  text-align: center;
}

// Tile colours (shared by tiles, category dots, habits, swatches).
.tile--lemon {
  background: var(--bento-lemon);
}
.tile--mint {
  background: var(--bento-mint);
}
.tile--lilac {
  background: var(--bento-lilac);
}
.tile--coral {
  background: var(--bento-coral);
}
.tile--sky {
  background: var(--bento-sky);
}

// Bento grid ------------------------------------------------------------------

.bento {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 18px;
  border-radius: var(--t-radius);
  color: var(--bento-ink);
  animation: pop-in 520ms var(--t-ease) both;
  animation-delay: calc(var(--i, 0) * 50ms);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.tile--wide {
  grid-column: 1 / -1;
}

.tile--plain {
  background: var(--t-surface);
  box-shadow: var(--t-shadow);
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.94);
  }
}

.tile__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.tile__label {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}

.tile__big {
  margin: 0;
  font-family: var(--t-font-display);
  font-size: clamp(2.5rem, 2rem + 3vw, 3.25rem);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 0.95;
  letter-spacing: -0.045em;
}

.tile__of {
  font-size: 0.45em;
  letter-spacing: -0.02em;
}

.tile__note {
  margin: 0;
  font-size: 13px;
}

.tile__progress {
  color: var(--bento-ink);

  :deep(.q-linear-progress__track) {
    background: rgb(28 27 31 / 0.14);
  }
}

.tile__link {
  padding: 4px 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

// Weekly bars
.bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: 108px;
  margin: 4px 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    grid-template-rows: 1fr auto;
    justify-items: center;
    gap: 6px;
  }
}

.bars__bar {
  align-self: end;
  width: 100%;
  max-width: 28px;
  height: var(--h);
  border-radius: 10px;
  background: rgb(28 27 31 / 0.22);
  transform-origin: bottom;
  animation: grow 600ms var(--t-ease) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.is-today .bars__bar {
  background: var(--bento-ink);
}

.bars__day {
  font-size: 12px;
  font-weight: 600;
}

@keyframes grow {
  from {
    transform: scaleY(0);
  }
}

// Check-ins
.checkins {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.checkin {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px 0 10px;
  border: 2px solid var(--bento-ink);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.55);
  color: var(--bento-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--t-duration) var(--t-ease);

  .q-icon {
    font-size: 20px;
  }

  &:active {
    transform: scale(0.94);
  }

  &.is-done {
    background: var(--bento-ink);
    color: #fff;

    .q-icon {
      animation: boing 420ms var(--t-ease);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &.is-done .q-icon {
      animation: none;
    }
  }
}

@keyframes boing {
  0% {
    transform: scale(0.4);
  }
  60% {
    transform: scale(1.25);
  }
}

// Latest
.latest {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.latest__note {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.latest__amt,
.entry__amt {
  font-family: var(--t-font-display);
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cat-dot {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  color: var(--bento-ink);
  font-size: 20px;
}

// Spending list -------------------------------------------------------------------

.group + .group {
  margin-top: 20px;
}

.group__head {
  display: flex;
  justify-content: space-between;
  margin: 0 8px 8px;
  color: var(--t-muted);
  font-size: 13px;
  font-weight: 600;
}

.group__list {
  overflow: hidden;
  border-radius: 22px;
  background: var(--t-surface);
  box-shadow: var(--t-shadow);
}

.entry + .entry {
  border-top: 1px solid var(--t-border);
}

.entry__item {
  position: relative;
  min-height: 64px;
  background: var(--t-surface);
}

.entry__note {
  font-weight: 600;
}

.entry__swipe {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-weight: 700;
}

// Keyboard/mouse alternative to swiping: shown on hover or focus.
.entry__delete {
  position: absolute;
  top: 50%;
  right: 8px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  translate: 0 -50%;
  border: 0;
  border-radius: 50%;
  background: var(--t-text);
  color: var(--t-bg);
  cursor: pointer;
  opacity: 0;

  &:focus-visible {
    opacity: 1;
  }
}

@media (hover: hover) {
  .entry__item:hover .entry__delete {
    opacity: 1;
  }
}

// Habits ---------------------------------------------------------------------------

.habits {
  display: grid;
  gap: 12px;
}

.habit-slide {
  overflow: hidden;
  border-radius: var(--t-radius);
  background: transparent;
}

.habit {
  display: grid;
  gap: 14px;
  padding: 18px;
  color: var(--bento-ink);
}

.habit__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.habit__name {
  margin: 0;
  font-family: var(--t-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.habit__streak {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.6);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.week__day {
  aspect-ratio: 1;
  min-height: 36px;
  border: 2px solid rgb(28 27 31 / 0.25);
  border-radius: 50%;
  background: rgb(255 255 255 / 0.5);
  color: var(--bento-ink);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform var(--t-duration) var(--t-ease);

  &:active:not(:disabled) {
    transform: scale(0.88);
  }

  &.is-today {
    border-color: var(--bento-ink);
  }

  &.is-done {
    border-color: var(--bento-ink);
    background: var(--bento-ink);
    color: #fff;
  }

  &:disabled {
    cursor: default;
    opacity: 0.45;
  }
}

// FAB + tabs -------------------------------------------------------------------------

.fab {
  width: 64px;
  height: 64px;
  background: var(--bento-ink);
  color: #fff;
  font-size: 18px;
  box-shadow: 0 14px 30px -10px rgb(28 27 31 / 0.6);
  transition: transform var(--t-duration) var(--t-ease);

  &:active {
    transform: scale(0.9) rotate(90deg);
  }
}

// q-page-sticky spans the full width; keep the FAB inside the phone column.
@media (min-width: 560px) {
  .pocket__page :deep(.q-page-sticky) {
    right: calc((100vw - 520px) / 2);
  }
}

.pocket__footer {
  border-top: 1px solid var(--t-border);
  background: var(--t-header-bg);
  backdrop-filter: blur(12px);
}

.pocket__tabs {
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));

  :deep(.q-tab) {
    min-height: 56px;
    border-radius: 18px;
    color: var(--t-muted);
    transition:
      background-color var(--t-duration) var(--t-ease),
      color var(--t-duration) var(--t-ease);
  }

  :deep(.q-tab--active) {
    background: var(--bento-ink);
    color: #fff;
  }

  :deep(.q-tab__label) {
    font-size: 12px;
    font-weight: 600;
  }
}

// Sheet -------------------------------------------------------------------------------

.sheet {
  width: 100%;
  max-width: 520px;
  padding: 10px 18px calc(20px + env(safe-area-inset-bottom));
}

.sheet__grip {
  width: 40px;
  height: 5px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--t-border);
}

// `.sheet` prefix outranks Quasar's `.q-card > div:not(:first-child)` radius reset.
.sheet .sheet__mode {
  margin-bottom: 16px;
  padding: 4px;
  border-radius: 999px;
  background: var(--t-surface-2);

  :deep(.q-btn) {
    min-height: 40px;
    border-radius: 999px;
    color: var(--t-muted);
  }

  :deep(.q-btn.q-btn--active),
  :deep(.q-btn[aria-pressed='true']) {
    background: var(--bento-ink);
    color: #fff;
  }
}

.sheet__form {
  display: grid;
  gap: 12px;
}

.sheet__amount :deep(.q-field__native),
.sheet__amount :deep(.q-field__prefix) {
  font-family: var(--t-font-display);
  font-size: 1.75rem;
  font-weight: 800;
}

.sheet__cats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}

.sheet__legend {
  margin-bottom: 8px;
  padding: 0;
  color: var(--t-muted);
  font-size: 13px;
  font-weight: 600;
}

.cat-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px 0 10px;
  border: 2px solid transparent;
  border-radius: 16px;
  color: var(--bento-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform var(--t-duration) var(--t-ease);

  &:active {
    transform: scale(0.94);
  }

  &.is-on {
    border-color: var(--bento-ink);
    transform: scale(1.04);
  }
}

.swatch {
  width: 44px;
  height: 44px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: transform var(--t-duration) var(--t-ease);

  &.is-on {
    border-color: var(--bento-ink);
    box-shadow: inset 0 0 0 3px #fff;
    transform: scale(1.1);
  }
}

.sheet__submit {
  min-height: 52px;
  margin-top: 4px;
  border-radius: 18px;
  background: var(--bento-ink);
  color: #fff;
  font-size: 16px;
}
</style>
