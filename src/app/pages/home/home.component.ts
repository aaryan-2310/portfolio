import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';
import { ProjectService } from '../../core/services/project.service';
import { Skill, SkillService } from '../../core/services/skill.service';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { BlogPostView, BlogService } from '../../core/services/blog.service';
import { forkJoin, map, filter, take } from 'rxjs';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { formatDate, trackById, trackByTitle } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';

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
  imports: [CommonModule, RouterModule, ButtonComponent, SkeletonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  projects: FeaturedProjectView[] = [];
  skills: Skill[] = [];
  services: ServiceOffering[] = [];
  settings: SiteSettings | null = null;
  recentPosts: BlogPostView[] = [];
  isLoading = true;

  constructor(
    private projectService: ProjectService,
    private skillService: SkillService,
    private serviceOfferingService: ServiceOfferingService,
    private settingsService: SettingsService,
    private blogService: BlogService
  ) { }

  ngOnInit(): void {
    forkJoin({
      projects: this.projectService.getFeatured().pipe(
        map(projects => projects.slice(0, 3).map((p, i) => ({
          title: p.title,
          description: p.description,
          gradient: this.getGradient(i),
          link: p.demoUrl || '/projects'
        })))
      ),
      skills: this.skillService.getAll(),
      services: this.serviceOfferingService.getServices(),
      settings: this.settingsService.settings$.pipe(
        filter(s => !!s),
        take(1)
      ),
      posts: this.blogService.getAll().pipe(
        map(posts => posts.slice(0, 3).map(p => BlogService.toView(p)))
      )
    }).subscribe(({ projects, skills, services, settings, posts }) => {
      this.projects = projects;
      this.skills = skills;
      this.services = services;
      this.settings = settings;
      this.recentPosts = posts;
      this.isLoading = false;
    });
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
