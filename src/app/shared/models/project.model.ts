export interface Project {
    id: string;
    title: string;
    slug: string;
    description: string;
    content?: string;
    imageUrl?: string;
    links?: Array<{ label: string; href: string; kind: 'repo' | 'live' }>;
    tags: string[];
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    displayOrder: number;
    featured: boolean;
    gradient?: string;
    screenshots?: string[];
    caseStudy?: string;
}

export interface CaseStudySection {
    id: string;
    type: 'text' | 'image' | 'gallery' | 'technical' | 'features';
    title?: string;
    subtitle?: string;
    content?: string;
    images?: string[];
    items?: Array<{ label: string; value: string; description?: string }>;
    accentColor?: string;
}

export interface CaseStudy {
    problemStatement: {
        title: string;
        description: string;
    };
    challenges: Array<{
        title: string;
        description: string;
        solution: string;
    }>;
    technicalDecisions: Array<{
        decision: string;
        rationale: string;
        tradeOffs: string;
    }>;
    architecture: {
        diagramUrl: string;
        description: string;
    };
    requirements: Array<{
        type: string;
        description: string;
    }>;
    outcomes: Array<{
        metric: string;
        value: string;
        description: string;
    }>;
    futureWork: string[];
    sections?: CaseStudySection[];
}
