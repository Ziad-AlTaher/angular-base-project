import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    template: ''
})
export abstract class BaseComponent implements OnDestroy {
    protected destroy$ = new Subject<void>();
    isLoading = false;
    error: string | null = null;

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    protected handleError(error: any): void {
        console.error('An error occurred:', error);
        this.error = error.message || 'An error occurred';
        this.isLoading = false;
    }
}
