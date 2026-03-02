import { Component, OnInit, inject, computed, signal, PLATFORM_ID, Inject, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from '../../core/base/base.component';
import { BookService } from '../../core/services/book.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Book } from '../../core/models/book.model';
import { takeUntil } from 'rxjs';

// PrimeNG
import { Table, TableModule, TableLazyLoadEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ButtonModule } from 'primeng/button';
import { MenuModule, Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuItem, MessageService, ConfirmationService } from 'primeng/api';

// ApexCharts
import { NgApexchartsModule } from 'ng-apexcharts';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexYAxis,
    ApexDataLabels,
    ApexPlotOptions,
    ApexLegend,
    ApexTooltip,
    ApexFill,
    ApexGrid,
    ApexStroke,
    ApexResponsive
} from 'ng-apexcharts';

/** Shape of the chart configuration object */
export interface ChartOptions {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    legend: ApexLegend;
    tooltip: ApexTooltip;
    fill: ApexFill;
    grid: ApexGrid;
    stroke: ApexStroke;
    responsive: ApexResponsive[];
}

@Component({
    selector: 'app-showing-data',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslatePipe,
        TableModule,
        SkeletonModule,
        ProgressSpinnerModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        ButtonModule,
        MenuModule,
        ToastModule,
        ConfirmDialogModule,
        NgApexchartsModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './showing-data.html',
    styleUrl: './showing-data.css'
})
export class ShowingDataComponent extends BaseComponent implements OnInit {
    private bookService = inject(BookService);
    private translationService = inject(TranslationService);
    private router = inject(Router);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);

    currentLang = computed(() => this.translationService.currentLang());

    // ─── Client-side table state ─────────────────────────────────
    clientBooks = signal<Book[]>([]);
    clientTableLoading = signal(true);

    @ViewChild('clientTable') clientTable!: Table;

    // ─── Server-side table state ─────────────────────────────────
    serverBooks = signal<Book[]>([]);
    // Must start as false so the p-table mounts immediately and fires (onLazyLoad).
    // If set to true, the skeleton hides the table → onLazyLoad never triggers → data never loads.
    serverTableLoading = signal(false);
    serverTotalRecords = signal(0);
    readonly serverPageSize = 10;

    // ─── Chart state ─────────────────────────────────────────────
    chartLoading = signal(true);
    chartOptions = signal<ChartOptions | null>(null);
    private isBrowser: boolean;

    // Skeleton placeholder rows for table loading state
    skeletonRows = Array(5).fill({});
    skeletonCols = Array(6).fill({});

    // ─── Actions ─────────────────────────────────────────────────
    /** The book that was right-clicked in the actions menu */
    private selectedBook = signal<Book | null>(null);

    /** Menu items built dynamically (translations must be reactive) */
    actionMenuItems = computed<MenuItem[]>(() => [
        {
            label: this.translationService.translate('showingData.actions.edit'),
            icon: 'pi pi-pencil',
            command: () => {
                const book = this.selectedBook();
                if (book) this.onEdit(book);
            }
        },
        {
            label: this.translationService.translate('showingData.actions.delete'),
            icon: 'pi pi-trash',
            styleClass: 'danger-item',
            command: () => {
                const book = this.selectedBook();
                if (book) this.onDelete(book);
            }
        },
        { separator: true },
        {
            label: this.translationService.translate('showingData.actions.add'),
            icon: 'pi pi-plus-circle',
            command: () => this.onAdd()
        }
    ]);

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        super();
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        this.loadClientData();
        // this.loadServerData({ first: 0, rows: this.serverPageSize });
        // NOTE: Do NOT call loadServerData() here.
        // PrimeNG lazy p-table fires (onLazyLoad) automatically on first render,
        // which calls onServerLazyLoad() → loadServerData(). Calling it manually
        // as well would duplicate the request on every page load.
    }

    // ═══════════════════════════════════════════════════════════════
    // Client-Side Table
    // ═══════════════════════════════════════════════════════════════
    //
    // Fetches ALL data once using getBooksSilently() (no global spinner).
    // PrimeNG p-table handles sorting & filtering entirely on the client.
    // The same dataset is also used to build the chart.
    // ═══════════════════════════════════════════════════════════════

    private loadClientData(): void {
        this.clientTableLoading.set(true);
        this.chartLoading.set(true);

        this.bookService.getBooksSilently(1, 50)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.clientBooks.set(res.data.items);
                    this.clientTableLoading.set(false);

                    // Build chart from the same dataset
                    this.buildChart(res.data.items);
                },
                error: (err) => {
                    this.handleError(err);
                    this.clientTableLoading.set(false);
                    this.chartLoading.set(false);
                }
            });
    }

    onClientGlobalFilter(table: any, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }

    // ═══════════════════════════════════════════════════════════════
    // Server-Side Table (Lazy Loading)
    // ═══════════════════════════════════════════════════════════════

    onServerLazyLoad(event: TableLazyLoadEvent): void {
        this.loadServerData(event);
    }

    private loadServerData(event: TableLazyLoadEvent): void {
        this.serverTableLoading.set(true);

        const page = Math.floor((event.first ?? 0) / (event.rows ?? this.serverPageSize)) + 1;
        const size = event.rows ?? this.serverPageSize;

        // ── Extracting sort params (for real API integration) ──
        // const sortField = event.sortField as string | undefined;
        // const sortDir   = event.sortOrder === 1 ? 'asc' : 'desc';
        //
        // ── Extracting filter params (for real API integration) ──
        // const filters = event.filters;
        // if (filters) {
        //     Object.keys(filters).forEach(field => {
        //         const filter = filters[field];
        //         if (Array.isArray(filter)) {
        //             // Multiple constraints: filter[0].value, filter[0].matchMode, etc.
        //             filter.forEach(f => {
        //                 if (f.value) {
        //                     params = params.set(field, f.value);
        //                 }
        //             });
        //         } else if (filter?.value) {
        //             // Single constraint
        //             params = params.set(field, filter.value);
        //         }
        //     });
        // }
        //
        // Example final URL: /LibraryBook?PageNumber=2&PageSize=10&SortBy=title&SortDir=asc&Title=angular

        this.bookService.getBooksSilently(page, size)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.serverBooks.set(res.data.items);
                    this.serverTotalRecords.set(res.data.totalItems);
                    this.serverTableLoading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                    this.serverTableLoading.set(false);
                }
            });
    }

    // ═══════════════════════════════════════════════════════════════
    // Actions
    // ═══════════════════════════════════════════════════════════════

    /** Opens the popup menu anchored to the event target */
    showActionsMenu(event: Event, book: Book, menu: Menu): void {
        this.selectedBook.set(book);
        menu.toggle(event);
    }

    onAdd(): void {
        this.router.navigate(['/showing-data/add']);
    }

    onEdit(book: Book): void {
        this.router.navigate(['/showing-data/edit', book.id]);
    }

    onDelete(book: Book): void {
        this.confirmationService.confirm({
            header: this.translationService.translate('showingData.actions.deleteConfirmHeader'),
            message: this.translationService.translate('showingData.actions.deleteConfirmMessage'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: this.translationService.translate('common.yes'),
            rejectLabel: this.translationService.translate('common.no'),
            acceptButtonProps: { severity: 'danger' },
            accept: () => {
                // this.bookService.deleteBookSilently(book.id)
                //     .pipe(takeUntil(this.destroy$))
                //     .subscribe({
                //         next: (res) => {
                //             if (res.isSuccess) {
                //                 this.messageService.add({
                //                     severity: 'success',
                //                     summary: this.translationService.translate('showingData.actions.deleteSuccess'),
                //                     life: 3000
                //                 });
                //                 // Refresh both tables
                //                 this.loadClientData();
                //                 this.loadServerData({ first: 0, rows: this.serverPageSize });
                //             }
                //         },
                //         error: (err) => {
                //             this.handleError(err);
                //             this.messageService.add({
                //                 severity: 'error',
                //                 summary: this.translationService.translate('showingData.actions.deleteError'),
                //                 life: 3000
                //             });
                //         }
                //     });
            }
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Chart (ApexCharts — Bar chart: Views vs Downloads)
    // ═══════════════════════════════════════════════════════════════

    private buildChart(books: Book[]): void {
        if (!this.isBrowser) {
            this.chartLoading.set(false);
            return;
        }

        const chartData = books.slice(0, 10);

        const options: ChartOptions = {
            series: [
                {
                    name: this.translationService.translate('showingData.views'),
                    data: chartData.map(b => b.viewCount)
                },
                {
                    name: this.translationService.translate('showingData.downloads'),
                    data: chartData.map(b => b.downloadCount * 10)
                }
            ],
            chart: {
                type: 'bar',
                height: 400,
                fontFamily: 'inherit',
                toolbar: { show: true },
                background: 'transparent'
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '55%',
                    borderRadius: 6,
                    borderRadiusApplication: 'end'
                }
            },
            dataLabels: { enabled: false },
            stroke: { show: true, width: 2, colors: ['transparent'] },
            xaxis: {
                categories: chartData.map(b => b.title.length > 15 ? b.title.substring(0, 15) + '…' : b.title),
                labels: {
                    style: { fontSize: '0.75rem' },
                    rotate: -45,
                    rotateAlways: false
                }
            },
            yaxis: {
                title: {
                    text: this.translationService.translate('showingData.chartYAxis')
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'light',
                    type: 'vertical',
                    shadeIntensity: 0.3,
                    opacityFrom: 0.9,
                    opacityTo: 0.7,
                    stops: [0, 100]
                }
            },
            tooltip: {
                y: { formatter: (val: number) => `${val}` }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'center'
            },
            grid: {
                borderColor: 'var(--bg-tertiary)',
                strokeDashArray: 4
            },
            responsive: [
                {
                    breakpoint: 768,
                    options: {
                        chart: { height: 300 },
                        xaxis: {
                            labels: {
                                rotate: -30,
                                style: { fontSize: '0.625rem' }
                            }
                        }
                    }
                }
            ]
        };

        this.chartOptions.set(options);
        this.chartLoading.set(false);
    }

    /**
     * Returns category name based on current language.
     */
    getCategoryName(book: Book): string {
        return this.currentLang() === 'ar' ? book.categoryNameAr : book.categoryNameEn;
    }
}
