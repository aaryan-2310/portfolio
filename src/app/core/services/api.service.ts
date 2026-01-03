import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    // Use relative URL so proxy works in dev and absolute URL works in prod
    private readonly BASE_URL = '/api/public';

    constructor(private http: HttpClient) { }

    get<T>(path: string, params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<T> {
        return this.http.get<T>(`${this.BASE_URL}${path}`, { params });
    }

    post<T>(path: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.BASE_URL}${path}`, body);
    }
}
