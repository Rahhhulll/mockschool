import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./pages/home/home.routes').then(({ HOME_ROUTES }) => HOME_ROUTES),
  },
  {
    path: 'mentors',
    loadComponent: () =>
      import('./pages/mentors/mentors.component').then(({ MentorsComponent }) => MentorsComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(({ LoginComponent }) => LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(({ RegisterComponent }) => RegisterComponent),
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { requiredRole: 'student' },
    loadChildren: () =>
      import('./features/student/student.routes').then(({ STUDENT_ROUTES }) => STUDENT_ROUTES),
  },
  {
    path: 'mentor',
    canActivate: [authGuard, roleGuard],
    data: { requiredRole: 'mentor' },
    loadChildren: () =>
      import('./features/mentor/mentor.routes').then(({ MENTOR_ROUTES }) => MENTOR_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { requiredRole: 'admin' },
    loadChildren: () =>
      import('./features/admin/admin.routes').then(({ ADMIN_ROUTES }) => ADMIN_ROUTES),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then(({ UnauthorizedComponent }) => UnauthorizedComponent),
  },
  {
    path: '404',
    loadChildren: () =>
      import('./pages/not-found/not-found.routes').then(({ NOT_FOUND_ROUTES }) => NOT_FOUND_ROUTES),
  },
  {
    path: '**',
    redirectTo: '404',
  },
];
