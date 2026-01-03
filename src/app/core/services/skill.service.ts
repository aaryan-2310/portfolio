import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Skill {
    id: string;
    name: string;
    category: string;
    icon?: string; // Material icon name or URL for custom icons
    isCustomIcon?: boolean;
    proficiency: number;
    displayOrder: number;
}

@Injectable({
    providedIn: 'root'
})
export class SkillService {
    constructor(private api: ApiService) { }

    getAll(): Observable<Skill[]> {
        return this.api.get<Skill[]>('/skills');
    }
}
