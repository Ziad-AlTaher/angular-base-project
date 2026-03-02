import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';
import { Book } from '../models/book.model';
import { ApiResponse, PaginatedData } from '../models/api-response.model';
import { IS_SILENT_LOAD } from '../context/loading.context';

@Injectable({
    providedIn: 'root'
})
export class BookService extends BaseService<Book> {

    constructor(http: HttpClient) {
        super(http, 'LibraryBook');
    }

    /**
     * Fetch paginated books from the API.
     */
    getBooks(page: number, size: number): Observable<ApiResponse<PaginatedData<Book>>> {
        const params = new HttpParams()
            .set('PageNumber', page.toString())
            .set('PageSize', size.toString());

        return this.http.get<ApiResponse<PaginatedData<Book>>>(
            `${this.apiUrl}/${this.endpoint}`,
            { params }
        );
    }

    /**
     * Fetch paginated books WITHOUT triggering the global loading spinner.
     * Use this when the component shows its own skeleton / local loader.
     */
    getBooksSilently(page: number, size: number): Observable<ApiResponse<PaginatedData<Book>>> {
        const params = new HttpParams()
            .set('PageNumber', page.toString())
            .set('PageSize', size.toString());

        return this.http.get<ApiResponse<PaginatedData<Book>>>(
            `${this.apiUrl}/${this.endpoint}`,
            {
                params,
                context: new HttpContext().set(IS_SILENT_LOAD, true)
            }
        );
    }

    // ─── Silent-context helper ────────────────────────────────────
    /**
     * Returns an HttpContext with IS_SILENT_LOAD=true so the global
     * spinner is suppressed. Used by all CRUD wrappers below.
     */
    private silentCtx() {
        return { context: new HttpContext().set(IS_SILENT_LOAD, true) };
    }

    // ─── Silent CRUD wrappers ─────────────────────────────────────

    /** Get a single book without triggering the global spinner. */
    getBookByIdSilently(id: number): Observable<ApiResponse<Book>> {
        return this.http.get<ApiResponse<Book>>(
            `${this.apiUrl}/${this.endpoint}/${id}`,
            this.silentCtx()
        );
    }

    /** Create a book without triggering the global spinner. */
    createBookSilently(book: Partial<Book>): Observable<ApiResponse<Book>> {
        return this.http.post<ApiResponse<Book>>(
            `${this.apiUrl}/${this.endpoint}`,
            book,
            this.silentCtx()
        );
    }

    /** Update a book without triggering the global spinner. */
    updateBookSilently(id: number, book: Partial<Book>): Observable<ApiResponse<Book>> {
        return this.http.put<ApiResponse<Book>>(
            `${this.apiUrl}/${this.endpoint}/${id}`,
            book,
            this.silentCtx()
        );
    }

    /** Delete a book without triggering the global spinner. */
    deleteBookSilently(id: number): Observable<ApiResponse<void>> {
        return this.http.delete<ApiResponse<void>>(
            `${this.apiUrl}/${this.endpoint}/${id}`,
            this.silentCtx()
        );
    }
}
