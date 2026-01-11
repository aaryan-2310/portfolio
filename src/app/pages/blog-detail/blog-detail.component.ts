import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { formatDateLong, trackByValue } from '../../shared/utils';

import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
    selector: 'portfolio-blog-detail',
    standalone: true,
    imports: [CommonModule, ButtonComponent, SkeletonComponent, LoaderComponent],
    templateUrl: './blog-detail.component.html',
    styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
    post: BlogPostView | null = null;
    renderedContent: SafeHtml = '';
    notFound = false;
    isLoading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private blogService: BlogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.route.paramMap.pipe(
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
                if (post.content) {
                    const html = marked(post.content) as string;
                    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
                }
            } else {
                this.notFound = true;
            }
            this.isLoading = false;
        });
    }

    formatDate = formatDateLong;

    goBack(): void {
        this.router.navigate(['/blogs']);
    }

    trackByTag = trackByValue;
}
