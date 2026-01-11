import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap, map } from 'rxjs';
import { ProjectService } from '../../core/services/project.service';
import { Project, CaseStudy } from '../../shared/models/project.model';
import { ButtonComponent } from '../../shared/button/button.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

@Component({
    selector: 'portfolio-project-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent],
    templateUrl: './project-detail.component.html',
    styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
    project$: Observable<Project | null>;
    caseStudy$: Observable<CaseStudy | null>;
    isScrolled = false;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        this.isScrolled = window.scrollY > 50;
    }

    constructor(
        private route: ActivatedRoute,
        private projectService: ProjectService
    ) {
        this.project$ = this.route.paramMap.pipe(
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) return [null];
                return this.projectService.getBySlug(slug);
            })
        );

        this.caseStudy$ = this.project$.pipe(
            map(project => {
                if (!project || !project.caseStudy) return null;
                try {
                    return JSON.parse(project.caseStudy) as CaseStudy;
                } catch (e) {
                    console.error('Failed to parse case study JSON', e);
                    return null;
                }
            })
        );
    }

    ngOnInit(): void {
        // Scroll to top on navigation
        window.scrollTo(0, 0);
    }

    getLiveLink(project: Project): string | undefined {
        return project.links?.find(l => l.kind === 'live')?.href;
    }

    getRepoLink(project: Project): string | undefined {
        return project.links?.find(l => l.kind === 'repo')?.href;
    }
}
