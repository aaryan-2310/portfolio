import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BlogPost, BlogPostView } from '../../shared/models';

// Re-export for backward compatibility
export type { BlogPost, BlogPostView } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class BlogService {
    constructor(private api: ApiService) { }

    getAll(): Observable<BlogPost[]> {
        return this.api.get<BlogPost[]>('/blogs');
    }

    getBySlug(slug: string): Observable<BlogPost> {
        return this.api.get<BlogPost>(`/blogs/${slug}`);
    }

    /**
     * Transform raw API response to view model
     */
    static toView(post: BlogPost): BlogPostView {
        const tags = post.tags ? JSON.parse(post.tags) : [];
        const wordCount = post.content?.split(/\s+/).length || 0;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImage: post.coverImage,
            tags,
            publishedAt: new Date(post.publishedAt),
            readTime
        };
    }
}
