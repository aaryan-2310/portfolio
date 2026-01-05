export interface ExperienceSkill {
    id: string;
    name: string;
    icon?: string;
    isCustomIcon?: boolean;
    category?: string;
    displayOrder?: number;
}

export interface Experience {
    id: string;
    company: string;
    logoUrl?: string;
    role: string;
    startDate: string;
    endDate?: string | null;
    location?: string;
    description: string[];
    skills: ExperienceSkill[];
    displayOrder: number;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}
