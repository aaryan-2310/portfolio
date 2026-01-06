import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ContactSubmission, SocialLink } from '../../shared/models';

// Re-export for backward compatibility
export type { ContactSubmission, SocialLink } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class ContactService {
    constructor(private api: ApiService) { }

    submitContact(data: ContactSubmission): Observable<void> {
        return this.api.post<void>('/contact', data);
    }

    getSocialLinks(): Observable<SocialLink[]> {
        return this.api.get<SocialLink[]>('/social-links');
    }
}
