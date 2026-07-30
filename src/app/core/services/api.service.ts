import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GlobalErrorService } from '../error/global-error.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    // Use environment-specific URL
    private readonly BASE_URL = environment.apiUrl;

    constructor(private http: HttpClient, private errorService: GlobalErrorService) { }

    get<T>(path: string, params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<T> {
        return this.http.get<T>(`${this.BASE_URL}${path}`, { params }).pipe(
            catchError(err => this.handleError(err, path))
        );
    }

    post<T>(path: string, body: unknown): Observable<T> {
        return this.http.post<T>(`${this.BASE_URL}${path}`, body).pipe(
            catchError(err => this.handleError(err, path))
        );
    }

    private handleError(error: unknown, path: string): Observable<never> {
        console.error(`API request failed: ${path}`, error);
        this.errorService.report("We couldn't load some data. Please refresh or try again shortly.");
        return throwError(() => error);
    }
}
