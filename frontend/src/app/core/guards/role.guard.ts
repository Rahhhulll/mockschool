import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { UserRole } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data['requiredRole'] as UserRole | undefined;

  return requiredRole && authService.getCurrentRole() !== requiredRole
    ? router.createUrlTree(['/403'])
    : true;
};
