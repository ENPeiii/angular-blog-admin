import { Routes } from '@angular/router';
import { ROUTES_CONSTANT } from './core/constants/routes-constant';

export const routes: Routes = [
  {
    path: ROUTES_CONSTANT.HOME.base,
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard),
    title: ROUTES_CONSTANT.HOME.title,
  },
  {
    path: ROUTES_CONSTANT.INDEX.base,
    loadComponent: () => import('./pages/index/index').then(m => m.Index),
    title: ROUTES_CONSTANT.INDEX.title,
  },
  {
    path: ROUTES_CONSTANT.ABOUT.base,
    loadComponent: () => import('./pages/about/about').then(m => m.About),
    title: ROUTES_CONSTANT.ABOUT.title,
  },
  {
    path: '',
    children: [
      {
        path: ROUTES_CONSTANT.POSTS.base,
        loadComponent: () => import('./pages/articles/posts/posts').then(m => m.Posts),
        title: ROUTES_CONSTANT.POSTS.title,
      },
      {
        path: ROUTES_CONSTANT.TAGS.base,
        loadComponent: () => import('./pages/articles/tags/tags').then(m => m.Tags),
        title: ROUTES_CONSTANT.TAGS.title,
      },
      {
        path: ROUTES_CONSTANT.TOPICS.base,
        loadComponent: () => import('./pages/articles/topics/topics').then(m => m.Topics),
        title: ROUTES_CONSTANT.TOPICS.title,
      },
    ],
  },
];
