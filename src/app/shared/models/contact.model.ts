export interface ContactSubmission {
    name: string;
    email: string;
    subject?: string;
    message: string;
}

export interface SocialLink {
    id: string;
    name: string;
    url: string;
    icon?: string;
    logoUrl?: string;
    displayOrder: number;
    showInFooter: boolean;
    showInContact: boolean;
}
