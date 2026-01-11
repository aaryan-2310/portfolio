import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Project } from '../../shared/models';

// Re-export for backward compatibility
export type { Project } from '../../shared/models';

interface ProjectDTO {
    id: string;
    title: string;
    slug: string;
    description: string;
    techStack?: string | string[];
    tags?: string[];
    imageUrl?: string;
    links?: string | Array<{ label: string; href: string; kind: 'repo' | 'live' }>;
    caseStudy?: string | object;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    featured: boolean;
    gradient?: string;
    screenshots?: string[] | string;
    displayOrder: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    constructor(private api: ApiService) { }

    private mapProject(p: ProjectDTO): Project {
        let parsedLinks: Project['links'] = [];
        if (p.links) {
            try {
                parsedLinks = typeof p.links === 'string' ? JSON.parse(p.links) : p.links;
            } catch (e) {
                console.error('Failed to parse links', e);
            }
        }

        return {
            ...p,
            // Map techStack (backend) to tags (frontend)
            tags: typeof p.techStack === 'string' ? JSON.parse(p.techStack) : (p.tags || []),
            // Pre-parsed links
            links: parsedLinks,
            // Parse screenshots if it's a string
            screenshots: typeof p.screenshots === 'string' ? JSON.parse(p.screenshots) : (p.screenshots || []),
            // Ensure case study is stringified for components that parse it themselves
            caseStudy: typeof p.caseStudy === 'string' ? p.caseStudy : JSON.stringify(p.caseStudy)
        } as Project;
    }

    getAll(): Observable<Project[]> {
        return this.api.get<ProjectDTO[]>('/projects').pipe(
            map(projects => projects.map(p => this.mapProject(p)))
        );
    }

    getBySlug(slug: string): Observable<Project> {
        return this.api.get<ProjectDTO>(`/projects/${slug}`).pipe(
            map(p => this.mapProject(p))
        );
    }

    getFeatured(): Observable<Project[]> {
        return this.getAll().pipe(
            map(projects => projects.filter(p => p.featured))
        );
    }
}
