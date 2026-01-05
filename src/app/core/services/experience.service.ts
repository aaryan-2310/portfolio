import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Experience } from '../../shared/models';

// Re-export for backward compatibility
export type { Experience, ExperienceSkill } from '../../shared/models';

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
