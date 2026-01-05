import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Skill } from '../../shared/models';

// Re-export for backward compatibility
export type { Skill } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class SkillService {
    constructor(private api: ApiService) { }

    getAll(): Observable<Skill[]> {
        return this.api.get<Skill[]>('/skills');
    }
}
