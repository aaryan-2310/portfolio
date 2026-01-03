import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ContactSubmission {
    name: string;
    email: string;
    subject?: string;
    message: string;
}

export interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon?: string;
    isVisible: boolean;
    displayOrder: number;
}

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
