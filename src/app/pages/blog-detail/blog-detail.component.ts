import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, switchMap, tap, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
    selector: 'portfolio-blog-detail',
    standalone: true,
    imports: [CommonModule, ButtonComponent],
    templateUrl: './blog-detail.component.html',
    styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
    post$!: Observable<BlogPostView | null>;
    renderedContent$!: Observable<SafeHtml>;
    notFound = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private blogService: BlogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.post$ = this.route.paramMap.pipe(
            switchMap(params => {
                const slug = params.get('slug');
                if (!slug) {
                    this.notFound = true;
                    return of(null);
                }
                return this.blogService.getBySlug(slug).pipe(
                    map(post => BlogService.toView(post)),
                    catchError(() => {
                        this.notFound = true;
                        return of(null);
                    })
                );
            }),
            tap(post => {
                if (!post) {
                    this.notFound = true;
                }
            })
        );

        this.renderedContent$ = this.post$.pipe(
            map(post => {
                if (!post?.content) return '';
                const html = marked(post.content) as string;
                return this.sanitizer.bypassSecurityTrustHtml(html);
            })
        );
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    goBack(): void {
        this.router.navigate(['/blogs']);
    }

    trackByTag = (_: number, tag: string) => tag;
}
