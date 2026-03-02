import { Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseService } from '../base/base.service';
import { Category } from '../models/category.model';
import { ApiResponse, PaginatedData } from '../models/api-response.model';
import { IS_SILENT_LOAD } from '../context/loading.context';

@Injectable({
    providedIn: 'root'
})
export class CategoryService extends BaseService<Category> {

    constructor(http: HttpClient) {
        super(http, 'category');
    }

    /**
     * Fetch all categories WITHOUT triggering the global loading spinner.
     */
    getCategoriesSilently(): Observable<ApiResponse<PaginatedData<Category>>> {
        const params = new HttpParams()
            .set('PageNumber', '1')
            .set('PageSize', '100');

        return this.http.get<ApiResponse<PaginatedData<Category>>>(
            `${this.apiUrl}/${this.endpoint}/library`,
            {
                params,
                context: new HttpContext().set(IS_SILENT_LOAD, true)
            }
        );
    }
}
