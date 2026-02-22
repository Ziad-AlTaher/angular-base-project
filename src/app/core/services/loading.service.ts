import { Injectable, signal, computed } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoadingService {
    private requestCount = signal(0);

    /** True when at least one HTTP request is in flight */
    readonly isLoading = computed(() => this.requestCount() > 0);

    show(): void {
        this.requestCount.update(count => count + 1);
    }

    hide(): void {
        this.requestCount.update(count => Math.max(0, count - 1));
    }
}
