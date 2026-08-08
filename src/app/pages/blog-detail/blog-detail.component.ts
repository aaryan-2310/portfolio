import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { SeoService } from '../../core/services/seo.service';
import { breadcrumbSchema, personRef } from '../../core/seo/seo.schema';
import { ButtonComponent } from '../../shared/button/button.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { formatDateLong, trackByValue } from '../../shared/utils';

import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
    selector: 'portfolio-blog-detail',
    standalone: true,
    imports: [CommonModule, ButtonComponent, LoaderComponent],
    templateUrl: './blog-detail.component.html',
    styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
    post: BlogPostView | null = null;
    renderedContent: SafeHtml = '';
    notFound = false;
    isLoading = true;
    private destroyRef = inject(DestroyRef);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private blogService: BlogService,
        private sanitizer: DomSanitizer,
        private seo: SeoService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) {
                    this.notFound = true;
                    return of(null);
                }
                this.isLoading = true;
                return this.blogService.getBySlug(slug).pipe(
                    map(post => BlogService.toView(post)),
                    catchError(() => {
                        this.notFound = true;
                        return of(null);
                    })
                );
            })
        ).subscribe(post => {
            if (post) {
                this.post = post;
                this.applySeo(post);
                if (post.content) {
                    const rawHtml = marked.parse(post.content, { async: false });
                    const cleanHtml = DOMPurify.sanitize(rawHtml);
                    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
                }
            } else {
                this.notFound = true;
            }
            this.isLoading = false;
        });
    }

    /**
     * Blog posts are the highest-value content here for search and AI citation,
     * and previously carried no SEO metadata at all — every post served the
     * generic route-level fallback title.
     */
    private applySeo(post: BlogPostView): void {
        const publishedAt = post.publishedAt;
        const publishedTime = Number.isNaN(publishedAt?.getTime())
            ? undefined
            : publishedAt?.toISOString();
        const path = `/blogs/${post.slug}`;
        const url = this.seo.absoluteUrl(path);

        const blogPosting: Record<string, unknown> = {
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            url,
            mainEntityOfPage: { '@type': 'WebPage', '@id': url },
            author: personRef,
            publisher: personRef,
            ...(publishedTime ? { datePublished: publishedTime, dateModified: publishedTime } : {}),
            ...(post.coverImage ? { image: this.seo.absoluteUrl(post.coverImage) } : {}),
            ...(post.tags.length > 0 ? { keywords: post.tags.join(', ') } : {}),
        };

        this.seo.update({
            title: post.title,
            description: post.excerpt,
            path,
            image: post.coverImage,
            type: 'article',
            publishedTime,
            jsonLd: [
                breadcrumbSchema([
                    { name: 'Home', path: '/home' },
                    { name: 'Blog', path: '/blogs' },
                    { name: post.title, path },
                ]),
                blogPosting,
            ],
        });
    }

    formatDate = formatDateLong;

    goBack(): void {
        this.router.navigate(['/blogs']);
    }

    trackByTag = trackByValue;
}
