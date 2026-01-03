import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Project {
    id: string;
    title: string;
    slug: string;
    description: string;
    content?: string;
    imageUrl?: string;
    demoUrl?: string;
    repoUrl?: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    displayOrder: number;
}

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
