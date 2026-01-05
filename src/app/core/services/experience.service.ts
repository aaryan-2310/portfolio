import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface ExperienceSkill {
    id: string;
    name: string;
    icon?: string;
    isCustomIcon?: boolean;
    category?: string;
    displayOrder?: number;
}

export interface Experience {
    id: string;
    company: string;
    logoUrl?: string;
    role: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    description: string[]; // Bullet points
    skills: ExperienceSkill[];
    displayOrder: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExperienceService {
    constructor(private api: ApiService) { }

    getAll(): Observable<Experience[]> {
        return this.api.get<Experience[]>('/experiences').pipe(
            map(experiences => experiences.map(exp => ({
                ...exp,
                // Parse description from JSON string to array if needed
                description: typeof exp.description === 'string'
                    ? JSON.parse(exp.description)
                    : exp.description
            })))
        );
    }
}
