import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { formatDateLong, trackById, trackByValue } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
    selector: 'portfolio-blogs',
    standalone: true,
    imports: [CommonModule, RouterLink, SkeletonComponent, LoaderComponent],
    templateUrl: './blogs.component.html',
    styleUrl: './blogs.component.scss',
})
export class BlogsComponent {
    header = {
        title: 'Blog',
        subtitle: 'Articles and insights on software development, architecture, and best practices.',
    };

    // Data streams
    private blogsSource$ = new BehaviorSubject<BlogPostView[]>([]);
    private selectedTag$ = new BehaviorSubject<string | null>(null);
    private searchQuery$ = new BehaviorSubject<string>('');

    // Public observables
    filteredBlogs$: Observable<BlogPostView[]>;
    allTags: string[] = [];

    // UI state for binding
    selectedTag: string | null = null;
    searchQuery: string = '';
    isLoading = true;

    constructor(private blogService: BlogService) {
        // Fetch raw data
        this.blogService.getAll().pipe(
            map(posts => posts.map(p => BlogService.toView(p)))
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
    }

    filterByTag(tag: string | null): void {
        this.selectedTag = tag;
        this.selectedTag$.next(tag);
    }

    onSearch(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchQuery = query;
        this.searchQuery$.next(query);
    }

    formatDate = formatDateLong;

    trackByPost = trackById;
    trackByTag = trackByValue;
}
