import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError, delay } from 'rxjs';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

/** localStorage keys */
const USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

/**
 * Mock Authentication Service.
 *
 * Simulates API calls using mock data with a realistic delay.
 * Stores the current user AND a dummy token in localStorage for persistence.
 * isLoggedIn is derived from the token presence — if a token exists, the user is authenticated.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
    private currentUserSignal = signal<User | null>(null);
    private tokenSignal = signal<string | null>(null);

    /** Read-only signal of the current user */
    currentUser = this.currentUserSignal.asReadonly();

    /** Computed flag: true when an auth token exists in the session */
    isLoggedIn = computed(() => !!this.tokenSignal());

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
        this.tokenSignal.set(null);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    /** Get the stored token (useful for auth interceptors) */
    getToken(): string | null {
        return this.tokenSignal();
    }

    // ─── Private helpers ─────────────────────────────────────────

    /** Persist user + dummy token to localStorage and update signals */
    private setSession(user: User): void {
        const token = this.generateDummyToken(user);
        this.currentUserSignal.set(user);
        this.tokenSignal.set(token);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            localStorage.setItem(TOKEN_KEY, token);
        }
    }

    /** Restore user + token from localStorage on app init */
    private restoreSession(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken && savedUser) {
            try {
                this.currentUserSignal.set(JSON.parse(savedUser));
                this.tokenSignal.set(savedToken);
            } catch {
                // Corrupted storage — wipe both keys
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(TOKEN_KEY);
            }
        }
    }

    /**
     * Generates a dummy JWT-shaped token for the mock session.
     * Format: base64(header).base64(payload).dummySignature
     *
     * In a real app this token would come from the server.
     */
    private generateDummyToken(user: User): string {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            sub: user.id,
            email: user.email,
            name: user.fullName,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24 h
        }));
        const signature = 'dummy_signature';
        return `${header}.${payload}.${signature}`;
    }
}

