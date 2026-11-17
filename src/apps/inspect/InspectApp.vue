<template>
  <q-layout view="hHh lpr fFf" class="ins">
    <q-header class="ins__header">
      <div class="ins__bar">
        <AppBackLink />
        <span class="ins__brand">Field Inspect</span>
        <span class="ins__net" :class="online ? 'is-online' : 'is-offline'" role="status">
          <i aria-hidden="true" />{{ online ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </div>
      <q-tabs
        v-model="view"
        no-caps
        align="left"
        class="ins__tabs"
        indicator-color="primary"
        aria-label="Views"
      >
        <q-tab name="new" label="New inspection" />
        <q-tab name="outbox">
          <span class="ins__tab-label">
            Outbox<span v-if="pendingCount" class="ins__count">{{ pendingCount }}</span>
          </span>
        </q-tab>
      </q-tabs>
    </q-header>

    <q-page-container>
      <q-page class="ins__page">
        <!-- Wizard -->
        <q-stepper
          v-if="view === 'new'"
          ref="stepper"
          v-model="step"
          flat
          :contracted="$q.screen.lt.sm"
          alternative-labels
          class="wizard"
        >
          <!-- 1. Site -->
          <q-step :name="1" title="Site" icon="place" :done="step > 1">
            <h2 class="ins__h">Site details</h2>
            <q-form ref="siteForm" class="ins__grid" greedy @submit.prevent>
              <q-input
                v-model="site.name"
                outlined
                label="SITE NAME"
                :rules="[(v: string) => !!v.trim() || 'Required']"
              />
              <q-input
                v-model="site.asset"
                outlined
                label="ASSET ID"
                hint="Format: ABC-0042"
                :rules="[
                  (v: string) => !!v.trim() || 'Required',
                  (v: string) =>
                    /^[A-Z]{2,4}-\d{3,5}$/.test(v.trim().toUpperCase()) ||
                    'Use letters, dash, digits: PMP-0042',
                ]"
                @blur="site.asset = site.asset.trim().toUpperCase()"
              />
              <q-input
                v-model="site.inspector"
                outlined
                label="INSPECTOR"
                autocomplete="name"
                :rules="[(v: string) => v.trim().length >= 2 || 'Required']"
              />
              <q-input
                v-model="site.date"
                outlined
                type="date"
                label="DATE"
                stack-label
                :rules="[
                  (v: string) => !!v || 'Required',
                  (v: string) => v <= todayIso || 'Cannot be in the future',
                ]"
              />
              <q-select
                v-model="site.type"
                outlined
                :options="inspectionTypes"
                label="INSPECTION TYPE"
                :rules="[(v: string | null) => !!v || 'Choose a type']"
                class="ins__span"
              />
            </q-form>
          </q-step>

          <!-- 2. Checklist -->
          <q-step :name="2" title="Checklist" icon="checklist" :done="step > 2">
            <h2 class="ins__h">Checklist</h2>
            <p class="ins__lede">{{ answered }} of {{ checklist.length }} answered</p>
            <q-form ref="checkForm" greedy class="checks" @submit.prevent>
              <fieldset
                v-for="(item, i) in checklist"
                :key="item.id"
                class="check"
                :class="{ 'check--error': showCheckErrors && !item.result }"
              >
                <legend class="check__q">
                  <span class="check__n">{{ String(i + 1).padStart(2, '0') }}</span
                  >{{ item.text }}
                </legend>
                <div class="check__choices">
                  <button
                    v-for="choice in choices"
                    :key="choice.value"
                    type="button"
                    class="choice"
                    :class="[`choice--${choice.value}`, { 'is-on': item.result === choice.value }]"
                    :aria-pressed="item.result === choice.value"
                    @click="item.result = choice.value"
                  >
                    <q-icon :name="choice.icon" aria-hidden="true" />{{ choice.label }}
                  </button>
                </div>
                <p v-if="showCheckErrors && !item.result" class="check__err" role="alert">
                  Choose PASS, FAIL or N/A
                </p>
                <q-input
                  v-model="item.note"
                  outlined
                  dense
                  autogrow
                  :label="item.result === 'fail' ? 'NOTE (REQUIRED FOR FAIL)' : 'NOTE'"
                  :rules="[
                    (v: string) => item.result !== 'fail' || !!v.trim() || 'Describe the failure',
                  ]"
                  class="check__note"
                />
              </fieldset>
            </q-form>
          </q-step>

          <!-- 3. Photos -->
          <q-step :name="3" title="Photos" icon="photo_camera" :done="step > 3">
            <h2 class="ins__h">Photos</h2>
            <p class="ins__lede">
              {{
                failCount
                  ? 'At least one photo is required because an item failed.'
                  : 'Optional. Add evidence for the record.'
              }}
              Previews stay on this device; nothing is uploaded.
            </p>
            <q-file
              :model-value="null"
              outlined
              multiple
              accept="image/*"
              capture="environment"
              label="ADD PHOTOS"
              max-file-size="15000000"
              :error="showPhotoError"
              error-message="Add at least one photo of the failed item"
              class="photos__input"
              @update:model-value="addPhotos"
              @rejected="$q.notify('That file is not an image under 15 MB')"
            >
              <template #prepend><q-icon name="add_a_photo" /></template>
            </q-file>
            <ul v-if="photos.length" class="photos">
              <li v-for="(photo, i) in photos" :key="photo.url" class="photo">
                <img :src="photo.url" :alt="`Photo ${i + 1}: ${photo.name}`" />
                <q-btn
                  unelevated
                  icon="delete"
                  class="photo__remove"
                  :aria-label="`Remove photo ${i + 1}`"
                  @click="removePhoto(i)"
                />
              </li>
            </ul>
          </q-step>

          <!-- 4. Signature -->
          <q-step :name="4" title="Sign" icon="draw" :done="step > 4">
            <h2 class="ins__h">Sign off</h2>
            <p class="ins__lede">
              {{ site.inspector || 'Inspector' }} confirms the checks above were carried out on
              site.
            </p>
            <SignaturePad ref="pad" :error="showSignError" @change="signed = $event" />
            <p v-if="showSignError" class="check__err" role="alert">A signature is required</p>
            <div class="sig-actions">
              <q-btn
                outline
                icon="backspace"
                label="Clear"
                class="btn-outline"
                @click="pad?.clear()"
              />
              <q-btn
                outline
                icon="keyboard"
                label="Type name instead"
                class="btn-outline"
                :disable="!site.inspector.trim()"
                @click="pad?.signTyped(site.inspector.trim())"
              />
            </div>
          </q-step>

          <!-- 5. Review -->
          <q-step :name="5" title="Review" icon="fact_check">
            <h2 class="ins__h">Review &amp; submit</h2>
            <dl class="review">
              <dt>SITE</dt>
              <dd>{{ site.name }}</dd>
              <dt>ASSET</dt>
              <dd class="mono">{{ site.asset }}</dd>
              <dt>TYPE</dt>
              <dd>{{ site.type }}</dd>
              <dt>INSPECTOR</dt>
              <dd>{{ site.inspector }}</dd>
              <dt>DATE</dt>
              <dd class="mono">{{ site.date }}</dd>
              <dt>RESULT</dt>
              <dd>
                <span class="tally tally--pass">{{ passCount }} PASS</span>
                <span class="tally tally--fail">{{ failCount }} FAIL</span>
                <span class="tally tally--na">{{ naCount }} N/A</span>
              </dd>
              <dt>PHOTOS</dt>
              <dd class="mono">{{ photos.length }}</dd>
            </dl>
            <ul v-if="failCount" class="failures">
              <li v-for="item in checklist.filter((c) => c.result === 'fail')" :key="item.id">
                <strong>FAIL · {{ item.text }}</strong>
                <span>{{ item.note }}</span>
              </li>
            </ul>
          </q-step>

          <template #navigation>
            <div class="wizard__nav">
              <q-btn
                v-if="step > 1"
                outline
                icon="arrow_back"
                label="Back"
                class="btn-outline"
                @click="back"
              />
              <q-space />
              <q-btn
                v-if="step < 5"
                unelevated
                color="primary"
                text-color="on-primary"
                icon-right="arrow_forward"
                label="Continue"
                class="btn-main"
                @click="next"
              />
              <q-btn
                v-else
                unelevated
                color="primary"
                text-color="on-primary"
                icon="outbox"
                label="Submit to outbox"
                class="btn-main"
                @click="submit"
              />
            </div>
          </template>
        </q-stepper>

        <!-- Outbox -->
        <section v-else class="outbox" aria-labelledby="outbox-title">
          <div class="outbox__head">
            <h2 id="outbox-title" class="ins__h">Outbox</h2>
            <q-btn
              unelevated
              color="primary"
              text-color="on-primary"
              icon="sync"
              :label="syncing ? 'Syncing…' : `Sync now (${pendingCount})`"
              :loading="syncing"
              :disable="!pendingCount"
              class="btn-main"
              @click="sync"
            />
          </div>
          <p class="ins__lede">
            Submitted inspections wait here, stored on the device, until there is a connection.
            Syncing is simulated.
          </p>
          <ul class="queue">
            <li v-for="item in queue" :key="item.id" class="job" :class="`job--${item.status}`">
              <div class="job__main">
                <span class="job__ref">{{ item.ref }}</span>
                <strong class="job__site">{{ item.site }}</strong>
                <span class="job__meta">{{ item.asset }} · {{ item.type }} · {{ item.date }}</span>
                <span class="job__meta">
                  {{ item.pass }} pass · {{ item.fail }} fail · {{ item.na }} n/a ·
                  {{ item.photos }} photos
                </span>
              </div>
              <img
                v-if="item.signature"
                :src="item.signature"
                :alt="`Signature of ${item.inspector}`"
                class="job__sig"
              />
              <span class="job__status">
                <q-icon :name="statusIcon[item.status]" aria-hidden="true" />{{
                  item.status.toUpperCase()
                }}
              </span>
            </li>
          </ul>
          <p v-if="!queue.length" class="ins__lede">Outbox is empty.</p>
          <q-btn
            v-if="queue.some((q) => q.status === 'synced')"
            outline
            icon="clear_all"
            label="Clear synced"
            class="btn-outline"
            @click="clearSynced"
          />
        </section>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useQuasar, type QForm } from 'quasar';
import AppBackLink from '@/components/AppBackLink.vue';
import { uid, useStoredRef } from '@/composables/useStoredRef';
import SignaturePad from './SignaturePad.vue';

type Result = 'pass' | 'fail' | 'na';
type SyncStatus = 'queued' | 'syncing' | 'synced';

interface QueuedInspection {
  id: string;
  ref: string;
  site: string;
  asset: string;
  type: string;
  inspector: string;
  date: string;
  pass: number;
  fail: number;
  na: number;
  photos: number;
  signature: string | null;
  status: SyncStatus;
}

const $q = useQuasar();
const view = ref<'new' | 'outbox'>('new');
const step = ref(1);

const todayIso = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local
const inspectionTypes = ['Pump station', 'Scaffold', 'Electrical panel', 'Fire safety'];
const choices: { value: Result; label: string; icon: string }[] = [
  { value: 'pass', label: 'PASS', icon: 'check' },
  { value: 'fail', label: 'FAIL', icon: 'close' },
  { value: 'na', label: 'N/A', icon: 'remove' },
];
const statusIcon: Record<SyncStatus, string> = {
  queued: 'schedule',
  syncing: 'sync',
  synced: 'cloud_done',
};

// --- Form state ----------------------------------------------------------------------

const blankSite = () => ({
  name: '',
  asset: '',
  inspector: '',
  date: todayIso,
  type: null as string | null,
});

const blankChecklist = () =>
  [
    'Guards and covers secured',
    'Emergency stop tested and functional',
    'No visible leaks, corrosion or damage',
    'Lockout / tagout points labelled',
    'Fire extinguisher present and in date',
    'Walkways and exits clear',
  ].map((text, i) => ({ id: i, text, result: null as Result | null, note: '' }));

const site = reactive(blankSite());
const checklist = reactive(blankChecklist());
const photos = ref<{ name: string; url: string }[]>([]);
const signed = ref(false);

const siteForm = ref<QForm | null>(null);
const checkForm = ref<QForm | null>(null);
const pad = ref<InstanceType<typeof SignaturePad> | null>(null);

const showCheckErrors = ref(false);
const showPhotoError = ref(false);
const showSignError = ref(false);

const count = (r: Result) => checklist.filter((c) => c.result === r).length;
const passCount = computed(() => count('pass'));
const failCount = computed(() => count('fail'));
const naCount = computed(() => count('na'));
const answered = computed(() => checklist.filter((c) => c.result).length);

// --- Photos (local object URLs only) -----------------------------------------------------

function addPhotos(files: File[] | File | null) {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  for (const file of list) {
    if (photos.value.length >= 8) {
      $q.notify('Up to 8 photos per inspection');
      break;
    }
    photos.value.push({ name: file.name, url: URL.createObjectURL(file) });
  }
  if (photos.value.length) showPhotoError.value = false;
}

function removePhoto(index: number) {
  const [photo] = photos.value.splice(index, 1);
  if (photo) URL.revokeObjectURL(photo.url);
}

function clearPhotos() {
  photos.value.forEach((p) => URL.revokeObjectURL(p.url));
  photos.value = [];
}

// --- Step validation ------------------------------------------------------------------------

// Only the active step's form is mounted; a step can only be left through
// Continue, so an unmounted form has already passed (hence `?? true`).
async function validateStep(n: number): Promise<boolean> {
  switch (n) {
    case 1:
      return (await siteForm.value?.validate(true)) ?? true;
    case 2: {
      showCheckErrors.value = true;
      const notesOk = (await checkForm.value?.validate(true)) ?? true;
      return notesOk && answered.value === checklist.length;
    }
    case 3:
      showPhotoError.value = failCount.value > 0 && photos.value.length === 0;
      return !showPhotoError.value;
    case 4:
      showSignError.value = !signed.value;
      return signed.value;
    default:
      return true;
  }
}

async function next() {
  if (await validateStep(step.value)) {
    step.value++;
    window.scrollTo({ top: 0 });
  } else {
    $q.notify({ message: 'Fix the highlighted items to continue', icon: 'warning' });
  }
}

function back() {
  step.value--;
}

// --- Outbox ---------------------------------------------------------------------------------

function seedQueue(): QueuedInspection[] {
  const base = { type: 'Pump station', inspector: 'R. Okafor', signature: null, photos: 2 };
  return [
    {
      ...base,
      id: 's1',
      ref: 'INS-0041',
      site: 'Riverside lift station',
      asset: 'PMP-0112',
      date: todayIso,
      pass: 6,
      fail: 0,
      na: 0,
      status: 'queued',
    },
    {
      ...base,
      id: 's2',
      ref: 'INS-0040',
      site: 'North depot',
      asset: 'ELP-0031',
      type: 'Electrical panel',
      date: todayIso,
      pass: 4,
      fail: 1,
      na: 1,
      status: 'synced',
    },
  ];
}

// An inspection caught mid-sync when the page closed goes back to the queue.
const queue = useStoredRef('inspect-outbox', seedQueue, (stored) =>
  stored.map((q) => (q.status === 'syncing' ? { ...q, status: 'queued' as const } : q)),
);
const pendingCount = computed(() => queue.value.filter((q) => q.status !== 'synced').length);

function nextRef() {
  const max = Math.max(0, ...queue.value.map((q) => Number(q.ref.slice(4)) || 0));
  return `INS-${String(max + 1).padStart(4, '0')}`;
}

async function submit() {
  for (const n of [1, 2, 3, 4]) {
    if (!(await validateStep(n))) {
      step.value = n;
      return;
    }
  }
  const ref = nextRef();
  queue.value.unshift({
    id: uid(),
    ref,
    site: site.name.trim(),
    asset: site.asset,
    type: site.type ?? '',
    inspector: site.inspector.trim(),
    date: site.date,
    pass: passCount.value,
    fail: failCount.value,
    na: naCount.value,
    photos: photos.value.length,
    signature: pad.value?.toDataURL() ?? null,
    status: 'queued',
  });
  resetWizard();
  view.value = 'outbox';
  $q.notify({ message: `${ref} saved to outbox`, icon: 'outbox' });
}

function resetWizard() {
  Object.assign(site, blankSite());
  checklist.splice(0, checklist.length, ...blankChecklist());
  clearPhotos();
  signed.value = false;
  showCheckErrors.value = showPhotoError.value = showSignError.value = false;
  step.value = 1;
}

const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const setOnline = () => (online.value = navigator.onLine);
const syncing = ref(false);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function sync() {
  if (syncing.value) return;
  if (!online.value) {
    $q.notify({ message: 'Offline. Items stay queued until you reconnect.', icon: 'cloud_off' });
    return;
  }
  syncing.value = true;
  for (const item of queue.value.filter((q) => q.status === 'queued')) {
    item.status = 'syncing';
    await wait(800);
    item.status = 'synced';
  }
  syncing.value = false;
  $q.notify({ message: 'Outbox synced', icon: 'cloud_done' });
}

function clearSynced() {
  queue.value = queue.value.filter((q) => q.status !== 'synced');
}

onMounted(() => {
  window.addEventListener('online', setOnline);
  window.addEventListener('offline', setOnline);
});
onBeforeUnmount(() => {
  window.removeEventListener('online', setOnline);
  window.removeEventListener('offline', setOnline);
  clearPhotos();
});
</script>

<style scoped lang="scss">
// Header ------------------------------------------------------------------------------

.ins__header {
  border-bottom: 8px solid transparent;
  border-image: repeating-linear-gradient(-45deg, var(--t-primary) 0 14px, #0d0d0d 14px 28px) 8;
  color: #fff;
}

.ins__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 960px;
  height: 60px;
  margin-inline: auto;
  padding: 0 12px;
}

.ins__brand {
  font-family: var(--t-font-display);
  font-size: 1.375rem;
  font-weight: 900;
  font-stretch: 75%;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ins__net {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 6px 10px;
  border: 2px solid currentColor;
  font-family: var(--t-font-mono);
  font-size: 12px;
  font-weight: 600;

  i {
    width: 10px;
    height: 10px;
    background: currentColor;
  }

  &.is-online {
    color: #7dffb0;
  }

  &.is-offline {
    color: var(--t-primary);
  }
}

.ins__tabs {
  max-width: 960px;
  margin-inline: auto;
  padding: 0 4px;

  :deep(.q-tab) {
    min-height: 52px;
    color: #c9c9c2;
    font-family: var(--t-font-mono);
    font-weight: 600;
  }

  :deep(.q-tab--active) {
    color: #fff;
  }

  :deep(.q-tab__label) {
    font-size: 14px;
    font-weight: 600;
  }

  :deep(.q-tab__indicator) {
    height: 4px;
  }
}

.ins__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ins__count {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--t-primary);
  color: var(--t-on-primary);
  font-weight: 800;
}

// Page --------------------------------------------------------------------------------

.ins__page {
  max-width: 960px;
  margin-inline: auto;
  padding: 16px 12px 48px;

  @media (min-width: 600px) {
    padding: 24px 20px 64px;
  }
}

.ins__h {
  margin: 0 0 4px;
  font-family: var(--t-font-display);
  font-size: 1.75rem;
  font-weight: 900;
  font-stretch: 80%;
  line-height: 1.1;
  text-transform: uppercase;
}

.ins__lede {
  margin: 0 0 16px;
  color: var(--t-muted);
  font-size: 15px;
}

.mono {
  font-family: var(--t-font-mono);
}

// Stepper ---------------------------------------------------------------------------------

.wizard {
  border: 2px solid var(--t-border);
  border-radius: var(--t-radius);
  background: var(--t-surface);
  box-shadow: var(--t-shadow);

  :deep(.q-stepper__header) {
    border-bottom: 2px solid var(--t-border);
  }

  :deep(.q-stepper__tab) {
    padding: 14px 8px;
    color: var(--t-muted);
  }

  :deep(.q-stepper__title) {
    font-family: var(--t-font-mono);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
  }

  // Colours set here rather than via active-color: Quasar would also tint the
  // label orange, which fails contrast on white.
  :deep(.q-stepper__dot) {
    width: 36px;
    min-width: 36px;
    height: 36px;
    border-radius: 2px;
    background: var(--t-muted);
    font-size: 18px;
  }

  :deep(.q-stepper__tab--active),
  :deep(.q-stepper__tab--done) {
    color: var(--t-text);
  }

  :deep(.q-stepper__tab--done .q-stepper__dot) {
    background: var(--t-text);
  }

  :deep(.q-stepper__tab--active .q-stepper__dot) {
    background: var(--t-primary);
    outline: 2px solid var(--t-text);

    span {
      color: var(--t-on-primary);
    }
  }

  :deep(.q-stepper__step-inner) {
    padding: 20px 16px;

    @media (min-width: 600px) {
      padding: 28px 24px;
    }
  }
}

.wizard__nav {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 2px solid var(--t-border);

  @media (min-width: 600px) {
    padding: 16px 24px;
  }
}

.btn-main,
.btn-outline {
  min-height: 56px;
  padding: 0 20px;
  font-size: 15px;
}

.btn-main {
  border: 2px solid var(--t-text);
  box-shadow: 3px 3px 0 var(--t-text);

  &:active {
    box-shadow: none;
    transform: translate(3px, 3px);
  }
}

.btn-outline {
  color: var(--t-text);

  &::before {
    border: 2px solid var(--t-text);
  }
}

.ins__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 8px 16px;
  margin-top: 16px;
}

.ins__span {
  grid-column: 1 / -1;
}

// Checklist --------------------------------------------------------------------------------

.checks {
  display: grid;
  gap: 14px;
}

.check {
  min-width: 0;
  margin: 0;
  padding: 14px;
  border: 2px solid var(--t-border);
  background: var(--t-surface-2);

  &--error {
    border-color: var(--t-negative);
    box-shadow: inset 6px 0 0 var(--t-negative);
  }
}

.check__q {
  display: flex;
  gap: 10px;
  float: left; // lets the legend sit inside the fieldset box like a heading
  width: 100%;
  margin-bottom: 12px;
  padding: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.check__n {
  flex: none;
  color: var(--t-muted);
  font-family: var(--t-font-mono);
}

.check__choices {
  clear: both;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.choice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 56px;
  border: 2px solid var(--t-text);
  background: var(--t-surface);
  color: var(--t-text);
  font-family: var(--t-font-mono);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;

  .q-icon {
    font-size: 22px;
  }

  &.is-on {
    box-shadow: inset 0 0 0 3px var(--t-surface);
    color: #fff;
  }

  &--pass.is-on {
    background: var(--t-positive);
  }

  &--fail.is-on {
    background: var(--t-negative);
  }

  &--na.is-on {
    background: var(--t-neutral);
  }
}

.check__err {
  margin: 8px 0 0;
  color: var(--t-negative);
  font-family: var(--t-font-mono);
  font-size: 13px;
  font-weight: 700;
}

.check__note {
  margin-top: 12px;
  padding-bottom: 0;
}

// Photos -----------------------------------------------------------------------------------

.photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.photo {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 2px solid var(--t-border);
  background: var(--t-surface-2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.photo__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 48px;
  background: #0d0d0d;
  color: #fff;
}

// Signature --------------------------------------------------------------------------------

.sig-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

// Review -----------------------------------------------------------------------------------

.review {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  margin: 16px 0;
  border: 2px solid var(--t-border);

  dt,
  dd {
    margin: 0;
    padding: 10px 12px;
    border-bottom: 2px solid var(--t-border);
  }

  dt {
    border-right: 2px solid var(--t-border);
    background: var(--t-surface-2);
    color: var(--t-muted);
    font-family: var(--t-font-mono);
    font-size: 13px;
    font-weight: 600;
  }

  dd {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  dt:nth-last-of-type(1),
  dd:nth-last-of-type(1) {
    border-bottom: 0;
  }
}

.tally {
  display: inline-block;
  margin: 2px 6px 2px 0;
  padding: 2px 8px;
  color: #fff;
  font-family: var(--t-font-mono);
  font-size: 13px;

  &--pass {
    background: var(--t-positive);
  }

  &--fail {
    background: var(--t-negative);
  }

  &--na {
    background: var(--t-neutral);
  }
}

.failures {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border-left: 6px solid var(--t-negative);
    background: var(--t-surface-2);
  }
}

// Outbox -----------------------------------------------------------------------------------

.outbox__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.queue {
  display: grid;
  gap: 12px;
  margin: 0 0 16px;
  padding: 0;
  list-style: none;
}

.job {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 2px solid var(--t-border);
  background: var(--t-surface);
  box-shadow: var(--t-shadow);
}

.job__main {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.job__ref {
  font-family: var(--t-font-mono);
  font-size: 13px;
  font-weight: 600;
}

.job__site {
  font-size: 18px;
  line-height: 1.25;
}

.job__meta {
  color: var(--t-muted);
  font-size: 14px;
}

.job__sig {
  grid-row: span 2;
  width: 120px;
  height: auto;
  border: 2px solid var(--t-border);
  background: #fff;
}

.job__status {
  display: inline-flex;
  grid-column: 1 / -1;
  align-items: center;
  justify-self: start;
  gap: 6px;
  padding: 4px 10px;
  border: 2px solid var(--t-border);
  font-family: var(--t-font-mono);
  font-size: 13px;
  font-weight: 700;
}

.job--queued .job__status {
  background: var(--t-warning);
}

.job--syncing .job__status {
  background: var(--t-primary);

  .q-icon {
    animation: spin 1s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .q-icon {
      animation: none;
    }
  }
}

.job--synced .job__status {
  border-color: var(--t-positive);
  color: var(--t-positive);
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

@media (max-width: 479px) {
  .job__sig {
    display: none;
  }
}
</style>
