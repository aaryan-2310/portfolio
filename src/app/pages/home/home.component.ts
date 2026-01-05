import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';
import { ProjectService } from '../../core/services/project.service';
import { Skill, SkillService } from '../../core/services/skill.service';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { Observable, map } from 'rxjs';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { formatDate } from '../../shared/utils';

// Adapters for view
interface FeaturedProjectView {
  title: string;
  description: string;
  gradient: string;
  link: string;
}

@Component({
  selector: 'portfolio-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  projects$: Observable<FeaturedProjectView[]>;
  skills$: Observable<Skill[]>;
  services$: Observable<ServiceOffering[]>;
  settings$: Observable<SiteSettings | null>;
  latestPosts$: Observable<BlogPostView[]>;

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
        link: p.demoUrl || '/projects'
      })))
    );

    this.skills$ = this.skillService.getAll();
    this.services$ = this.serviceOfferingService.getServices();
    this.settings$ = this.settingsService.settings$;

    this.latestPosts$ = this.blogService.getAll().pipe(
      map(posts => posts.slice(0, 3).map(p => BlogService.toView(p)))
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

  trackByProject = (_: number, p: FeaturedProjectView) => p.title;
  trackBySkill = (_: number, s: Skill) => s.id;
  trackByService = (_: number, s: ServiceOffering) => s.title;
  trackByPost = (_: number, p: BlogPostView) => p.id;

  formatDate = formatDate;
}
