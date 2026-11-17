// Issue tracker model + seed data (fake, in-browser only).

export type Status = 'backlog' | 'todo' | 'progress' | 'review' | 'done';
export type Priority = 1 | 2 | 3 | 4 | 0; // 1 = urgent … 4 = low, 0 = none

export interface Activity {
  at: number;
  text: string;
}

export interface Issue {
  id: number;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: string | null;
  labels: string[];
  createdAt: number;
  updatedAt: number;
  activity: Activity[];
}

export const PREFIX = 'NW';
export const key = (issue: Pick<Issue, 'id'>) => `${PREFIX}-${issue.id}`;

export const statuses: { value: Status; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'progress', label: 'In progress' },
  { value: 'review', label: 'In review' },
  { value: 'done', label: 'Done' },
];

export const priorities: { value: Priority; label: string }[] = [
  { value: 1, label: 'Urgent' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Low' },
  { value: 0, label: 'No priority' },
];

export const people = ['Ava Chen', 'Marco Ruiz', 'Priya Nair', 'Jonas Berg'];

export const statusLabel = (s: Status) => statuses.find((x) => x.value === s)?.label ?? s;
export const priorityLabel = (p: Priority) => priorities.find((x) => x.value === p)?.label ?? '';
export const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('');

export const sorts = [
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Created' },
  { value: 'priority', label: 'Priority' },
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
] as const;

export type SortKey = (typeof sorts)[number]['value'];

// Higher = earlier in a descending sort. "No priority" ranks below low.
const priorityRank = (p: Priority) => (p === 0 ? 0 : 5 - p);

export function compare(a: Issue, b: Issue, by: SortKey): number {
  switch (by) {
    case 'updated':
      return a.updatedAt - b.updatedAt;
    case 'created':
      return a.createdAt - b.createdAt;
    case 'priority':
      return priorityRank(a.priority) - priorityRank(b.priority) || a.updatedAt - b.updatedAt;
    case 'id':
      return a.id - b.id;
    case 'title':
      return b.title.localeCompare(a.title); // descending = A→Z reads naturally
  }
}

type Seed = [string, Status, Priority, string | null, string[], number];

const seedRows: Seed[] = [
  [
    'Token refresh races with resume from background',
    'progress',
    1,
    'Ava Chen',
    ['auth', 'bug'],
    0.1,
  ],
  ['Keyboard navigation in the command menu', 'todo', 2, 'Marco Ruiz', ['a11y'], 0.4],
  ['Export issues to CSV with active filters', 'review', 3, 'Priya Nair', ['feature'], 0.8],
  ['Empty-state copy for new workspaces', 'todo', 4, null, ['copy'], 1.5],
  ['Drawer flickers when resizing past breakpoint', 'progress', 2, 'Jonas Berg', ['bug', 'ui'], 2],
  ['Offline banner overlaps the footer on iOS', 'backlog', 3, null, ['bug', 'mobile'], 3],
  ['Bulk edit status from multi-select', 'backlog', 3, 'Marco Ruiz', ['feature'], 4],
  ['Upgrade build target to es2022', 'done', 4, 'Ava Chen', ['infra'], 5],
  ['Rate-limit notification digests', 'todo', 2, 'Priya Nair', ['backend'], 6],
  ['Dark mode contrast on muted labels', 'done', 3, 'Jonas Berg', ['a11y', 'ui'], 7],
  ['Crash when pasting a 10 MB image', 'review', 1, 'Ava Chen', ['bug'], 8],
  ['Saved views per teammate', 'backlog', 0, null, ['feature'], 10],
  ['Electron build: tray icon on Linux', 'backlog', 4, 'Marco Ruiz', ['desktop'], 12],
  ['Write onboarding checklist', 'done', 0, 'Priya Nair', ['docs'], 14],
];

export function seedIssues(): Issue[] {
  const now = Date.now();
  const day = 86_400_000;
  return seedRows.map(([title, status, priority, assignee, labels, daysAgo], i) => {
    const updatedAt = now - daysAgo * day;
    return {
      id: 101 + seedRows.length - i,
      title,
      description: '',
      status,
      priority,
      assignee,
      labels,
      createdAt: updatedAt - (3 + i) * day,
      updatedAt,
      activity: [{ at: updatedAt - (3 + i) * day, text: 'Created the issue' }],
    };
  });
}

export function shortDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
