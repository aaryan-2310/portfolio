import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Project } from '../../shared/models';

// Re-export for backward compatibility
export type { Project } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    constructor(private api: ApiService) { }

    getAll(): Observable<Project[]> {
        return this.api.get<Project[]>('/projects');
    }

    // Helper to filter featured on client side for now, 
    // or add ?featured=true endpoint later
    getFeatured(): Observable<Project[]> {
        return this.getAll();
    }
}
