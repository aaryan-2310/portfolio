import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { Project, ProjectService } from '../../core/services/project.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { trackByTitle, trackByValue } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { tap } from 'rxjs';

type ProjectLink = { label: string; href: string; kind: 'repo' | 'live' };
type ProjectView = {
  title: string;
  description: string;
  tech: string[];
  image?: string;
  gradient?: string;
  links: ProjectLink[];
};

@Component({
  selector: 'portfolio-projects',
  standalone: true,
  imports: [CommonModule, ButtonComponent, SkeletonComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  header = {
    title: 'Projects',
    subtitle: "A curated selection of things I've designed, built, and shipped.",
  };

  projects$: Observable<ProjectView[]>;
  settings$: Observable<SiteSettings | null>;
  isLoading = true;

  private gradients = [
    'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
    'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  ];

  constructor(
    private projectService: ProjectService,
    private settingsService: SettingsService
  ) {
    this.projects$ = this.projectService.getAll().pipe(
      map(projects => projects
        .filter(p => p.status === 'PUBLISHED')
        .map((p, i) => this.mapToView(p, i))
      ),
      tap(() => this.isLoading = false)
    );
    this.settings$ = this.settingsService.settings$;
  }



  private mapToView(project: Project, index: number): ProjectView {
    const links: ProjectLink[] = [];

    if (project.repoUrl) {
      links.push({ label: 'View Repo', href: project.repoUrl, kind: 'repo' });
    }
    if (project.demoUrl) {
      links.push({ label: 'Live Demo', href: project.demoUrl, kind: 'live' });
    }

    return {
      title: project.title,
      description: project.description,
      tech: project.tags || [],
      image: project.imageUrl,
      gradient: this.gradients[index % this.gradients.length],
      links
    };
  }

  trackByProject = trackByTitle;
  trackByTech = trackByValue;
  trackByLink = (_: number, l: ProjectLink) => `${l.kind}:${l.href}`;
}

