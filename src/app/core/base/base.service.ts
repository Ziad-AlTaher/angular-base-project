import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable()
export abstract class BaseService<T> {
    protected apiUrl = environment.apiUrl;

    constructor(
        protected http: HttpClient,
        @Inject(String) protected endpoint: string
    ) { }

    getAll(): Observable<T[]> {
        return this.http.get<T[]>(`${this.apiUrl}/${this.endpoint}`);
    }

    // we should select which type of ids we will use 

    getById(id: string | number): Observable<T> {
        return this.http.get<T>(`${this.apiUrl}/${this.endpoint}/${id}`);
    }

    create(item: T): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}/${this.endpoint}`, item);
    }

    update(id: string | number, item: T): Observable<T> {
        return this.http.put<T>(`${this.apiUrl}/${this.endpoint}/${id}`, item);
    }

    delete(id: string | number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${this.endpoint}/${id}`);
    }
}
