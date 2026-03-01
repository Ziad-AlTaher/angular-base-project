import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that checks if the user is authenticated.
 * If not logged in, redirects to /auth with a `returnUrl` query param
 * so the login page can navigate back after successful authentication.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isLoggedIn()) {
        return true;
    }

    // Redirect to login, preserving the intended destination
    return router.createUrlTree(['/auth'], {
        queryParams: { returnUrl: state.url }
    });
};
