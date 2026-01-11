import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, filter, take } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { Skill, SkillService } from '../../core/services/skill.service';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { Experience, ExperienceService } from '../../core/services/experience.service';
import { formatDateRange, trackById, trackByTitle } from '../../shared/utils';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterModule, ButtonComponent, RevealOnScrollDirective, SkeletonComponent, LoaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent implements OnInit {
  experiences: Experience[] = [];
  settings: SiteSettings | null = null;
  skills: Skill[] = [];
  skillNames = '';
  services: ServiceOffering[] = [];
  isLoading = true;

  constructor(
    private experienceService: ExperienceService,
    private settingsService: SettingsService,
    private skillService: SkillService,
    private serviceOfferingService: ServiceOfferingService
  ) { }

  ngOnInit(): void {
    forkJoin({
      experiences: this.experienceService.getAll(),
      settings: this.settingsService.settings$.pipe(
        filter(s => !!s),
        take(1)
      ),
      skills: this.skillService.getAll(),
      services: this.serviceOfferingService.getServices()
    }).subscribe(({ experiences, settings, skills, services }) => {
      this.experiences = experiences;
      this.settings = settings;
      this.skills = skills;
      this.skillNames = skills.slice(0, 6).map(s => s.name).join(', ');
      this.services = services;
      this.isLoading = false;
    });
  }

  formatDateRange = formatDateRange;

  trackByExperience = trackById;
  trackByService = trackByTitle;
  trackBySkill = trackById;
}

