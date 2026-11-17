import { ref, watch, type Ref } from 'vue';

// A ref mirrored to localStorage. Storage can be unavailable (private mode,
// sandboxed iframes, quota), so every access is guarded and the app keeps
// working in memory. `revive` can repair or migrate what was stored.

const PREFIX = 'quasar-apps:';

export function useStoredRef<T>(
  key: string,
  fallback: () => T,
  revive: (stored: T) => T = (stored) => stored,
): Ref<T> {
  const state = ref(load()) as Ref<T>;

  function load(): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw !== null) {
        const parsed = JSON.parse(raw) as T;
        const initial = fallback();
        // Only trust stored data shaped like the fallback (array vs object).
        if (Array.isArray(parsed) === Array.isArray(initial) && typeof parsed === typeof initial) {
          return revive(parsed);
        }
      }
    } catch {
      // Corrupt or blocked storage: start fresh.
    }
    return fallback();
  }

  watch(
    state,
    (value) => {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        // Not persisted this time; the in-memory state is still correct.
      }
    },
    { deep: true },
  );

  return state;
}

let counter = 0;

/** Short unique-enough id for demo records. */
export function uid(): string {
  counter = (counter + 1) % 1296;
  return Date.now().toString(36) + counter.toString(36).padStart(2, '0');
}
