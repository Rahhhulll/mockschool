import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/student-dashboard.component').then(({ StudentDashboardComponent }) => StudentDashboardComponent),
  },
  {
    path: 'bookings/:bookingId/feedback/view',
    loadComponent: () =>
      import('./pages/feedback-view/feedback-view.component').then(({ FeedbackViewComponent }) => FeedbackViewComponent),
  },
  {
    path: 'bookings/:bookingId/feedback',
    loadComponent: () =>
      import('./pages/feedback-form/feedback-form.component').then(({ FeedbackFormComponent }) => FeedbackFormComponent),
  },
  {
    path: 'bookings/:id',
    loadComponent: () =>
      import('./pages/booking-details/booking-details.component').then(({ BookingDetailsComponent }) => BookingDetailsComponent),
  },
  {
    path: 'bookings',
    loadComponent: () =>
      import('./pages/bookings/bookings.component').then(({ BookingsComponent }) => BookingsComponent),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
