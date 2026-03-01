import { Component, OnInit, inject, computed, signal, PLATFORM_ID, Inject, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
        NgApexchartsModule
    ],
    templateUrl: './showing-data.html',
    styleUrl: './showing-data.css'
})
export class ShowingDataComponent extends BaseComponent implements OnInit {
    private bookService = inject(BookService);
    private translationService = inject(TranslationService);

    currentLang = computed(() => this.translationService.currentLang());

    // ─── Client-side table state ─────────────────────────────────
    clientBooks = signal<Book[]>([]);
    clientTableLoading = signal(true);
    clientFilterValue = '';

    // Template reference for the client-side table (used for global filtering)
    @ViewChild('clientTable') clientTable!: Table; // what is this do? answer : it is used to get the reference to the client-side table

    // ─── Server-side table state ─────────────────────────────────
    serverBooks = signal<Book[]>([]);
    serverTableLoading = signal(true);
    serverTotalRecords = signal(0);
    readonly serverPageSize = 10;

    // ─── Chart state ─────────────────────────────────────────────
    chartLoading = signal(true);
    chartOptions = signal<ChartOptions | null>(null);
    private isBrowser: boolean; // what is this do? answer : it is used to check if the component is running in the browser it benefit us to prevent the error of running the code in the server

    // Skeleton placeholder rows for table loading state
    skeletonRows = Array(5).fill({});
    skeletonCols = Array(6).fill({});

    constructor(@Inject(PLATFORM_ID) platformId: Object) { // what is this do? what is platformId? answer : it is used to check if the component is running in the browser it benefit us to prevent the error of running the code in the server
        super();
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
        this.loadClientData();
        this.loadServerData({ first: 0, rows: this.serverPageSize });
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
            .pipe(takeUntil(this.destroy$)) // why this raw is important? what is destroy$?  answer : because it is used to unsubscribe from the observable when the component is destroyed
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

    /**
     * Called when the user types in the global search input.
     * Passes the value to PrimeNG's global filter method.
     */
    onClientGlobalFilter(table: any, event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        table.filterGlobal(value, 'contains');
    }

    // ═══════════════════════════════════════════════════════════════
    // Server-Side Table (Lazy Loading)
    // ═══════════════════════════════════════════════════════════════
    //
    // PrimeNG fires `onLazyLoad` with a TableLazyLoadEvent whenever
    // the user paginates, sorts, or filters. The event contains:
    //
    //   event.first      → row offset (0-based), e.g. 0, 10, 20 …
    //   event.rows       → page size, e.g. 10
    //   event.sortField  → column field name to sort by (e.g. 'title')
    //   event.sortOrder  → 1 = ascending, -1 = descending
    //   event.filters    → object map of active filters, shaped as:
    //                      { [field]: { value: string, matchMode: string } }
    //
    // We convert these into HTTP query parameters for the API:
    //
    //   PageNumber  = Math.floor(event.first / event.rows) + 1
    //   PageSize    = event.rows
    //   SortBy      = event.sortField   (if present)
    //   SortDir     = event.sortOrder === 1 ? 'asc' : 'desc'
    //   Title       = event.filters['title']?.value   (per-column filter)
    //
    // In this demo, the backend only supports PageNumber & PageSize.
    // The sorting/filtering params are shown as comments to illustrate
    // how they would be forwarded in a real application.
    // ═══════════════════════════════════════════════════════════════

    onServerLazyLoad(event: TableLazyLoadEvent): void { // what is TableLazyLoadEvent? answer : it is an event that is fired when the user paginates, sorts, or filters the table
        this.loadServerData(event);
    }

    private loadServerData(event: TableLazyLoadEvent): void {
        this.serverTableLoading.set(true);

        // Calculate 1-based page number from 0-based offset
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
    // Chart (ApexCharts — Bar chart: Views vs Downloads)
    // ═══════════════════════════════════════════════════════════════

    private buildChart(books: Book[]): void {
        if (!this.isBrowser) {
            this.chartLoading.set(false);
            return;
        }

        // Take the first 10 books for a clean, readable chart
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
                    style: {
                        fontSize: '0.75rem'
                    },
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
                y: {
                    formatter: (val: number) => `${val}`
                }
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
