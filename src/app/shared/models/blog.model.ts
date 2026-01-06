export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    tags: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface BlogPostView {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    tags: string[];
    publishedAt: Date;
    readTime: number;
}
