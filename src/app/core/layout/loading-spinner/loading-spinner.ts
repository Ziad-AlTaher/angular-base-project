import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '../../services/loading.service';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule],
    template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <p-progressSpinner
          strokeWidth="4"
          ariaLabel="loading">
        </p-progressSpinner>
      </div>
    }
  `,
    styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
  `]
})
export class LoadingSpinnerComponent {
    loadingService = inject(LoadingService);
}
