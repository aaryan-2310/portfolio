import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    location?: string;
    description: string[]; // Bullet points
    skills: { id: string; name: string }[];
    displayOrder: number;
}

@Injectable({
    providedIn: 'root'
})
export class ExperienceService {
    constructor(private api: ApiService) { }

    getAll(): Observable<Experience[]> {
        return this.api.get<Experience[]>('/experiences');
    }
}
