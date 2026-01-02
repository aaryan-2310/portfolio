import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';

interface FeaturedProject {
  title: string;
  description: string;
  gradient: string;
  link: string;
}

interface Skill {
  name: string;
  icon: string;
}

@Component({
  selector: 'portfolio-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  featuredProjects: FeaturedProject[] = [
    {
      title: 'Portfolio Site',
      description: 'Angular 19 with SSR, theming, and smooth animations.',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      link: '/projects',
    },
    {
      title: 'Job Hunt',
      description: 'AI-powered job matching with automatic applications.',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      link: '/projects',
    },
    {
      title: 'API Explorer',
      description: 'REST endpoint testing with persistent collections.',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
      link: '/projects',
    },
  ];

  skills: Skill[] = [
    { name: 'Angular', icon: 'code' },
    { name: 'TypeScript', icon: 'language' },
    { name: 'Java', icon: 'coffee' },
    { name: 'Spring Boot', icon: 'bolt' },
    { name: 'RxJS', icon: 'sync' },
    { name: 'SCSS', icon: 'palette' },
    { name: 'Node.js', icon: 'dns' },
    { name: 'Git', icon: 'merge' },
  ];

  trackByProject = (_: number, p: FeaturedProject) => p.title;
  trackBySkill = (_: number, s: Skill) => s.name;
}
