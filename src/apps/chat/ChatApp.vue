<template>
  <q-layout view="lHh LpR lFf" class="chat">
    <q-header class="chat__header">
      <q-toolbar class="chat__toolbar">
        <template v-if="narrow">
          <AppBackLink />
          <q-btn
            flat
            round
            icon="menu"
            aria-label="Show conversations"
            @click="drawerOpen = !drawerOpen"
          />
        </template>
        <h1 class="chat__title">{{ active.title }}</h1>
        <q-select
          v-model="active.model"
          :options="models"
          emit-value
          map-options
          dense
          borderless
          options-dense
          class="chat__model"
          popup-content-class="chat__model-menu"
          aria-label="Model"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label>{{ opt.label }}</q-item-label>
                <q-item-label caption>{{ opt.caption }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-btn flat round icon="edit_square" aria-label="New chat" @click="newChat">
          <q-tooltip>New chat</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :width="288"
      :breakpoint="900"
      class="chat__drawer"
    >
      <nav class="chat__nav" aria-label="Conversations">
        <div class="chat__nav-head">
          <AppBackLink />
          <span class="chat__wordmark">Quill</span>
        </div>
        <q-btn outline no-caps icon="add" label="New chat" class="chat__new" @click="newChat" />
        <p class="chat__nav-label">Recent</p>
        <q-list class="chat__list">
          <q-item
            v-for="conv in sortedConversations"
            :key="conv.id"
            clickable
            :active="conv.id === state.activeId"
            active-class="is-active"
            class="chat__conv"
            @click="openChat(conv.id)"
          >
            <q-item-section>
              <q-item-label lines="1">{{ conv.title }}</q-item-label>
              <q-item-label caption>{{ relativeTime(conv.updatedAt) }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                size="sm"
                icon="close"
                class="chat__conv-delete"
                :aria-label="`Delete “${conv.title}”`"
                @click.stop="deleteChat(conv.id)"
              />
            </q-item-section>
          </q-item>
        </q-list>
        <p class="chat__nav-foot">Saved in this browser only.</p>
      </nav>
    </q-drawer>

    <q-page-container>
      <q-page class="chat__page">
        <section v-if="!active.messages.length" class="chat__empty">
          <h2>What's on your mind?</h2>
          <p>
            Quill is a simulated assistant: replies are pre-written and typed out locally, so you
            can try streaming, stopping and copying without a network.
          </p>
          <div class="chat__suggestions">
            <q-btn
              v-for="s in suggestions"
              :key="s"
              outline
              no-caps
              :label="s"
              class="chat__suggestion"
              @click="send(s)"
            />
          </div>
        </section>

        <ol v-else class="chat__thread">
          <li v-for="msg in active.messages" :key="msg.id" class="msg" :class="`msg--${msg.role}`">
            <p v-if="msg.role === 'assistant'" class="msg__who">
              Quill <span>· {{ findModel(msg.model ?? active.model).label }}</span>
            </p>
            <p v-else class="visually-hidden">You said</p>
            <div class="msg__text">
              <span class="msg__body">{{ msg.text }}</span>
              <span v-if="msg.id === streamingId" class="msg__caret" aria-hidden="true" />
            </div>
            <div v-if="msg.role === 'assistant' && msg.id !== streamingId" class="msg__actions">
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                icon="content_copy"
                label="Copy"
                class="msg__action"
                @click="copy(msg.text)"
              />
              <span v-if="msg.stopped" class="msg__stopped">Stopped</span>
            </div>
          </li>
        </ol>
        <p class="visually-hidden" aria-live="polite">{{ announcement }}</p>
      </q-page>
    </q-page-container>

    <q-footer class="chat__footer">
      <form class="composer" @submit.prevent="send(draft)">
        <label for="chat-composer" class="visually-hidden">Message Quill</label>
        <q-input
          v-model="draft"
          for="chat-composer"
          type="textarea"
          autogrow
          borderless
          placeholder="Message Quill…"
          class="composer__input"
          @keydown.enter="onEnter"
        />
        <q-btn
          v-if="streamingId"
          round
          unelevated
          icon="stop"
          color="primary"
          class="composer__btn"
          aria-label="Stop generating"
          @click="stop"
        />
        <q-btn
          v-else
          round
          unelevated
          type="submit"
          icon="arrow_upward"
          color="primary"
          class="composer__btn"
          aria-label="Send message"
          :disable="!draft.trim()"
        />
      </form>
      <p class="composer__hint">Enter to send · Shift+Enter for a new line</p>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { copyToClipboard, useQuasar } from 'quasar';
import AppBackLink from '@/components/AppBackLink.vue';
import { uid, useStoredRef } from '@/composables/useStoredRef';
import { findModel, models, pickReply, suggestions, type ModelId } from './replies';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  model?: ModelId;
  stopped?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  model: ModelId;
  messages: Message[];
  updatedAt: number;
}

const NEW_TITLE = 'New chat';
const $q = useQuasar();
const narrow = computed(() => $q.screen.width < 900);
const drawerOpen = ref(false);
const draft = ref('');
const streamingId = ref<string | null>(null);
const announcement = ref(''); // read out once per reply, not per streamed word

function blankChat(): Conversation {
  return { id: uid(), title: NEW_TITLE, model: 'quill-swift', messages: [], updatedAt: Date.now() };
}

function seed() {
  const hourAgo = Date.now() - 3_600_000;
  const example: Conversation = {
    id: 'seed-1',
    title: 'Why build a chat app in Quasar?',
    model: 'quill-deep',
    updatedAt: hourAgo,
    messages: [
      { id: 'seed-1a', role: 'user', text: 'Why build a chat app in Quasar?' },
      {
        id: 'seed-1b',
        role: 'assistant',
        model: 'quill-deep',
        text: pickReply('quasar', 0),
      },
    ],
  };
  const fresh = blankChat();
  return { conversations: [fresh, example], activeId: fresh.id };
}

// A reply that was mid-stream when the page closed is kept as stopped.
const state = useStoredRef('chat', seed, (stored) => {
  if (!Array.isArray(stored.conversations) || !stored.conversations.length) return seed();
  return stored;
});

const active = computed(
  () =>
    state.value.conversations.find((c) => c.id === state.value.activeId) ??
    state.value.conversations[0]!,
);

const sortedConversations = computed(() =>
  [...state.value.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
);

function relativeTime(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function closeDrawerOnMobile() {
  if (narrow.value) drawerOpen.value = false;
}

function newChat() {
  stop();
  // Reuse an untouched chat instead of piling up empty ones.
  const empty = state.value.conversations.find((c) => !c.messages.length);
  const chat = empty ?? blankChat();
  if (!empty) state.value.conversations.push(chat);
  chat.updatedAt = Date.now();
  state.value.activeId = chat.id;
  draft.value = '';
  closeDrawerOnMobile();
}

function openChat(id: string) {
  stop();
  state.value.activeId = id;
  closeDrawerOnMobile();
  void nextTick(() => scrollToEnd(true));
}

function deleteChat(id: string) {
  if (active.value.id === id) stop();
  const rest = state.value.conversations.filter((c) => c.id !== id);
  state.value.conversations = rest.length ? rest : [blankChat()];
  if (!state.value.conversations.some((c) => c.id === state.value.activeId)) {
    state.value.activeId = state.value.conversations[0]!.id;
  }
}

function onEnter(e: KeyboardEvent) {
  if (e.shiftKey || e.isComposing) return;
  e.preventDefault();
  send(draft.value);
}

// --- Simulated streaming ------------------------------------------------------

let timer: ReturnType<typeof setTimeout> | undefined;

function nearBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
}

function scrollToEnd(force = false) {
  if (force || nearBottom()) window.scrollTo({ top: document.documentElement.scrollHeight });
}

function send(text: string) {
  const prompt = text.trim();
  if (!prompt) return;
  stop();

  const chat = active.value;
  if (chat.title === NEW_TITLE) {
    chat.title = prompt.length > 48 ? `${prompt.slice(0, 46).trimEnd()}…` : prompt;
  }
  const turn = chat.messages.filter((m) => m.role === 'user').length;
  chat.messages.push({ id: uid(), role: 'user', text: prompt });
  const reply: Message = { id: uid(), role: 'assistant', model: chat.model, text: '' };
  chat.messages.push(reply);
  chat.updatedAt = Date.now();
  draft.value = '';
  streamingId.value = reply.id;
  announcement.value = 'Quill is replying…';
  void nextTick(() => scrollToEnd(true));

  const words = pickReply(prompt, turn).match(/\S+\s*/g) ?? [];
  const delay = findModel(chat.model).msPerWord;
  let i = 0;
  // Read the message back through the reactive array so edits are tracked.
  const target = () => chat.messages.find((m) => m.id === reply.id);

  const tick = () => {
    const msg = target();
    if (!msg || i >= words.length) {
      finish();
      return;
    }
    msg.text += words[i++];
    scrollToEnd();
    timer = setTimeout(tick, delay + (i % 7 === 0 ? delay * 3 : 0)); // little pauses
  };
  timer = setTimeout(tick, 450); // "thinking"
}

function finish() {
  clearTimeout(timer);
  timer = undefined;
  if (streamingId.value) announcement.value = 'Quill replied.';
  streamingId.value = null;
}

function stop() {
  if (!streamingId.value) return;
  const msg = active.value.messages.find((m) => m.id === streamingId.value);
  if (msg) msg.stopped = true;
  finish();
}

async function copy(text: string) {
  try {
    await copyToClipboard(text);
    $q.notify({ message: 'Copied to clipboard', icon: 'check' });
  } catch {
    $q.notify({ message: 'Copy failed: clipboard unavailable' });
  }
}

// Leaving the app mid-reply keeps what streamed so far.
onBeforeUnmount(stop);
</script>

<style scoped lang="scss">
.chat__header {
  border-bottom: 1px solid var(--t-border);
  backdrop-filter: blur(10px);
}

.chat__toolbar {
  gap: 4px;
  min-height: 60px;
  padding: 0 12px;
}

.chat__title {
  flex: 1;
  min-width: 0;
  margin: 0 8px;
  overflow: hidden;
  font-family: var(--t-font-display);
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.chat__model {
  flex: none;
  font-size: 13px;

  :deep(.q-field__native) {
    color: var(--t-muted);
    font-weight: 500;
  }
}

// Drawer ----------------------------------------------------------------------

.chat__nav {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 12px;
}

.chat__nav-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.chat__wordmark {
  padding-right: 8px;
  font-family: var(--t-font-display);
  font-size: 1.5rem;
  font-style: italic;
  font-weight: 500;
}

.chat__new {
  justify-content: flex-start;
  min-height: 42px;
  border-radius: var(--t-radius-sm);
  color: var(--t-text);

  &::before {
    border-color: var(--t-border-strong);
  }
}

.chat__nav-label {
  margin: 24px 8px 6px;
  color: var(--t-muted);
  font-size: 12px;
  font-weight: 500;
}

.chat__conv {
  min-height: 52px;
  padding: 6px 4px 6px 12px;
  border-radius: var(--t-radius-sm);
  color: var(--t-text);
  font-size: 14px;

  &.is-active {
    background: var(--t-surface-2);
  }
}

.chat__conv-delete {
  color: var(--t-muted);
  opacity: 0;
  transition: opacity var(--t-duration) var(--t-ease);
}

.chat__conv:hover .chat__conv-delete,
.chat__conv.is-active .chat__conv-delete,
.chat__conv-delete:focus-visible {
  opacity: 1;
}

@media (hover: none) {
  .chat__conv-delete {
    opacity: 1;
  }
}

.chat__nav-foot {
  margin: auto 8px 0;
  padding-top: 16px;
  color: var(--t-muted);
  font-size: 12px;
}

// Thread ----------------------------------------------------------------------

.chat__page {
  max-width: 46rem;
  margin-inline: auto;
  padding: 32px 20px 24px;
}

.chat__empty {
  padding-top: clamp(24px, 12vh, 120px);

  h2 {
    margin: 0;
    font-family: var(--t-font-display);
    font-size: clamp(2rem, 1.4rem + 2.5vw, 3rem);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }

  p {
    max-width: 52ch;
    margin: 16px 0 28px;
    color: var(--t-muted);
    font-size: 1rem;
    line-height: 1.6;
  }
}

.chat__suggestions {
  display: grid;
  gap: 10px;
}

.chat__suggestion {
  :deep(.q-btn__content) {
    justify-content: flex-start;
    text-align: left;
  }

  min-height: 48px;
  padding: 8px 16px;
  border-radius: var(--t-radius);
  color: var(--t-text);
  font-weight: 400;
  text-align: left;

  &::before {
    border-color: var(--t-border);
  }

  &:hover::before {
    border-color: var(--t-border-strong);
  }
}

.chat__thread {
  display: grid;
  gap: 32px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.msg__who {
  margin: 0 0 6px;
  font-family: var(--t-font-display);
  font-size: 1rem;
  font-style: italic;
  font-weight: 500;

  span {
    color: var(--t-muted);
    font-family: var(--t-font-body);
    font-size: 12px;
    font-style: normal;
  }
}

.msg__text {
  font-size: 1rem;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.msg__body {
  white-space: pre-wrap;
}

.msg--user {
  justify-self: end;
  max-width: min(85%, 34rem);

  .msg__text {
    padding: 10px 16px;
    border-radius: var(--t-radius) var(--t-radius) 4px var(--t-radius);
    background: var(--t-surface-2);
  }
}

.msg__caret {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 2px;
  vertical-align: -3px;
  background: var(--t-primary);
  animation: blink 1s steps(1) infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.msg__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  margin-left: -6px;
}

.msg__action {
  color: var(--t-muted);
  font-weight: 500;

  &:hover {
    color: var(--t-text);
  }
}

.msg__stopped {
  color: var(--t-muted);
  font-size: 12px;
  font-style: italic;
}

// Composer --------------------------------------------------------------------

.chat__footer {
  padding: 8px 16px 10px;
  background: linear-gradient(transparent, var(--t-bg) 24px);
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 46rem;
  margin-inline: auto;
  padding: 6px 6px 6px 18px;
  border: 1px solid var(--t-border-strong);
  border-radius: 24px;
  background: var(--t-surface);
  transition: border-color var(--t-duration) var(--t-ease);

  &:focus-within {
    border-color: var(--t-ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--t-ring) 22%, transparent);
  }
}

.composer__input {
  flex: 1;
  min-width: 0;

  :deep(.q-field__control) {
    min-height: 44px;
    height: auto;
  }

  :deep(textarea) {
    max-height: 40vh;
    padding: 8px 0;
    font-size: 1rem;
    line-height: 1.5;
  }

  // The composer's own ring replaces the textarea outline.
  :deep(textarea:focus-visible) {
    outline: none;
  }
}

.composer__btn {
  flex: none;
  margin-bottom: 2px;
}

.composer__hint {
  max-width: 46rem;
  margin: 6px auto 0;
  color: var(--t-muted);
  font-size: 12px;
  text-align: center;

  @media (hover: none) {
    display: none;
  }
}
</style>
