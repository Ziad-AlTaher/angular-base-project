import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional route guard that checks if the user is authenticated.
 * If not logged in, redirects to /auth with a `returnUrl` query param
 * so the login page can navigate back after successful authentication.
 *
 * SSR NOTE: On the server there is no localStorage, so `isLoggedIn()` is
 * always false during the initial SSR render. To avoid a spurious redirect
 * on every full-page reload, the guard allows all navigation when running
 * server-side. The real check only runs in the browser, where
 * `restoreSession()` has already read the token from localStorage.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const platformId = inject(PLATFORM_ID);
    const authService = inject(AuthService);
    const router = inject(Router);

    // Server-side render: no localStorage available yet — let the route render.
    // The browser will re-run the guard after hydration with the real auth state.
    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    if (authService.isLoggedIn()) {
        return true;
    }

    // Redirect to login, preserving the intended destination
    return router.createUrlTree(['/auth'], {
        queryParams: { returnUrl: state.url }
    });
};
