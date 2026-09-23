import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register'];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith(environment.apiUrl);
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => request.url.includes(path));
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);
  const token = authService.getToken();

  if (!isApiRequest || isPublicAuthRequest) {
    return next(request);
  }

  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (request.url.endsWith('/auth/profile')) {
          return throwError(() => error);
        }
        authService.clearSession();
        notification.error('Your session has expired. Please login again.');
        void router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      } else if (error.status === 403) {
        notification.error('You do not have permission to perform this action.');
      }
      return throwError(() => error);
    }),
  );
};
