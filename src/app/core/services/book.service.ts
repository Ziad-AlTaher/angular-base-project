import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';
import { Book } from '../models/book.model';
import { ApiResponse, PaginatedData } from '../models/api-response.model';

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
}
