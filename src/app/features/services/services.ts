import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent } from '../../core/base/base.component';
import { BookService } from '../../core/services/book.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card';

import { ServiceCard, mapBookToCard } from '../../core/models/service-card.model';
import { takeUntil } from 'rxjs';

// PrimeNG
import { CarouselModule } from 'primeng/carousel';
import { PaginatorModule } from 'primeng/paginator';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [
        CommonModule,
        TranslatePipe,
        ServiceCardComponent,
        CarouselModule,
        PaginatorModule,
        DialogModule,
        ButtonModule,
        SkeletonModule
    ],
    templateUrl: './services.html',
    styleUrl: './services.css'
})
export class ServicesComponent extends BaseComponent implements OnInit {
    private bookService = inject(BookService);
    private translationService = inject(TranslationService);

    // Current language
    currentLang = computed(() => this.translationService.currentLang());

    // Section 1 — Carousel with infinite loading
    carouselCards = signal<ServiceCard[]>([]);
    carouselPage = 1;
    carouselLoading = signal(false);
    carouselHasMore = signal(true);
    private readonly carouselPageSize = 8;

    // Carousel responsive options
    carouselResponsiveOptions = [
        { breakpoint: '1400px', numVisible: 4, numScroll: 1 },
        { breakpoint: '1024px', numVisible: 3, numScroll: 1 },
        { breakpoint: '768px', numVisible: 2, numScroll: 1 },
        { breakpoint: '560px', numVisible: 1, numScroll: 1 }
    ];

    // Section 2 — Paginated grid
    gridCards = signal<ServiceCard[]>([]);
    gridTotalRecords = signal(0);
    gridPage = signal(0);
    gridLoading = signal(false);
    private readonly gridPageSize = 6;

    // Section 3 — Full-width slider with modal
    galleryCards = signal<ServiceCard[]>([]);
    galleryLoading = signal(false);

    // Detail dialog
    dialogVisible = signal(false);
    selectedCard = signal<ServiceCard | null>(null);

    // Track function for *ngFor / carousel performance
    trackByCardId = (_index: number, card: ServiceCard): number => card.id;

    ngOnInit(): void {
        this.loadCarouselData();
        this.loadGridData(1);
        this.loadGalleryData();
    }

    // ─── Section 1: Carousel infinite loading ───

    loadCarouselData(): void {
        if (this.carouselLoading() || !this.carouselHasMore()) return;
        this.carouselLoading.set(true);

        this.bookService.getBooks(this.carouselPage, this.carouselPageSize)
            .pipe(takeUntil(this.destroy$)) // اشرح دا 
            .subscribe({
                next: (res) => {
                    const lang = this.currentLang();
                    const newCards = res.data.items.map(b => mapBookToCard(b, lang)); // اشرح دا 
                    this.carouselCards.update(prev => [...prev, ...newCards]);// اشرح دا 

                    // Check if more pages remain
                    this.carouselHasMore.set(res.data.nextPage);
                    this.carouselPage++;
                    this.carouselLoading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                    this.carouselLoading.set(false);
                }
            });
    }

    onCarouselPage(event: any): void {
        // When user reaches near the end, load more
        const page = event.page ?? 0;
        const totalPages = Math.ceil(this.carouselCards().length / 1);
        if (page >= totalPages - 2 && this.carouselHasMore() && !this.carouselLoading()) {
            this.loadCarouselData();
        }
    }

    // ─── Section 2: Grid with numbered pagination ───

    loadGridData(page: number): void {
        this.gridLoading.set(true);

        this.bookService.getBooks(page, this.gridPageSize)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const lang = this.currentLang();
                    this.gridCards.set(res.data.items.map(b => mapBookToCard(b, lang)));
                    this.gridTotalRecords.set(res.data.totalItems);
                    this.gridLoading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                    this.gridLoading.set(false);
                }
            });
    }

    onGridPageChange(event: any): void {
        const page = Math.floor(event.first / this.gridPageSize) + 1;
        this.gridPage.set(event.first);// اشرح دي بتاعت ايه 
        this.loadGridData(page);
    }

    // ─── Section 3: Gallery slider ───

    loadGalleryData(): void {
        this.galleryLoading.set(true);

        this.bookService.getBooks(1, 6)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const lang = this.currentLang();
                    this.galleryCards.set(res.data.items.map(b => mapBookToCard(b, lang)));
                    this.galleryLoading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                    this.galleryLoading.set(false);
                }
            });
    }

    // ─── Detail dialog ───

    openDetail(card: ServiceCard): void {
        this.selectedCard.set(card);
        this.dialogVisible.set(true);
    }

    onNavigateToService(card: ServiceCard): void {
        // Navigate to service detail page (future implementation)
        // For now, open detail dialog
        this.openDetail(card);
    }
}
