import { Component, OnInit, inject, signal, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent } from '../../core/base/base.component';
import { BookService } from '../../core/services/book.service';
import { CategoryService } from '../../core/services/category.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../core/pipes/translate.pipe';
import { Category } from '../../core/models/category.model';
import { takeUntil } from 'rxjs';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
    selector: 'app-book-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslatePipe,
        InputTextModule,
        TextareaModule,
        SelectModule,
        CheckboxModule,
        ButtonModule,
        ProgressSpinnerModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './book-form.html',
    styleUrl: './book-form.css'
})
export class BookFormComponent extends BaseComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private bookService = inject(BookService);
    private categoryService = inject(CategoryService);
    private translationService = inject(TranslationService);
    private messageService = inject(MessageService);

    currentLang = this.translationService.currentLang;

    // ─── State ────────────────────────────────────────────────────
    isEditMode = signal(false);
    editBookId = signal<number | null>(null);
    pageLoading = signal(true);
    submitting = signal(false);
    categories = signal<Category[]>([]);

    // ─── Form ─────────────────────────────────────────────────────
    form!: FormGroup;

    /** Category options shaped for p-select */
    get categoryOptions() {
        return this.categories().map(c => ({
            label: this.currentLang() === 'ar' ? c.titleAr : c.titleEn,
            value: c.id
        }));
    }

    ngOnInit(): void {
        this.buildForm();
        this.loadCategories();

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            const id = Number(idParam);
            this.isEditMode.set(true);
            this.editBookId.set(id);
            this.loadBookForEdit(id);
        } else {
            this.pageLoading.set(false);
        }
    }

    // ─── Form Builder ─────────────────────────────────────────────

    private buildForm(): void {
        this.form = this.fb.group({
            title: ['', [Validators.required, Validators.maxLength(500)]],
            author: ['', [Validators.required, Validators.maxLength(300)]],
            translator: ['', [Validators.maxLength(300)]],
            publisher: ['', [Validators.maxLength(300)]],
            categoryId: [null, Validators.required],
            sourceLang: ['', [Validators.maxLength(50)]],
            targetLang: ['', [Validators.maxLength(50)]],
            description: [''],
            imageUrl: ['', [Validators.maxLength(1000)]],
            downloadLink: ['', [Validators.maxLength(1000)]],
            outSource: [false]
        });
    }

    // ─── Data Loading ─────────────────────────────────────────────

    private loadCategories(): void {
        this.categoryService.getCategoriesSilently()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess) {
                        // Only categories valid for the library section
                        this.categories.set(res.data.items.filter(c => c.isValidForLibrary));
                    }
                },
                error: (err) => this.handleError(err)
            });
    }

    private loadBookForEdit(id: number): void {
        this.pageLoading.set(true);
        this.bookService.getBookByIdSilently(id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    if (res.isSuccess && res.data) {
                        this.form.patchValue({
                            title: res.data.title,
                            author: res.data.author,
                            translator: res.data.translator,
                            publisher: res.data.publisher,
                            categoryId: res.data.categoryId,
                            sourceLang: res.data.sourceLang,
                            targetLang: res.data.targetLang,
                            description: res.data.description,
                            imageUrl: res.data.imageUrl,
                            downloadLink: res.data.downloadLink,
                            outSource: res.data.outSource
                        });
                    }
                    this.pageLoading.set(false);
                },
                error: (err) => {
                    this.handleError(err);
                    this.pageLoading.set(false);
                }
            });
    }

    // ─── Actions ─────────────────────────────────────────────────

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting.set(true);
        const formValue = this.form.getRawValue();

        if (this.isEditMode() && this.editBookId()) {
            this.bookService.updateBookSilently(this.editBookId()!, formValue)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (res) => {
                        this.submitting.set(false);
                        this.messageService.add({
                            severity: res.isSuccess ? 'success' : 'error',
                            summary: this.translationService.translate(
                                res.isSuccess ? 'bookForm.updateSuccess' : 'bookForm.updateError'
                            ),
                            life: 2500
                        });
                        if (res.isSuccess) {
                            setTimeout(() => this.router.navigate(['/showing-data']), 1500);
                        }
                    },
                    error: (err) => { this.handleError(err); this.submitting.set(false); }
                });
        } else {
            this.bookService.createBookSilently(formValue)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (res) => {
                        this.submitting.set(false);
                        this.messageService.add({
                            severity: res.isSuccess ? 'success' : 'error',
                            summary: this.translationService.translate(
                                res.isSuccess ? 'bookForm.createSuccess' : 'bookForm.createError'
                            ),
                            life: 2500
                        });
                        if (res.isSuccess) {
                            setTimeout(() => this.router.navigate(['/showing-data']), 1500);
                        }
                    },
                    error: (err) => { this.handleError(err); this.submitting.set(false); }
                });
        }
    }

    onCancel(): void {
        this.router.navigate(['/showing-data']);
    }

    hasError(name: string, errorKey: string): boolean {
        const ctrl = this.form.get(name);
        return !!(ctrl && ctrl.touched && ctrl.hasError(errorKey));
    }
}
