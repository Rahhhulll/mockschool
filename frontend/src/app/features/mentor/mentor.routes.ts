import { Routes } from '@angular/router';

export const MENTOR_ROUTES: Routes = [
	{
		path: 'dashboard',
		loadComponent: () =>
			import('./pages/mentor-dashboard/mentor-dashboard.component').then(({ MentorDashboardComponent }) => MentorDashboardComponent),
	},
	{
		path: 'slots',
		loadComponent: () =>
			import('./pages/slots/my-slots/my-slots.component').then(({ MySlotsComponent }) => MySlotsComponent),
	},
	{
		path: 'slots/create',
		loadComponent: () =>
			import('./pages/slots/slot-form/slot-form.component').then(({ SlotFormComponent }) => SlotFormComponent),
	},
	{
		path: 'slots/:id/edit',
		loadComponent: () =>
			import('./pages/slots/slot-form/slot-form.component').then(({ SlotFormComponent }) => SlotFormComponent),
	},
	{
		path: '',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
];
