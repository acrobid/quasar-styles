// Pocket: spending + habits model, date helpers and seed data.

export type CategoryId = 'food' | 'groceries' | 'transport' | 'fun' | 'bills';
export type Tile = 'lemon' | 'mint' | 'lilac' | 'coral' | 'sky';

export interface Expense {
  id: string;
  cents: number;
  category: CategoryId;
  note: string;
  at: number;
}

export interface Habit {
  id: string;
  name: string;
  tile: Tile;
  done: string[]; // day keys (YYYY-MM-DD, local)
}

export interface TrackerState {
  expenses: Expense[];
  habits: Habit[];
  weeklyBudgetCents: number;
}

export const categories: { id: CategoryId; label: string; icon: string; tile: Tile }[] = [
  { id: 'food', label: 'Eating out', icon: 'ramen_dining', tile: 'coral' },
  { id: 'groceries', label: 'Groceries', icon: 'shopping_basket', tile: 'mint' },
  { id: 'transport', label: 'Transport', icon: 'directions_bus', tile: 'sky' },
  { id: 'fun', label: 'Fun', icon: 'celebration', tile: 'lilac' },
  { id: 'bills', label: 'Bills', icon: 'receipt_long', tile: 'lemon' },
];

export const tiles: Tile[] = ['lemon', 'mint', 'lilac', 'coral', 'sky'];

export const category = (id: CategoryId) => categories.find((c) => c.id === id) ?? categories[0]!;

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const moneyRound = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
export const formatMoney = (cents: number, round = false) =>
  (round ? moneyRound : money).format(cents / 100);

// --- Dates (local time; weeks start on Monday) ---------------------------------

export function dayKey(date: Date | number): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(date: Date | number): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Monday..Sunday of the week containing `date`. */
export function weekDays(date: Date = new Date()): Date[] {
  const start = startOfDay(date);
  const offset = (start.getDay() + 6) % 7; // Monday = 0
  const monday = addDays(start, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function dayLabel(date: Date | number): string {
  const key = dayKey(date);
  const today = new Date();
  if (key === dayKey(today)) return 'Today';
  if (key === dayKey(addDays(today, -1))) return 'Yesterday';
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

/** Consecutive days with a check-in, counting back from today (or yesterday). */
export function streak(done: string[]): number {
  const set = new Set(done);
  let day = startOfDay(new Date());
  if (!set.has(dayKey(day))) day = addDays(day, -1);
  let n = 0;
  while (set.has(dayKey(day))) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

// --- Seed -----------------------------------------------------------------------

export function seedTracker(): TrackerState {
  const today = startOfDay(new Date());
  const at = (daysAgo: number, hour: number) =>
    addDays(today, -daysAgo).getTime() + hour * 3_600_000;
  const days = (...ago: number[]) => ago.map((n) => dayKey(addDays(today, -n)));

  const rows: [number, number, CategoryId, string][] = [
    [0, 8.5, 'food', 'Flat white + croissant'],
    [0, 12.75, 'transport', 'Train pass top-up'],
    [1, 42.3, 'groceries', 'Weekly shop'],
    [1, 18, 'fun', 'Cinema'],
    [2, 14.2, 'food', 'Lunch with Sam'],
    [3, 64.99, 'bills', 'Phone plan'],
    [3, 6.4, 'transport', 'Bus'],
    [4, 23.5, 'food', 'Thai takeaway'],
    [5, 31.8, 'groceries', 'Market'],
    [6, 12, 'fun', 'Museum'],
    [8, 9.6, 'food', 'Bagels'],
  ];

  return {
    weeklyBudgetCents: 25_000,
    expenses: rows.map(([ago, amount, cat, note], i) => ({
      id: `seed-e${i}`,
      cents: Math.round(amount * 100),
      category: cat,
      note,
      at: at(ago, 9 + i),
    })),
    habits: [
      { id: 'seed-h1', name: 'Walk 8k steps', tile: 'mint', done: days(1, 2, 3, 4, 5) },
      { id: 'seed-h2', name: 'Read 20 minutes', tile: 'lilac', done: days(0, 1, 3, 4) },
      { id: 'seed-h3', name: 'Cook at home', tile: 'coral', done: days(1, 2, 5) },
      { id: 'seed-h4', name: 'Stretch', tile: 'sky', done: days(0, 1, 2) },
    ],
  };
}
