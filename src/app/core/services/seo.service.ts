import { Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';

export interface SeoConfig {
    title: string;
    description: string;
    image?: string;
    slug?: string;
    keywords?: string[];
    type?: 'website' | 'article';
}

@Injectable({
    providedIn: 'root'
})
export class SeoService {
    private readonly defaultTitle = 'Aaryan | Senior Software Engineer';
    private readonly defaultDesc = 'Senior Software Engineer specializing in Angular, Node.js, and Cloud Architectures.';
    private readonly siteUrl = 'https://portfolio.aryanmishra.work'; // Update with actual URL if known, or use window.location

    constructor(
        private title: Title,
        private meta: Meta,
        private router: Router
    ) { }

    updateMetaTags(config: SeoConfig) {
        const title = config.title;
        const description = config.description || this.defaultDesc;
        const type = config.type || 'website';

        // Construct dynamic OG image URL
        // Default fallback to portfolio home if no specific params
        const ogImage = config.image || this.generateOgUrl(title, config.description);

        const url = config.slug
            ? `${this.siteUrl}/${config.slug}`
            : this.siteUrl + this.router.url;

        // Set Title
        this.title.setTitle(title);

        // Set Meta Tags
        this.setTags([
            { name: 'description', content: description },
            { name: 'keywords', content: (config.keywords || []).join(', ') },

            // Open Graph
            { property: 'og:title', content: title },
            { property: 'og:description', content: description },
            { property: 'og:image', content: ogImage },
            { property: 'og:url', content: url },
            { property: 'og:type', content: type },
            { property: 'og:site_name', content: 'Aaryan Portfolio' },

            // Twitter Card
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: title },
            { name: 'twitter:description', content: description },
            { name: 'twitter:image', content: ogImage },
        ]);
    }

    private setTags(tags: { name?: string; property?: string; content: string }[]) {
        tags.forEach(tag => {
            if (tag.name) {
                this.meta.updateTag({ name: tag.name, content: tag.content });
            } else if (tag.property) {
                this.meta.updateTag({ property: tag.property, content: tag.content });
            }
        });
    }

    private generateOgUrl(title: string, subtitle?: string): string {
        const params = new URLSearchParams();
        params.set('title', title);
        if (subtitle) params.set('subtitle', subtitle.slice(0, 50) + (subtitle.length > 50 ? '...' : ''));

        // Use relative path for proxying or absolute if in prod
        // Since vercel.json rewrites /api, we can use the relative path
        // But for OG tags, absolute URL is preferred/required by some crawlers

        const baseUrl = typeof window !== 'undefined' ? window.location.origin : this.siteUrl;
        return `${baseUrl}/api/og?${params.toString()}`;
    }
}
