import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SkillService } from './skill.service';
import { Skill, ServiceOffering } from '../../shared/models';

// Re-export for backward compatibility
export type { ServiceOffering } from '../../shared/models';

// Mapping of skill categories to service offerings
const CATEGORY_CONFIG: Record<string, { title: string; description: string; icon: string }> = {
    frontend: {
        title: 'Frontend Development',
        description: 'Responsive, accessible UIs with Angular, React, and modern CSS.',
        icon: 'web'
    },
    backend: {
        title: 'Backend Development',
        description: 'Scalable APIs and microservices with Java, Spring Boot, and Node.js.',
        icon: 'dns'
    },
    devops: {
        title: 'Full Product Delivery',
        description: 'From concept to production — CI/CD, testing, and deployment.',
        icon: 'rocket_launch'
    },
    tools: {
        title: 'Developer Tools',
        description: 'Modern tooling for efficient development workflows.',
        icon: 'build'
    }
};

@Injectable({
    providedIn: 'root'
})
export class ServiceOfferingService {
    constructor(private skillService: SkillService) { }

    getServices(): Observable<ServiceOffering[]> {
        return this.skillService.getAll().pipe(
            map(skills => this.groupByCategory(skills))
        );
    }

    private groupByCategory(skills: Skill[]): ServiceOffering[] {
        const grouped = skills.reduce((acc, skill) => {
            const category = skill.category?.toLowerCase() || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(skill.name);
            return acc;
        }, {} as Record<string, string[]>);

        return Object.entries(grouped)
            .filter(([category]) => CATEGORY_CONFIG[category])
            .map(([category, skillNames]) => ({
                ...CATEGORY_CONFIG[category],
                tags: skillNames.slice(0, 3) // Show top 3 skills as tags
            }));
    }
}
