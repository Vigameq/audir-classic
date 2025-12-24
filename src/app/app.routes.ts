import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Sign In',
  },
  {
    path: 'auditor',
    loadComponent: () => import('./pages/auditor/auditor').then((m) => m.Auditor),
    title: 'Auditor Workspace',
  },
  {
    path: 'manager',
    loadComponent: () => import('./pages/manager/manager').then((m) => m.Manager),
    title: 'Manager Workspace',
  },
  {
    path: 'super-admin',
    loadComponent: () =>
      import('./pages/super-admin/super-admin').then((m) => m.SuperAdmin),
    title: 'Super Admin Workspace',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
