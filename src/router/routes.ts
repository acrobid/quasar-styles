import type { RouteRecordRaw } from 'vue-router';
import type { ThemeId } from '@/themes';

declare module 'vue-router' {
  interface RouteMeta {
    theme?: ThemeId;
  }
}

// Each app is its own lazily loaded chunk with its own q-layout and theme.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/LauncherPage.vue'),
    meta: { theme: 'launcher' },
  },
  {
    path: '/chat',
    component: () => import('@/apps/chat/ChatApp.vue'),
    meta: { theme: 'editorial' },
  },
  {
    path: '/issues',
    component: () => import('@/apps/issues/IssuesApp.vue'),
    meta: { theme: 'precision' },
  },
  {
    path: '/tracker',
    component: () => import('@/apps/tracker/TrackerApp.vue'),
    meta: { theme: 'bento' },
  },
  {
    path: '/focus',
    component: () => import('@/apps/focus/FocusApp.vue'),
    meta: { theme: 'glass' },
  },
  {
    path: '/inspect',
    component: () => import('@/apps/inspect/InspectApp.vue'),
    meta: { theme: 'industrial' },
  },

  // Always leave this as last one
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
    meta: { theme: 'launcher' },
  },
];

export default routes;
