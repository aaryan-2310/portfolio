import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Observable, switchMap, map, shareReplay, take } from 'rxjs';
import { ProjectService } from '../../core/services/project.service';
import { Project, CaseStudy } from '../../shared/models/project.model';
import { ButtonComponent } from '../../shared/button/button.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
    selector: 'portfolio-project-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent, LoaderComponent],
    templateUrl: './project-detail.component.html',
    styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
    project$: Observable<Project | null>;
    caseStudy$: Observable<CaseStudy | null>;

    // Lightbox State
    lightboxOpen = false;
    currentImageIndex = 0;

    constructor(
        private route: ActivatedRoute,
        private projectService: ProjectService,
        private titleService: Title
    ) {
        this.project$ = this.route.paramMap.pipe(
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) return [null];
                return this.projectService.getBySlug(slug);
            }),
            shareReplay(1)
        );

        // Subscribe to project updates to set title
        this.project$.subscribe(project => {
            if (project) {
                this.titleService.setTitle(`${project.title} | Aryan Mishra`);
            }
        });

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
        window.scrollTo(0, 0);
    }

    @HostListener('keydown.escape')
    onEscape() {
        if (this.lightboxOpen) {
            this.closeLightbox();
        }
    }

    @HostListener('keydown.arrowleft')
    onLeft() {
        if (this.lightboxOpen) {
            this.prevImage();
        }
    }

    @HostListener('keydown.arrowright')
    onRight() {
        if (this.lightboxOpen) {
            this.nextImage();
        }
    }

    getLiveLink(project: Project): string | undefined {
        return project.links?.find(l => l.kind === 'live')?.href;
    }

    getRepoLink(project: Project): string | undefined {
        return project.links?.find(l => l.kind === 'repo')?.href;
    }

    // Screenshot Helpers
    getScreenshotUrl(s: string | { url: string }): string {
        return typeof s === 'string' ? s : s.url;
    }

    getScreenshotCaption(s: string | { caption?: string }): string {
        return typeof s === 'string' ? '' : (s.caption || '');
    }

    getScreenshotDescription(s: string | { description?: string }): string {
        return typeof s === 'string' ? '' : (s.description || '');
    }

    // Lightbox Methods
    openLightbox(index: number) {
        this.currentImageIndex = index;
        this.lightboxOpen = true;
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    closeLightbox() {
        this.lightboxOpen = false;
        document.body.style.overflow = '';
    }

    nextImage() {
        this.project$.pipe(take(1)).subscribe(project => {
            if (project?.screenshots) {
                this.currentImageIndex = (this.currentImageIndex + 1) % project.screenshots.length;
            }
        });
    }

    prevImage() {
        this.project$.pipe(take(1)).subscribe(project => {
            if (project?.screenshots) {
                this.currentImageIndex = (this.currentImageIndex - 1 + project.screenshots.length) % project.screenshots.length;
            }
        });
    }
}
