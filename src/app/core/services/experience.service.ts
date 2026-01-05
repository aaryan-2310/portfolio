import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Skill {
    id: string;
    name: string;
    icon?: string;
    isCustomIcon?: boolean;
    category: string;
    displayOrder: number;
}

export interface Experience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    logoUrl?: string;
    description: string; // JSON string array from backend
    skills: Skill[];
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
