import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

/**
 * Mock Authentication Service.
 *
 * Simulates API calls using mock data with a realistic delay.
 * Stores the current user session in localStorage for persistence.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSignal = signal<User | null>(null);

    /** Read-only signal of the current user */
    currentUser = this.currentUserSignal.asReadonly();

    /** Computed flag: true when a user is logged in */
    isLoggedIn = computed(() => !!this.currentUserSignal());

    /** Mock user database */
    private mockUsers: { user: User; password: string }[] = [
        {
            user: { id: 1, fullName: 'Ahmed Hassan', email: 'ahmed@example.com' },
            password: '123456'
        },
        {
            user: { id: 2, fullName: 'Sara Ali', email: 'sara@example.com' },
            password: '123456'
        },
        {
            user: { id: 3, fullName: 'Omar Khaled', email: 'omar@example.com' },
            password: '123456'
        }
    ];

    private nextId = 4;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.restoreSession();
    }

    /**
     * Simulate login API call.
     * Matches email & password against mock data.
     */
    login(req: LoginRequest): Observable<User> {
        const found = this.mockUsers.find(
            (u) => u.user.email === req.email && u.password === req.password
        );

        if (found) {
            this.setSession(found.user);
            return of(found.user).pipe(delay(800));
        }

        return throwError(() => new Error('INVALID_CREDENTIALS')).pipe(delay(800));
    }

    /**
     * Simulate register API call.
     * Checks for duplicate email, then adds to mock array.
     */
    register(req: RegisterRequest): Observable<User> {
        const exists = this.mockUsers.some((u) => u.user.email === req.email);

        if (exists) {
            return throwError(() => new Error('EMAIL_EXISTS')).pipe(delay(800));
        }

        const newUser: User = {
            id: this.nextId++,
            fullName: req.fullName,
            email: req.email
        };

        this.mockUsers.push({ user: newUser, password: req.password });
        this.setSession(newUser);

        return of(newUser).pipe(delay(800));
    }

    /** Clear session and log out */
    logout(): void {
        this.currentUserSignal.set(null);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('currentUser');
        }
    }

    /** Persist user to localStorage and update signal */
    private setSession(user: User): void {
        this.currentUserSignal.set(user);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }

    /** Restore session from localStorage on app init */
    private restoreSession(): void {
        if (isPlatformBrowser(this.platformId)) {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
                try {
                    this.currentUserSignal.set(JSON.parse(saved));
                } catch {
                    localStorage.removeItem('currentUser');
                }
            }
        }
    }
}
