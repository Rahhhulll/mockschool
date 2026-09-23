import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { authInterceptor } from '../interceptors/auth.interceptor';

export const provideMockSchoolMaterialFoundation = () => [
  provideHttpClient(withInterceptors([authInterceptor])),
  provideAnimationsAsync(),
];
