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
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard',
  },
  {
    path: 'audit-plan',
    loadComponent: () =>
      import('./pages/audit-plan/audit-plan').then((m) => m.AuditPlan),
    title: 'Audit Plan',
  },
  {
    path: 'user-management',
    loadComponent: () =>
      import('./pages/user-management/user-management').then((m) => m.UserManagement),
    title: 'User Management',
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
