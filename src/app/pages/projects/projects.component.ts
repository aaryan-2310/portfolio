import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map, shareReplay, catchError, of, BehaviorSubject, combineLatest, tap } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { Project, ProjectService } from '../../core/services/project.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { ContactService } from '../../core/services/contact.service';
import { trackByTitle, trackByValue } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ToolbarSearchComponent } from '../../shared/components/toolbar-search/toolbar-search.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

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
  imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent, LoaderComponent, ToolbarSearchComponent, EmptyStateComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
})
export class ProjectsComponent {
  @ViewChild(ToolbarSearchComponent) toolbar!: ToolbarSearchComponent;

  header = {
    title: 'Projects',
    subtitle: "A curated selection of things I've designed, built, and shipped.",
  };

  // UX State
  spotlightActive = false;
  placeholderTexts = ['"React E-commerce"', '"Angular Dashboard"', '"System Design"', '"Open Source"'];

  // Data Streams
  private projectsSource$ = new BehaviorSubject<ProjectView[]>([]);
  private selectedTag$ = new BehaviorSubject<string | null>(null);
  private searchQuery$ = new BehaviorSubject<string>('');

  filteredProjects$: Observable<ProjectView[]>;
  resultCount$: Observable<number>;
  settings$: Observable<SiteSettings | null>;
  githubUrl$: Observable<string>;

  allTags: string[] = [];
  selectedTag: string | null = null;
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
    // Load Data
    this.projectService.getAll().pipe(
      map(projects => projects
        .filter(p => p.status === 'PUBLISHED')
        .map((p, i) => this.mapToView(p, i))
      ),
      catchError(err => {
        console.error('ProjectsComponent: Failed to load projects', err);
        return of([]);
      })
    ).subscribe(views => {
      this.projectsSource$.next(views);
      // Extract unique tags
      const tags = new Set<string>();
      views.forEach(p => p.tech.forEach(t => tags.add(t)));
      this.allTags = [...tags].sort();
      this.isLoading = false;
    });

    // Filtering Logic
    this.filteredProjects$ = combineLatest([
      this.projectsSource$,
      this.selectedTag$,
      this.searchQuery$
    ]).pipe(
      map(([projects, tag, query]) => {
        return projects.filter(p => {
          const matchesTag = tag === null || p.tech.includes(tag);
          const matchesSearch = query === '' ||
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.tech.some(t => t.toLowerCase().includes(query.toLowerCase()));
          return matchesTag && matchesSearch;
        });
      }),
      tap(results => {
        if (results.length === 0 && this.searchQuery$.value) {
          this.toolbar?.triggerShake();
        }
      }),
      shareReplay(1)
    );

    this.resultCount$ = this.filteredProjects$.pipe(map(p => p.length));
    this.settings$ = this.settingsService.settings$;
    this.githubUrl$ = this.contactService.getSocialLinks().pipe(
      map(links => links.find(l => l.name.toLowerCase() === 'github')?.url || 'https://github.com'),
      shareReplay(1)
    );
  }

  onSearch(query: string): void {
    this.searchQuery$.next(query);
  }

  onTagChange(tag: string | null): void {
    this.selectedTag = tag;
    this.selectedTag$.next(tag);
  }

  onFocusChange(focused: boolean): void {
    this.spotlightActive = focused;
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

