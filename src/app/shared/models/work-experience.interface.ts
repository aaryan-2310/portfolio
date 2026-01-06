export interface WorkExperienceSkill {
  name: string;
  icon: string; // Material icon name or path to custom icon
  isCustomIcon?: boolean;
}

export interface WorkExperience {
  id: string;
  company: string;
  logoUrl?: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  location?: string;
  description: string[];
  skills: WorkExperienceSkill[];
  state?: 'current' | 'past';
}
