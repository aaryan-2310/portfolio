import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../shared/button/button.component';

type ProjectLink = { label: string; href: string; kind: 'repo' | 'live' };
type Project = {
  title: string;
  description: string;
  tech: string[];
  image?: string; // optional screenshot path
  gradient?: string; // fallback gradient bg
  links: ProjectLink[];
};

@Component({
  selector: 'portfolio-projects',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  header = {
    title: 'Projects',
    subtitle: 'A curated selection of things I’ve designed, built, and shipped.',
  };

  projects: Project[] = [
    {
      title: 'Portfolio Site',
      description:
        'My personal site built with Angular standalone components, theming, and smooth interactions.',
      tech: ['Angular', 'TypeScript', 'SCSS'],
      gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
      links: [
        { label: 'View Repo', href: 'https://github.com/', kind: 'repo' },
        { label: 'Live Demo', href: '#', kind: 'live' },
      ],
    },
    {
      title: 'Job Hunt',
      description:
        'Find the job which matches you the best and Use the automatic application feature to autonomously apply to jobs',
      tech: ['React', 'Spring Boot', 'Gemini'],
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      links: [
        // {label: 'View Repo', href: 'https://github.com/', kind: 'repo'},
        { label: 'Live Demo', href: 'https://job-hunt-frontend-j3nh.onrender.com/', kind: 'live' },
      ],
    },
    {
      title: 'API Explorer',
      description: 'Explore REST endpoints with a slick UI and persistent collections.',
      tech: ['Angular', 'Material', 'Node.js'],
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      links: [
        { label: 'View Repo', href: 'https://github.com/', kind: 'repo' },
        { label: 'Live Demo', href: '#', kind: 'live' },
      ],
    },
  ];

  trackByProject = (_: number, p: Project) => p.title;
  trackByTech = (_: number, t: string) => t;
  trackByLink = (_: number, l: ProjectLink) => `${l.kind}:${l.href}`;
}
