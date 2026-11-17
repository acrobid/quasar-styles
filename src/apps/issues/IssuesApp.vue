<template>
  <q-layout view="hHh LpR fFf" class="iss">
    <q-header class="iss__header">
      <div class="iss__bar">
        <AppBackLink />
        <span class="iss__crumb">
          <span class="iss__workspace">Northwind</span>
          <span aria-hidden="true">/</span>
          <h1>Issues</h1>
        </span>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          class="iss__ghost"
          aria-label="Keyboard shortcuts"
          @click="helpOpen = true"
        >
          <kbd>?</kbd>
        </q-btn>
        <q-btn unelevated no-caps color="primary" class="iss__new" @click="openCreate">
          <q-icon name="add" size="18px" aria-hidden="true" />
          <span class="iss__new-label">New issue</span>
          <kbd class="iss__kbd-on-primary" aria-hidden="true">C</kbd>
        </q-btn>
      </div>

      <div class="iss__filters" role="search">
        <q-input
          ref="searchInput"
          v-model="query"
          dense
          outlined
          placeholder="Search issues"
          class="iss__search"
          aria-label="Search issues"
          @keydown.esc="($event.target as HTMLInputElement).blur()"
        >
          <template #prepend><q-icon name="search" size="16px" /></template>
          <template #append><kbd v-if="!query">/</kbd></template>
        </q-input>
        <q-select
          v-model="statusFilter"
          :options="statuses"
          multiple
          emit-value
          map-options
          dense
          outlined
          options-dense
          :display-value="filterLabel('Status', statusFilter.length)"
          aria-label="Filter by status"
          class="iss__filter"
        />
        <q-select
          v-model="priorityFilter"
          :options="priorities"
          multiple
          emit-value
          map-options
          dense
          outlined
          options-dense
          :display-value="filterLabel('Priority', priorityFilter.length)"
          aria-label="Filter by priority"
          class="iss__filter"
        />
        <q-select
          v-model="sortBy"
          :options="sorts"
          emit-value
          map-options
          dense
          outlined
          options-dense
          aria-label="Sort by"
          class="iss__filter"
        >
          <template #prepend><q-icon name="sort" size="16px" /></template>
        </q-select>
        <q-btn
          flat
          dense
          class="iss__ghost iss__dir"
          :icon="sortDesc ? 'south' : 'north'"
          :aria-label="
            sortDesc
              ? 'Sorted descending, switch to ascending'
              : 'Sorted ascending, switch to descending'
          "
          @click="sortDesc = !sortDesc"
        />
        <q-btn
          v-if="filtersActive"
          flat
          dense
          no-caps
          label="Clear"
          class="iss__ghost"
          @click="clearFilters"
        />
      </div>
    </q-header>

    <q-drawer
      v-model="detailOpen"
      side="right"
      bordered
      :width="drawerWidth"
      :breakpoint="1100"
      class="iss__drawer"
    >
      <section v-if="selected" class="detail" :aria-label="`Issue ${key(selected)}`">
        <div class="detail__top">
          <span class="detail__key">{{ key(selected) }}</span>
          <q-space />
          <q-btn
            flat
            dense
            round
            icon="delete_outline"
            aria-label="Delete issue"
            class="iss__ghost"
            @click="removeIssue(selected)"
          />
          <q-btn
            flat
            dense
            no-caps
            class="iss__ghost"
            aria-label="Close panel"
            @click="closeDetail"
          >
            <q-icon name="close" size="18px" /><kbd class="detail__esc">Esc</kbd>
          </q-btn>
        </div>

        <q-input
          v-model="titleDraft"
          borderless
          autogrow
          type="textarea"
          aria-label="Title"
          class="detail__title"
          @keydown.enter.prevent="($event.target as HTMLElement).blur()"
          @blur="commitText"
        />

        <dl class="detail__props">
          <dt id="prop-status">Status</dt>
          <dd>
            <q-select
              :model-value="selected.status"
              :options="statuses"
              emit-value
              map-options
              dense
              borderless
              options-dense
              aria-labelledby="prop-status"
              @update:model-value="(v: Status) => update(selected!, { status: v })"
            >
              <template #prepend><IssueGlyph :status="selected.status" /></template>
            </q-select>
          </dd>
          <dt id="prop-priority">Priority</dt>
          <dd>
            <q-select
              :model-value="selected.priority"
              :options="priorities"
              emit-value
              map-options
              dense
              borderless
              options-dense
              aria-labelledby="prop-priority"
              @update:model-value="(v: Priority) => update(selected!, { priority: v })"
            >
              <template #prepend><IssueGlyph :priority="selected.priority" /></template>
            </q-select>
          </dd>
          <dt id="prop-assignee">Assignee</dt>
          <dd>
            <q-select
              :model-value="selected.assignee"
              :options="assigneeOptions"
              emit-value
              map-options
              dense
              borderless
              options-dense
              aria-labelledby="prop-assignee"
              @update:model-value="(v: string | null) => update(selected!, { assignee: v })"
            >
              <template #prepend>
                <span class="avatar" :class="{ 'avatar--none': !selected.assignee }">{{
                  selected.assignee ? initials(selected.assignee) : '–'
                }}</span>
              </template>
            </q-select>
          </dd>
          <dt>Labels</dt>
          <dd class="detail__labels">
            <span v-for="label in selected.labels" :key="label" class="label">{{ label }}</span>
            <span v-if="!selected.labels.length" class="detail__muted">None</span>
          </dd>
          <dt>Created</dt>
          <dd class="detail__muted">{{ fullDate(selected.createdAt) }}</dd>
        </dl>

        <q-input
          v-model="descDraft"
          outlined
          autogrow
          type="textarea"
          label="Description"
          class="detail__desc"
          @blur="commitText"
        />

        <h2 class="detail__heading">Activity</h2>
        <ol class="detail__activity">
          <li v-for="(a, i) in [...selected.activity].reverse()" :key="i">
            <span>{{ a.text }}</span>
            <time :datetime="new Date(a.at).toISOString()">{{ shortDate(a.at) }}</time>
          </li>
        </ol>
      </section>
    </q-drawer>

    <q-page-container>
      <q-page class="iss__page">
        <div class="iss__columns" aria-hidden="true">
          <span>Pri</span><span>ID</span><span /><span>Title</span
          ><span class="iss__col-labels">Labels</span><span /><span>Updated</span>
        </div>
        <ul v-if="visible.length" class="iss__list" aria-label="Issues">
          <li v-for="(issue, i) in visible" :key="issue.id">
            <button
              :ref="(el) => (rowEls[i] = el as HTMLButtonElement | null)"
              type="button"
              class="issue-row"
              :class="{
                'is-cursor': i === cursor,
                'is-open': detailOpen && selected?.id === issue.id,
              }"
              :aria-current="detailOpen && selected?.id === issue.id"
              @click="openIssue(issue, i)"
              @focus="cursor = i"
            >
              <IssueGlyph :priority="issue.priority" />
              <span class="issue-row__key">{{ key(issue) }}</span>
              <IssueGlyph :status="issue.status" />
              <span class="issue-row__title">{{ issue.title }}</span>
              <span class="issue-row__labels">
                <span v-for="label in issue.labels" :key="label" class="label">{{ label }}</span>
              </span>
              <span
                class="avatar"
                :class="{ 'avatar--none': !issue.assignee }"
                :title="issue.assignee ?? 'Unassigned'"
              >
                {{ issue.assignee ? initials(issue.assignee) : '–' }}
                <span class="visually-hidden">{{ issue.assignee ?? 'Unassigned' }}</span>
              </span>
              <span class="issue-row__date">{{ shortDate(issue.updatedAt) }}</span>
            </button>
          </li>
        </ul>
        <div v-else class="iss__empty">
          <p>No issues match these filters.</p>
          <q-btn outline no-caps label="Clear filters" @click="clearFilters" />
        </div>
      </q-page>
    </q-page-container>

    <q-footer class="iss__footer">
      <span class="iss__count">
        {{ visible.length }} of {{ issues.length }} issues · {{ openCount }} open
      </span>
      <span class="iss__hints" aria-hidden="true">
        <span><kbd>j</kbd><kbd>k</kbd> move</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>c</kbd> new</span>
        <span><kbd>/</kbd> search</span>
        <span><kbd>esc</kbd> close</span>
      </span>
      <q-btn
        flat
        dense
        no-caps
        label="Reset demo data"
        class="iss__ghost iss__reset"
        @click="resetData"
      />
    </q-footer>

    <!-- Create issue -->
    <q-dialog v-model="createOpen" @hide="resetDraft">
      <q-card class="dialog">
        <q-form
          ref="createForm"
          class="dialog__form"
          @submit="createIssue"
          @keydown.enter="onFormEnter"
        >
          <h2 class="dialog__title">New issue</h2>
          <q-input
            v-model="draft.title"
            outlined
            dense
            autofocus
            label="Title"
            :rules="[
              (v: string) => !!v.trim() || 'A title is required',
              (v: string) => v.trim().length >= 3 || 'Use at least 3 characters',
              (v: string) => v.length <= 120 || 'Keep it under 120 characters',
            ]"
          />
          <q-input
            v-model="draft.description"
            outlined
            dense
            autogrow
            type="textarea"
            label="Description (optional)"
          />
          <div class="dialog__row">
            <q-select
              v-model="draft.status"
              :options="statuses"
              emit-value
              map-options
              outlined
              dense
              options-dense
              label="Status"
            />
            <q-select
              v-model="draft.priority"
              :options="priorities"
              emit-value
              map-options
              outlined
              dense
              options-dense
              label="Priority"
            />
            <q-select
              v-model="draft.assignee"
              :options="assigneeOptions"
              emit-value
              map-options
              outlined
              dense
              options-dense
              label="Assignee"
            />
          </div>
          <div class="dialog__actions">
            <span class="dialog__hint"><kbd>⌘</kbd><kbd>↵</kbd> to create</span>
            <q-btn v-close-popup flat no-caps label="Cancel" class="iss__ghost" />
            <q-btn unelevated no-caps type="submit" color="primary" label="Create issue" />
          </div>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- Shortcut help -->
    <q-dialog v-model="helpOpen">
      <q-card class="dialog dialog--help">
        <h2 class="dialog__title">Keyboard shortcuts</h2>
        <dl class="shortcuts">
          <template v-for="s in shortcutList" :key="s.keys">
            <dt>
              <kbd v-for="k in s.keys.split(' ')" :key="k">{{ k }}</kbd>
            </dt>
            <dd>{{ s.does }}</dd>
          </template>
        </dl>
        <p class="dialog__hint">Shortcuts pause while you're typing in a field.</p>
        <div class="dialog__actions">
          <q-btn v-close-popup unelevated no-caps color="primary" label="Got it" />
        </div>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar, type QForm, type QInput } from 'quasar';
import AppBackLink from '@/components/AppBackLink.vue';
import { useStoredRef } from '@/composables/useStoredRef';
import IssueGlyph from './IssueGlyph.vue';
import {
  compare,
  initials,
  key,
  people,
  priorities,
  priorityLabel,
  seedIssues,
  shortDate,
  sorts,
  statusLabel,
  statuses,
  type Issue,
  type Priority,
  type SortKey,
  type Status,
} from './data';

const $q = useQuasar();
const issues = useStoredRef('issues', seedIssues);

// --- Filtering + sorting ------------------------------------------------------

const query = ref('');
const statusFilter = ref<Status[]>([]);
const priorityFilter = ref<Priority[]>([]);
const sortBy = ref<SortKey>('updated');
const sortDesc = ref(true);

const filtersActive = computed(
  () => !!query.value || statusFilter.value.length > 0 || priorityFilter.value.length > 0,
);

const filterLabel = (name: string, n: number) => (n ? `${name} · ${n}` : `${name}: any`);

function clearFilters() {
  query.value = '';
  statusFilter.value = [];
  priorityFilter.value = [];
}

const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  const list = issues.value.filter(
    (i) =>
      (!statusFilter.value.length || statusFilter.value.includes(i.status)) &&
      (!priorityFilter.value.length || priorityFilter.value.includes(i.priority)) &&
      (!q ||
        i.title.toLowerCase().includes(q) ||
        key(i).toLowerCase().includes(q) ||
        i.labels.some((l) => l.includes(q))),
  );
  const dir = sortDesc.value ? -1 : 1;
  return list.sort((a, b) => dir * compare(a, b, sortBy.value));
});

const openCount = computed(() => issues.value.filter((i) => i.status !== 'done').length);

const assigneeOptions = [
  { value: null, label: 'Unassigned' },
  ...people.map((p) => ({ value: p, label: p })),
];

// --- Selection + detail panel ---------------------------------------------------

const cursor = ref(0);
const rowEls: (HTMLButtonElement | null)[] = [];
const selectedId = ref<number | null>(null);
const detailOpen = ref(false);
const selected = computed(() => issues.value.find((i) => i.id === selectedId.value) ?? null);
const drawerWidth = computed(() => Math.min(420, $q.screen.width));

watch(visible, (list) => {
  cursor.value = Math.min(cursor.value, Math.max(list.length - 1, 0));
});

function openIssue(issue: Issue, index: number) {
  cursor.value = index;
  selectedId.value = issue.id;
  detailOpen.value = true;
}

function closeDetail() {
  detailOpen.value = false;
  void nextTick(() => rowEls[cursor.value]?.focus());
}

function moveCursor(step: number) {
  if (!visible.value.length) return;
  cursor.value = Math.min(Math.max(cursor.value + step, 0), visible.value.length - 1);
  const el = rowEls[cursor.value];
  el?.focus();
  el?.scrollIntoView({ block: 'nearest' });
  // With the panel open, j/k pages through issues like a reader.
  if (detailOpen.value) selectedId.value = visible.value[cursor.value]!.id;
}

const fullDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

function update(issue: Issue, patch: Partial<Omit<Issue, 'id'>>, log = true) {
  const notes: string[] = [];
  if (patch.status !== undefined && patch.status !== issue.status) {
    notes.push(`Status → ${statusLabel(patch.status)}`);
  }
  if (patch.priority !== undefined && patch.priority !== issue.priority) {
    notes.push(`Priority → ${priorityLabel(patch.priority)}`);
  }
  if ('assignee' in patch && patch.assignee !== issue.assignee) {
    notes.push(patch.assignee ? `Assigned to ${patch.assignee}` : 'Unassigned');
  }
  Object.assign(issue, patch, { updatedAt: Date.now() });
  if (log) notes.forEach((text) => issue.activity.push({ at: Date.now(), text }));
}

// Title/description are edited as drafts and saved on blur (or Enter in the title).
const titleDraft = ref('');
const descDraft = ref('');
watch(
  selected,
  (issue) => {
    titleDraft.value = issue?.title ?? '';
    descDraft.value = issue?.description ?? '';
  },
  { immediate: true },
);

function commitText() {
  const issue = selected.value;
  if (!issue) return;
  const title = titleDraft.value.trim();
  if (title.length >= 3 && title !== issue.title) {
    update(issue, { title }, false);
    issue.activity.push({ at: Date.now(), text: 'Renamed the issue' });
  } else {
    titleDraft.value = issue.title; // too short: put the old title back
  }
  if (descDraft.value.trim() !== issue.description) {
    update(issue, { description: descDraft.value.trim() }, false);
  }
}

function removeIssue(issue: Issue) {
  const index = issues.value.findIndex((i) => i.id === issue.id);
  if (index < 0) return;
  const [removed] = issues.value.splice(index, 1);
  closeDetail();
  $q.notify({
    message: `Deleted ${key(issue)}`,
    actions: [
      {
        label: 'Undo',
        color: 'toast',
        handler: () => {
          if (removed) issues.value.splice(index, 0, removed);
        },
      },
    ],
  });
}

function resetData() {
  issues.value = seedIssues();
  detailOpen.value = false;
  clearFilters();
  $q.notify('Demo data restored');
}

// --- Create dialog ----------------------------------------------------------------

const createOpen = ref(false);
const createForm = ref<QForm | null>(null);
const blankDraft = () => ({
  title: '',
  description: '',
  status: 'todo' as Status,
  priority: 0 as Priority,
  assignee: null as string | null,
});
const draft = reactive(blankDraft());

function openCreate() {
  createOpen.value = true;
}

function resetDraft() {
  Object.assign(draft, blankDraft());
}

// ⌘/Ctrl+Enter submits from any field, including the description textarea.
function onFormEnter(e: KeyboardEvent) {
  if (!e.metaKey && !e.ctrlKey) return;
  e.preventDefault();
  void createForm.value?.submit();
}

function createIssue() {
  const now = Date.now();
  const id = Math.max(100, ...issues.value.map((i) => i.id)) + 1;
  issues.value.push({
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    assignee: draft.assignee,
    labels: [],
    createdAt: now,
    updatedAt: now,
    activity: [{ at: now, text: 'Created the issue' }],
  });
  createOpen.value = false;
  clearFilters();
  sortBy.value = 'updated';
  sortDesc.value = true;
  selectedId.value = id;
  detailOpen.value = true;
  cursor.value = 0;
  $q.notify(`Created ${key({ id })}`);
}

// --- Keyboard shortcuts ---------------------------------------------------------------

const helpOpen = ref(false);
const searchInput = ref<QInput | null>(null);
const shortcutList = [
  { keys: 'c', does: 'Create an issue' },
  { keys: '/', does: 'Search' },
  { keys: 'j k', does: 'Move down / up the list' },
  { keys: '↵', does: 'Open the focused issue' },
  { keys: 'Esc', does: 'Close the panel or dialog' },
  { keys: '?', does: 'Show this list' },
  { keys: '⌘ ↵', does: 'Create (in the new-issue dialog)' },
];

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    !!target.closest('input, textarea, select, [contenteditable="true"], .q-field')
  );
}

function onKeydown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
  if (createOpen.value || helpOpen.value || isTyping(e.target)) return;

  switch (e.key) {
    case 'c':
      e.preventDefault();
      openCreate();
      break;
    case '/':
      e.preventDefault();
      searchInput.value?.focus();
      break;
    case 'j':
    case 'ArrowDown':
      e.preventDefault();
      moveCursor(1);
      break;
    case 'k':
    case 'ArrowUp':
      e.preventDefault();
      moveCursor(-1);
      break;
    case 'Enter': {
      // Focused rows are buttons and open themselves; this covers focus elsewhere.
      if (e.target instanceof HTMLButtonElement) return;
      const issue = visible.value[cursor.value];
      if (issue) openIssue(issue, cursor.value);
      break;
    }
    case 'Escape':
      if (detailOpen.value) closeDetail();
      break;
    case '?':
      helpOpen.value = true;
      break;
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped lang="scss">
kbd {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border: 1px solid var(--t-border-strong);
  border-radius: 4px;
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

// Header ----------------------------------------------------------------------

.iss__header {
  border-bottom: 1px solid var(--t-border);
}

.iss__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 12px;
}

.iss__crumb {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  color: var(--t-muted);

  h1 {
    margin: 0;
    color: var(--t-text);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
  }
}

.iss__ghost {
  min-height: 32px;
  color: var(--t-muted);
  font-weight: 500;

  &:hover {
    color: var(--t-text);
  }
}

.iss__new {
  min-height: 32px;
  padding: 0 10px;
  font-weight: 600;

  :deep(.q-btn__content) {
    gap: 6px;
    flex-wrap: nowrap;
  }
}

.iss__kbd-on-primary {
  border-color: color-mix(in srgb, var(--t-on-primary) 35%, transparent);
  color: var(--t-on-primary);
}

.iss__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--t-border);
}

.iss__search {
  flex: 1 1 220px;
  max-width: 360px;
}

.iss__filter {
  flex: 0 1 150px;
  min-width: 120px;
}

.iss__dir {
  width: 34px;
}

// List ------------------------------------------------------------------------

$row: 20px 64px 14px minmax(0, 1fr) auto 24px 40px;

.iss__columns,
.issue-row {
  display: grid;
  grid-template-columns: $row;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.iss__columns {
  height: 32px;
  border-bottom: 1px solid var(--t-border);
  color: var(--t-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;

  span:last-child {
    text-align: right;
  }
}

.iss__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.issue-row {
  width: 100%;
  height: 40px;
  border: 0;
  border-bottom: 1px solid var(--t-border);
  background: transparent;
  color: var(--t-text);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--t-surface);
  }

  &.is-cursor {
    background: var(--t-surface-2);
  }

  &.is-open {
    box-shadow: inset 2px 0 0 var(--t-primary);
  }

  &:focus-visible {
    outline-offset: -2px;
  }
}

.issue-row__key {
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 12px;
}

.issue-row__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.issue-row__labels {
  display: flex;
  gap: 4px;
}

.label {
  padding: 1px 6px;
  border: 1px solid var(--t-border);
  border-radius: 999px;
  color: var(--t-muted);
  font-size: 11px;
  white-space: nowrap;
}

.avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--t-surface-2);
  box-shadow: inset 0 0 0 1px var(--t-border-strong);
  color: var(--t-text);
  font-size: 10px;
  font-weight: 600;
}

.avatar--none {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--t-border);
  color: var(--t-muted);
}

.issue-row__date {
  color: var(--t-muted);
  font-size: 12px;
  text-align: right;
}

.iss__empty {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 64px 16px;
  color: var(--t-muted);

  p {
    margin: 0;
  }
}

@media (max-width: 899px) {
  .iss__col-labels,
  .issue-row__labels {
    display: none;
  }

  .iss__columns,
  .issue-row {
    grid-template-columns: 20px 58px 14px minmax(0, 1fr) 24px 32px;
  }
}

@media (max-width: 599px) {
  .iss__workspace,
  .iss__crumb > span[aria-hidden],
  .iss__new-label,
  .iss__new kbd {
    display: none;
  }

  .iss__columns {
    display: none;
  }

  .iss__search {
    flex-basis: 100%;
    max-width: none;
  }

  .iss__filter {
    flex: 1 1 0;
    min-width: 0;
  }

  .issue-row {
    grid-template-columns: 16px 52px 14px minmax(0, 1fr) 22px;
    gap: 8px;
    height: 48px;
    padding: 0 12px;
  }

  .issue-row__date {
    display: none;
  }
}

// Detail drawer -----------------------------------------------------------------

.detail {
  display: grid;
  gap: 12px;
  padding: 12px 16px 24px;
}

.detail__top {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail__key {
  color: var(--t-muted);
  font-family: var(--t-font-mono);
  font-size: 12px;
}

.detail__esc {
  margin-left: 6px;
}

.detail__title :deep(textarea) {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: -0.01em;
}

.detail__props {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 2px 8px;
  margin: 0;
  padding: 8px 0;
  border-block: 1px solid var(--t-border);

  dt {
    color: var(--t-muted);
    font-size: 12px;
  }

  dd {
    min-width: 0;
    margin: 0;
  }

  :deep(.q-field__prepend) {
    padding-right: 8px;
  }
}

.detail__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 34px;
  align-items: center;
}

.detail__muted {
  color: var(--t-muted);
}

.detail__heading {
  margin: 8px 0 0;
  color: var(--t-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.detail__activity {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 12px;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  time {
    color: var(--t-muted);
  }
}

// Footer ----------------------------------------------------------------------

.iss__footer {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 36px;
  padding: 0 12px 0 16px;
  border-top: 1px solid var(--t-border);
  color: var(--t-muted);
  font-size: 12px;
}

.iss__count {
  white-space: nowrap;
}

.iss__hints {
  display: flex;
  gap: 14px;
  margin-left: auto;
  white-space: nowrap;

  kbd {
    margin-right: 3px;
  }
}

.iss__reset {
  font-size: 12px;
}

@media (max-width: 899px) {
  .iss__hints {
    display: none;
  }

  .iss__reset {
    margin-left: auto;
  }
}

// Dialogs ---------------------------------------------------------------------

.dialog {
  width: min(560px, calc(100vw - 32px));
}

.dialog--help {
  width: min(400px, calc(100vw - 32px));
  padding: 20px;
}

.dialog__form {
  display: grid;
  gap: 12px;
  padding: 20px;
}

.dialog__title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.dialog__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 8px;
}

.dialog__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.dialog__hint {
  margin: 0 auto 0 0;
  color: var(--t-muted);
  font-size: 12px;

  kbd {
    margin-right: 2px;
  }
}

.shortcuts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 16px;
  margin: 12px 0 16px;

  dt {
    display: flex;
    gap: 4px;
  }

  dd {
    margin: 0;
  }
}
</style>
