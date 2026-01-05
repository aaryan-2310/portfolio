export interface Project {
    id: string;
    title: string;
    slug: string;
    description: string;
    content?: string;
    imageUrl?: string;
    demoUrl?: string;
    repoUrl?: string;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    displayOrder: number;
}
