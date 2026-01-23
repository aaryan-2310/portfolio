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
        let parsedTags: string[] = p.tags || [];
        let parsedScreenshots: string[] = typeof p.screenshots === 'object' ? p.screenshots : [];
        let parsedCaseStudy: string | object = p.caseStudy || {};

        try {
            if (p.links && typeof p.links === 'string') {
                parsedLinks = JSON.parse(p.links);
            }
        } catch (e) {
            console.error(`Failed to parse links for project ${p.id}`, e);
        }

        try {
            if (p.techStack && typeof p.techStack === 'string') {
                parsedTags = JSON.parse(p.techStack);
            }
        } catch (e) {
            console.error(`Failed to parse techStack for project ${p.id}`, e);
            parsedTags = [];
        }

        try {
            if (p.screenshots && typeof p.screenshots === 'string') {
                parsedScreenshots = JSON.parse(p.screenshots);
            }
        } catch (e) {
            console.error(`Failed to parse screenshots for project ${p.id}`, e);
            parsedScreenshots = [];
        }

        try {
            if (p.caseStudy && typeof p.caseStudy === 'string') {
                parsedCaseStudy = JSON.parse(p.caseStudy);
            }
        } catch (e) {
            console.error(`Failed to parse caseStudy for project ${p.id}`, e);
            parsedCaseStudy = {};
        }

        return {
            ...p,
            tags: parsedTags,
            links: parsedLinks,
            screenshots: parsedScreenshots,
            caseStudy: typeof parsedCaseStudy === 'string' ? parsedCaseStudy : JSON.stringify(parsedCaseStudy)
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
