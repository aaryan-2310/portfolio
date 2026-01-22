import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
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

    // TODO: Update this with your actual deployed Vercel URL
    private readonly OG_GENERATOR_URL = 'https://og-generator-fhkclcdyf-aryan-mishras-projects-b8f77aee.vercel.app/api';

    // Lightbox State
    lightboxOpen = false;
    currentImageIndex = 0;

    constructor(
        private route: ActivatedRoute,
        private projectService: ProjectService,
        private meta: Meta,
        private titleService: Title,
        @Inject(PLATFORM_ID) private platformId: object
    ) {
        this.project$ = this.route.paramMap.pipe(
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) return [null];
                return this.projectService.getBySlug(slug);
            }),
            shareReplay(1)
        );

        // Subscribe to project updates to set Meta Tags
        this.project$.subscribe(project => {
            if (project) {
                this.updateMetaTags(project);
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
        if (isPlatformBrowser(this.platformId)) {
            window.scrollTo(0, 0);
        }
    }

    private updateMetaTags(project: Project) {
        // 1. Update Title
        const title = `${project.title} | Aryan Mishra`;
        this.titleService.setTitle(title);

        // 2. Construct Dynamic Image URL
        const techStack = project.tags ? project.tags.slice(0, 3).join(',') : '';
        const ogImageUrl = `${this.OG_GENERATOR_URL}?title=${encodeURIComponent(project.title)}&type=Project&tech=${encodeURIComponent(techStack)}`;

        // 3. Update Meta Tags
        this.meta.updateTag({ name: 'description', content: project.description || 'Case Study by Aryan Mishra' });

        // Open Graph
        this.meta.updateTag({ property: 'og:title', content: title });
        this.meta.updateTag({ property: 'og:description', content: project.description || 'Case Study by Aryan Mishra' });
        this.meta.updateTag({ property: 'og:image', content: ogImageUrl });
        this.meta.updateTag({ property: 'og:type', content: 'article' });

        // Twitter
        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.meta.updateTag({ name: 'twitter:title', content: title });
        this.meta.updateTag({ name: 'twitter:description', content: project.description || 'Case Study by Aryan Mishra' });
        this.meta.updateTag({ name: 'twitter:image', content: ogImageUrl });
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
