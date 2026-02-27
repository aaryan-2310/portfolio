import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, map, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { formatDateLong, trackById, trackByValue } from '../../shared/utils';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PortfolioCardComponent } from '../../shared/components/portfolio-card/portfolio-card.component';

@Component({
    selector: 'portfolio-blogs',
    standalone: true,
    imports: [CommonModule, RouterModule, LoaderComponent, EmptyStateComponent, PortfolioCardComponent],
    templateUrl: './blogs.component.html',
    styleUrl: './blogs.component.scss',
})
export class BlogsComponent {

    header = {
        title: 'Blog',
        subtitle: 'Articles and insights on software development, architecture, and best practices.',
    };

    // UX State
    spotlightActive = false;
    placeholderTexts = ['"Angular Signals"', '"System Design"', '"Performance"', '"Career Growth"'];

    // Data streams
    private blogsSource$ = new BehaviorSubject<BlogPostView[]>([]);
    private selectedTag$ = new BehaviorSubject<string | null>(null);
    private searchQuery$ = new BehaviorSubject<string>('');

    // Public observables
    filteredBlogs$: Observable<BlogPostView[]>;
    resultCount$: Observable<number>;
    allTags: string[] = [];

    // UI state for binding
    selectedTag: string | null = null;
    isLoading = true;

    constructor(
        private blogService: BlogService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        // React to Query Params
        this.route.queryParams.pipe(takeUntilDestroyed()).subscribe(params => {
            const q = params['q'] || '';
            this.searchQuery$.next(q);
        });

        // Fetch raw data
        this.blogService.getAll().pipe(
            map(posts => posts.map(p => BlogService.toView(p))),
            catchError(err => {
                console.error('BlogsComponent: Failed to load blogs', err);
                return of([]);
            })
        ).subscribe(views => {
            this.blogsSource$.next(views);
            this.allTags = [...new Set(views.flatMap(v => v.tags))].sort();
            this.isLoading = false;
        });

        // Combine streams for filtering
        this.filteredBlogs$ = combineLatest([
            this.blogsSource$,
            this.selectedTag$,
            this.searchQuery$
        ]).pipe(
            map(([blogs, tag, query]) => {
                return blogs.filter(post => {
                    const matchesTag = tag === null || post.tags.includes(tag);
                    const matchesSearch = query === '' ||
                        post.title.toLowerCase().includes(query.toLowerCase()) ||
                        post.excerpt.toLowerCase().includes(query.toLowerCase());
                    return matchesTag && matchesSearch;
                });
            })
        );

        this.resultCount$ = this.filteredBlogs$.pipe(map(list => list.length));
    }

    readonly hasActiveSearch$ = combineLatest([this.selectedTag$, this.searchQuery$]).pipe(
        map(([tag, q]) => tag !== null || q !== '')
    );

    onTagChange(tag: string | null): void {
        this.selectedTag = tag;
        this.selectedTag$.next(tag);
    }

    onSearch(query: string): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { q: query || null },
            queryParamsHandling: 'merge'
        });
    }

    onFocusChange(focused: boolean): void {
        this.spotlightActive = focused;
    }

    // Helper method for template compatibility if needed, or update template to call onTagChange
    filterByTag(tag: string | null): void {
        this.onTagChange(tag);
    }

    formatDate = formatDateLong;
    trackByPost = trackById;
    trackByTag = trackByValue;
}
