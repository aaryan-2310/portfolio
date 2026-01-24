import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';
import { ProjectService } from '../../core/services/project.service';
import { Skill, SkillService } from '../../core/services/skill.service';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { Observable, map, startWith, shareReplay, catchError, of } from 'rxjs';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { SkeletonComponent } from "../../shared/components/skeleton/skeleton.component";
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { formatDate, trackById, trackByTitle } from '../../shared/utils';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

// Adapters for view
interface FeaturedProjectView {
  title: string;
  description: string;
  gradient: string;
  link: string[];
}

@Component({
  selector: 'portfolio-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent, LoaderComponent, EmptyStateComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  projects$: Observable<FeaturedProjectView[] | null>;
  skills$: Observable<Skill[] | null>;
  services$: Observable<ServiceOffering[] | null>;
  settings$: Observable<SiteSettings | null>;
  latestPosts$: Observable<BlogPostView[] | null>;

  constructor(
    private projectService: ProjectService,
    private skillService: SkillService,
    private serviceOfferingService: ServiceOfferingService,
    private settingsService: SettingsService,
    private blogService: BlogService
  ) {
    this.projects$ = this.projectService.getFeatured().pipe(
      map(projects => projects.slice(0, 3).map((p, i) => ({
        title: p.title,
        description: p.description,
        gradient: this.getGradient(i),
        link: ['/projects', p.slug]
      }))),
      startWith(null),
      catchError(err => {
        console.error('HomeComponent: Failed to load featured projects', err);
        return of([]);
      }),
      shareReplay(1)
    );

    this.skills$ = this.skillService.getAll().pipe(
      startWith(null),
      catchError(err => {
        console.error('HomeComponent: Failed to load skills', err);
        return of([]);
      }),
      shareReplay(1)
    );
    this.services$ = this.serviceOfferingService.getServices().pipe(
      startWith(null),
      catchError(err => {
        console.error('HomeComponent: Failed to load services', err);
        return of([]);
      }),
      shareReplay(1)
    );
    this.settings$ = this.settingsService.settings$.pipe(
      catchError(err => {
        console.error('HomeComponent: Failed to load settings', err);
        return of(null);
      }),
      shareReplay(1)
    );

    this.latestPosts$ = this.blogService.getAll().pipe(
      map(posts => posts.slice(0, 3).map(p => BlogService.toView(p))),
      startWith(null),
      catchError(err => {
        console.error('HomeComponent: Failed to load blog posts', err);
        return of([]);
      }),
      shareReplay(1)
    );
  }



  private getGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
    ];
    return gradients[index % gradients.length];
  }

  trackByProject = trackByTitle;
  trackBySkill = trackById;
  trackByService = trackByTitle;
  trackByPost = trackById;

  formatDate = formatDate;
}
