import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';


export type Language = 'ar' | 'en';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private http = inject(HttpClient);
    private platformId = inject(PLATFORM_ID);

    currentLang = signal<Language>('ar');
    translations = signal<any>({});

    constructor() {
        this.initLanguage();
    }

    private initLanguage(): void {
        if (isPlatformBrowser(this.platformId)) {
            const savedLang = localStorage.getItem('lang') as Language;
            const lang = savedLang || 'ar';
            this.setLanguage(lang);
        } else {
            // On server, just load default language
            this.loadTranslations('ar');
        }
    }

    setLanguage(lang: Language): void {
        this.currentLang.set(lang);
        this.loadTranslations(lang);

        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('lang', lang);
            this.updateDirection(lang);
        }
    }

    translate(key: string): string {
        const parts = key.split('.');
        let result: any = this.translations();
        for (const part of parts) {
            result = result?.[part];
            if (result === undefined) return key;
        }
        return typeof result === 'string' ? result : key;
    }

    toggleLanguage(): void {
        const newLang: Language = this.currentLang() === 'ar' ? 'en' : 'ar';
        this.setLanguage(newLang);
    }

    private loadTranslations(lang: Language): void {
        if (isPlatformBrowser(this.platformId)) {
            this.http.get(`../../../../public/i18n/${lang}.json`).subscribe({
                next: (data) => this.translations.set(data),
                error: (err) => console.error('Failed to load translations:', err)
            });
        }
    }

    private updateDirection(lang: Language): void {
        const htmlElement = document.documentElement;
        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        htmlElement.setAttribute('dir', dir);
        htmlElement.setAttribute('lang', lang);
    }
}
