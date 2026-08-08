import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable, switchMap, map, shareReplay, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '../../core/services/project.service';
import { SeoService } from '../../core/services/seo.service';
import { breadcrumbSchema, personRef } from '../../core/seo/seo.schema';
import { Project, CaseStudy } from '../../shared/models/project.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

/** `screenshots` entries are either a bare URL or an object wrapping one. */
function firstScreenshotUrl(project: Project): string | undefined {
    const first = project.screenshots?.[0];
    if (!first) {
        return undefined;
    }
    return typeof first === 'string' ? first : first.url;
}

@Component({
    selector: 'portfolio-project-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, LoaderComponent],
    templateUrl: './project-detail.component.html',
    styleUrl: './project-detail.component.scss'
})
export class ProjectDetailComponent implements OnInit {
    project$: Observable<Project | null>;
    caseStudy$: Observable<CaseStudy | null>;

    // Lightbox State
    lightboxOpen = false;
    currentImageIndex = 0;

    private destroyRef = inject(DestroyRef);

    constructor(
        private route: ActivatedRoute,
        private projectService: ProjectService,
        private seo: SeoService
    ) {
        this.project$ = this.route.paramMap.pipe(
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) return [null];
                return this.projectService.getBySlug(slug);
            }),
            shareReplay(1)
        );

        // The router's TitleStrategy has already applied the route's placeholder
        // title by this point; refine it once the CMS tells us what this project is.
        this.project$.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(project => {
            if (project) {
                this.applySeo(project);
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
        this.destroyRef.onDestroy(() => { document.body.style.overflow = ''; });
    }

    ngOnInit(): void {
        window.scrollTo(0, 0);
    }

    /**
     * schema.org has no dedicated type for a portfolio project; CreativeWork is
     * the closest standard fit that still carries name/description/image cleanly.
     */
    private applySeo(project: Project): void {
        const path = `/projects/${project.slug}`;
        const url = this.seo.absoluteUrl(path);
        const image = project.imageUrl ?? firstScreenshotUrl(project);

        const creativeWork: Record<string, unknown> = {
            '@type': 'CreativeWork',
            name: project.title,
            description: project.description,
            url,
            author: personRef,
            ...(image ? { image: this.seo.absoluteUrl(image) } : {}),
            ...(project.tags.length > 0 ? { keywords: project.tags.join(', ') } : {}),
        };

        this.seo.update({
            title: project.title,
            description: project.description,
            path,
            image,
            type: 'article',
            jsonLd: [
                breadcrumbSchema([
                    { name: 'Home', path: '/home' },
                    { name: 'Projects', path: '/projects' },
                    { name: project.title, path },
                ]),
                creativeWork,
            ],
        });
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
