import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AiChatRequest {
    message: string;
    conversationId?: string;
}

export interface AiChatResponse {
    message: string;
    conversationId: string;
    suggestions: string[];
    error: boolean;
    errorMessage?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AiService {
    private readonly baseUrl = `${environment.apiUrl}/ai`;

    constructor(private http: HttpClient) { }

    /**
     * Send a chat message to the AI
     */
    chat(request: AiChatRequest): Observable<AiChatResponse> {
        return this.http.post<AiChatResponse>(`${this.baseUrl}/chat`, request).pipe(
            catchError(error => {
                console.error('AI chat error:', error);
                return of({
                    message: '',
                    conversationId: '',
                    suggestions: [],
                    error: true,
                    errorMessage: 'Unable to connect to AI service. Please try again later.'
                });
            })
        );
    }

    /**
     * Get suggested prompts for first-time visitors
     */
    getSuggestions(): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/suggestions`).pipe(
            catchError(() => of([
                'What technologies do you work with?',
                'Tell me about your projects',
                'What\'s your availability?'
            ]))
        );
    }
}
