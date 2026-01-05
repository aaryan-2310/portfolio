export interface Skill {
    id: string;
    name: string;
    category: string;
    icon?: string;
    isCustomIcon?: boolean;
    proficiency: number;
    displayOrder: number;
}
