import { Routes } from '@angular/router';

export const MENTOR_ROUTES: Routes = [
	{
		path: 'dashboard',
		loadComponent: () =>
			import('./pages/mentor-dashboard/mentor-dashboard.component').then(({ MentorDashboardComponent }) => MentorDashboardComponent),
	},
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
];
