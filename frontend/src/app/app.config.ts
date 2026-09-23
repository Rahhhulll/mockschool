import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideMockSchoolMaterialFoundation } from './core/material/material.providers';
import { AuthService } from './core/services/auth.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    ...provideMockSchoolMaterialFoundation(),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ]
};
