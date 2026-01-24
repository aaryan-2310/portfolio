import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map, startWith, shareReplay, catchError, of } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { Project, ProjectService } from '../../core/services/project.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { ContactService } from '../../core/services/contact.service';
import { trackByTitle, trackByValue } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

type ProjectLink = { label: string; href: string; kind: 'repo' | 'live' };
type ProjectView = {
  title: string;
  slug: string;
  description: string;
  tech: string[];
  image?: string;
  gradient?: string;
  links: ProjectLink[];
};

@Component({
  selector: 'portfolio-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent, LoaderComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  header = {
    title: 'Projects',
    subtitle: "A curated selection of things I've designed, built, and shipped.",
  };

  projects$: Observable<ProjectView[] | null>;
  settings$: Observable<SiteSettings | null>;
  githubUrl$: Observable<string>;
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
    private settingsService: SettingsService,
    private contactService: ContactService
  ) {
    this.projects$ = this.projectService.getAll().pipe(
      map(projects => projects
        .filter(p => p.status === 'PUBLISHED')
        .map((p, i) => this.mapToView(p, i))
      ),
      startWith(null),
      catchError(err => {
        console.error('ProjectsComponent: Failed to load projects', err);
        return of([]);
      }),
      shareReplay(1)
    );
    this.settings$ = this.settingsService.settings$;

    this.githubUrl$ = this.contactService.getSocialLinks().pipe(
      map(links => links.find(l => l.name.toLowerCase() === 'github')?.url || 'https://github.com'),
      shareReplay(1)
    );
  }



  private mapToView(project: Project, index: number): ProjectView {
    return {
      title: project.title,
      slug: project.slug,
      description: project.description,
      tech: project.tags || [],
      image: project.imageUrl,
      gradient: this.gradients[index % this.gradients.length],
      links: project.links || []
    };
  }

  trackByProject = trackByTitle;
  trackByTech = trackByValue;
  trackByLink = (_: number, l: ProjectLink) => `${l.kind}:${l.href}`;
}

