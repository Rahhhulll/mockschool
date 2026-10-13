import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard.component').then(({ AdminDashboardComponent }) => AdminDashboardComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/users/users.component').then(({ UsersComponent }) => UsersComponent),
  },
  {
    path: 'mentors',
    loadComponent: () =>
      import('./pages/mentors/mentors.component').then(({ MentorsComponent }) => MentorsComponent),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./pages/bookings/bookings.component').then(({ BookingsComponent }) => BookingsComponent),
  },
  {
    path: 'feedback',
    loadComponent: () =>
      import('./pages/feedback/feedback.component').then(({ FeedbackComponent }) => FeedbackComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
