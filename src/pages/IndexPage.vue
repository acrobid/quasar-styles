<template>
  <q-page class="dashboard">
    <!-- Header -->
    <q-card class="panel hero">
      <p class="eyebrow">Workspace · November 2026</p>
      <h1 class="hero__title">
        <span v-for="(word, i) in heroWords" :key="word" class="hero__word" :style="{ '--i': i }">
          {{ word }}
        </span>
      </h1>
      <p class="hero__lede">Welcome back. Here's how the team is tracking this month.</p>
    </q-card>

    <!-- Stats -->
    <section class="stats" aria-label="Key metrics">
      <q-card v-for="(stat, i) in stats" :key="stat.label" class="panel stat" :style="{ '--i': i }">
        <div class="stat__head">
          <span class="stat__label">{{ stat.label }}</span>
          <span class="delta" :class="`tone--${stat.delta.tone}`">
            <q-icon :name="stat.delta.icon" aria-hidden="true" />
            {{ stat.delta.text }}
          </span>
        </div>
        <div class="stat__value">{{ stat.value }}</div>
        <q-linear-progress
          :value="stat.progress"
          :color="stat.color"
          class="stat__progress"
          :aria-label="`${stat.label}: ${stat.caption}`"
        />
        <div class="stat__foot">{{ stat.caption }}</div>
      </q-card>
    </section>

    <div class="dashboard__grid">
      <!-- Chart -->
      <q-card class="panel chart-panel span-8">
        <div class="panel__head">
          <div>
            <h2 class="panel__title">Monthly revenue</h2>
            <p class="panel__sub">Jun – Nov 2026 · thousands of USD</p>
          </div>
          <q-btn flat no-caps :ripple="false" class="btn-ghost" icon="download" label="Export" />
        </div>
        <figure class="chart">
          <figcaption class="visually-hidden">Monthly revenue, June to November 2026</figcaption>
          <ol class="chart__cols">
            <li
              v-for="(bar, i) in chart"
              :key="bar.month"
              class="chart__col"
              :class="{ 'is-current': i === chart.length - 1 }"
              :style="{ '--h': `${(bar.value / CHART_MAX) * 100}%`, '--i': i }"
            >
              <span class="chart__plot">
                <span class="chart__bar"></span>
                <span class="chart__value">${{ bar.value.toFixed(1) }}k</span>
              </span>
              <span class="chart__label">{{ bar.month }}</span>
            </li>
          </ol>
        </figure>
      </q-card>

      <!-- Activity -->
      <q-card class="panel span-4">
        <div class="panel__head">
          <div>
            <h2 class="panel__title">Recent activity</h2>
            <p class="panel__sub">Across all projects</p>
          </div>
          <q-btn flat no-caps :ripple="false" class="btn-ghost" label="View all" />
        </div>
        <q-list class="activity">
          <q-item v-for="item in activity" :key="item.id" class="activity__item">
            <q-item-section avatar>
              <q-avatar size="36px" class="avatar" :class="`tone--${item.tone}`">
                {{ initials(item.who) }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="activity__text">
                <strong>{{ item.who }}</strong> {{ item.what }}
              </q-item-label>
              <q-item-label class="activity__time">{{ item.when }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="item.fresh" side>
              <q-badge class="badge-new">New</q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Table -->
      <q-card class="panel span-8">
        <div class="panel__head">
          <div>
            <h2 class="panel__title">Project status</h2>
            <p class="panel__sub">{{ projects.length }} active projects</p>
          </div>
        </div>
        <q-table
          :rows="projects"
          :columns="columns"
          row-key="name"
          :pagination="{ rowsPerPage: 0 }"
          hide-pagination
          flat
          class="projects"
        >
          <template #body-cell-progress="props">
            <q-td :props="props">
              <div class="cell-progress">
                <q-linear-progress
                  :value="props.value / 100"
                  :color="props.value === 100 ? 'positive' : 'primary'"
                  :aria-label="`${props.row.name} progress`"
                />
                <span class="cell-progress__pct">{{ props.value }}%</span>
              </div>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                :ripple="false"
                class="status"
                :class="`tone--${statusTone(props.value)}`"
              >
                {{ props.value }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <!-- Form -->
      <q-card class="panel span-4">
        <div class="panel__head">
          <div>
            <h2 class="panel__title">Quick action</h2>
            <p class="panel__sub">Create a task for your team</p>
          </div>
        </div>
        <q-form class="quick-form" @submit="onSubmit">
          <div class="field">
            <label class="field__label" for="qa-name">Name</label>
            <q-input v-model="formData.name" for="qa-name" outlined dense hide-bottom-space />
          </div>
          <div class="field">
            <label class="field__label" for="qa-email">Email</label>
            <q-input
              v-model="formData.email"
              for="qa-email"
              type="email"
              outlined
              dense
              hide-bottom-space
            />
          </div>
          <div class="field">
            <label class="field__label" for="qa-category">Category</label>
            <q-select
              v-model="formData.category"
              for="qa-category"
              :options="categories"
              outlined
              dense
              hide-bottom-space
            />
          </div>
          <div class="field">
            <label class="field__label" for="qa-description">Description</label>
            <q-input
              v-model="formData.description"
              for="qa-description"
              type="textarea"
              rows="3"
              outlined
              dense
              hide-bottom-space
            />
          </div>
          <q-btn
            type="submit"
            unelevated
            no-caps
            :ripple="false"
            class="btn-primary full-width"
            label="Create task"
          />
          <p class="quick-form__status" aria-live="polite">{{ status }}</p>
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { QTableColumn } from 'quasar';

type Tone = 'primary' | 'positive' | 'warning' | 'negative' | 'info' | 'neutral';

const heroWords = ['Dashboard', 'Overview'];

const stats = [
  {
    label: 'Total users',
    value: '1,254',
    delta: { text: '+12.4%', tone: 'positive', icon: 'north_east' },
    progress: 0.7,
    color: 'primary',
    caption: '70% of Q4 goal',
  },
  {
    label: 'Revenue',
    value: '$24,580',
    delta: { text: '+8.9%', tone: 'positive', icon: 'north_east' },
    progress: 0.6,
    color: 'positive',
    caption: '60% of Q4 target',
  },
  {
    label: 'Tasks',
    value: '42/65',
    delta: { text: '−3', tone: 'warning', icon: 'south_east' },
    progress: 42 / 65,
    color: 'warning',
    caption: '23 open this sprint',
  },
  {
    label: 'Alerts',
    value: '5',
    delta: { text: '+2', tone: 'negative', icon: 'north_east' },
    progress: 0.2,
    color: 'negative',
    caption: '2 need attention',
  },
] as const;

// Stable demo data, in thousands of USD. The last month is the current one.
const chart = [
  { month: 'Jun', value: 18.2 },
  { month: 'Jul', value: 21.4 },
  { month: 'Aug', value: 19.8 },
  { month: 'Sep', value: 23.1 },
  { month: 'Oct', value: 22.6 },
  { month: 'Nov', value: 24.6 },
];
const CHART_MAX = 30; // top gridline

const activity: {
  id: number;
  who: string;
  what: string;
  when: string;
  tone: Tone;
  fresh: boolean;
}[] = [
  {
    id: 1,
    who: 'Sarah Johnson',
    what: 'shipped mobile build 2.4',
    when: '12 min ago',
    tone: 'primary',
    fresh: true,
  },
  {
    id: 2,
    who: 'Michael Chen',
    what: 'completed Database Migration',
    when: '1 hr ago',
    tone: 'positive',
    fresh: true,
  },
  {
    id: 3,
    who: 'Emily Davis',
    what: 'commented on API Integration',
    when: '3 hr ago',
    tone: 'info',
    fresh: false,
  },
  {
    id: 4,
    who: 'Robert Wilson',
    what: 'opened Security Audit',
    when: 'Yesterday',
    tone: 'warning',
    fresh: false,
  },
  {
    id: 5,
    who: 'Amanda Lee',
    what: 'drafted the Q1 content calendar',
    when: 'Mon',
    tone: 'neutral',
    fresh: false,
  },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('');
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const columns: QTableColumn[] = [
  { name: 'name', align: 'left', label: 'Project', field: 'name' },
  { name: 'owner', align: 'left', label: 'Owner', field: 'owner' },
  { name: 'progress', align: 'left', label: 'Progress', field: 'progress' },
  { name: 'status', align: 'left', label: 'Status', field: 'status' },
  {
    name: 'deadline',
    align: 'right',
    label: 'Deadline',
    field: 'deadline',
    format: (value: string) => dateFormat.format(new Date(`${value}T00:00:00Z`)),
  },
];

const projects = [
  {
    name: 'Website Redesign',
    owner: 'John Smith',
    progress: 75,
    status: 'In Progress',
    deadline: '2026-12-04',
  },
  {
    name: 'Mobile App Development',
    owner: 'Sarah Johnson',
    progress: 30,
    status: 'In Progress',
    deadline: '2027-01-29',
  },
  {
    name: 'Database Migration',
    owner: 'Michael Chen',
    progress: 100,
    status: 'Completed',
    deadline: '2026-10-30',
  },
  {
    name: 'API Integration',
    owner: 'Emily Davis',
    progress: 60,
    status: 'In Progress',
    deadline: '2026-12-11',
  },
  {
    name: 'Security Audit',
    owner: 'Robert Wilson',
    progress: 10,
    status: 'Pending',
    deadline: '2027-01-15',
  },
  {
    name: 'Content Strategy',
    owner: 'Amanda Lee',
    progress: 0,
    status: 'Not Started',
    deadline: '2027-02-05',
  },
];

const statusTones: Record<string, Tone> = {
  Completed: 'positive',
  'In Progress': 'info',
  Pending: 'warning',
  'Not Started': 'neutral',
};

function statusTone(status: string): Tone {
  return statusTones[status] ?? 'neutral';
}

const categories = ['Task', 'Meeting', 'Reminder'];

const emptyForm = () => ({ name: '', email: '', category: 'Task', description: '' });
const formData = ref(emptyForm());
const status = ref('');

function onSubmit() {
  status.value = `Created ${formData.value.category.toLowerCase()}${
    formData.value.name ? ` for ${formData.value.name}` : ''
  }.`;
  formData.value = emptyForm();
}
</script>
