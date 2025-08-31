export interface Skill {
  name: string;
  icon: string; // Material icon name or path to custom icon
  isCustomIcon?: boolean;
}

export interface WorkExperience {
  company: string;
  logoUrl: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  description: string[];
  skills: Skill[];
  location?: string;
  state?: string; // For Material Stepper state
}
