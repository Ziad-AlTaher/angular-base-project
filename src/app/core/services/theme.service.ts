import { Injectable, signal, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service to manage application theme (Light/Dark).
 *
 * @description
 * `providedIn: 'root'` registers this service as a singleton in the root injector.
 * This ensures that the same instance of ThemeService is shared across the entire application,
 * maintaining the theme state globally.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
    private currentTheme = signal<'light' | 'dark'>('light');

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
            if (savedTheme) {
                this.setTheme(savedTheme);
            }
        }
    }

    toggleTheme(): void {
        const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    private setTheme(theme: 'light' | 'dark'): void {
        this.currentTheme.set(theme);
        if (isPlatformBrowser(this.platformId)) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        }
    }

    get theme() {
        return this.currentTheme.asReadonly();
    }
}
