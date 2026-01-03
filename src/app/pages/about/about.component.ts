import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, map } from 'rxjs';
import { ButtonComponent } from '../../shared/button/button.component';
import { RevealOnScrollDirective } from '../../shared/directives/reveal-on-scroll.directive';
import { Skill, SkillService } from '../../core/services/skill.service';
import { ServiceOffering, ServiceOfferingService } from '../../core/services/service-offering.service';
import { SettingsService, SiteSettings } from '../../core/services/settings.service';
import { Experience, ExperienceService } from '../../core/services/experience.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterModule, ButtonComponent, RevealOnScrollDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  experiences$: Observable<Experience[]>;
  settings$: Observable<SiteSettings | null>;
  skills$: Observable<Skill[]>;
  skillNames$: Observable<string>;
  services$: Observable<ServiceOffering[]>;

  constructor(
    private experienceService: ExperienceService,
    private settingsService: SettingsService,
    private skillService: SkillService,
    private serviceOfferingService: ServiceOfferingService
  ) {
    this.experiences$ = this.experienceService.getAll();
    this.settings$ = this.settingsService.settings$;
    this.skills$ = this.skillService.getAll();
    this.skillNames$ = this.skills$.pipe(
      map(skills => skills.slice(0, 6).map(s => s.name).join(', '))
    );
    this.services$ = this.serviceOfferingService.getServices();
  }

  formatDateRange(start: string, end?: string | null): string {
    const startDate = new Date(start);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!end) return `${startStr} – Present`;
    const endDate = new Date(end);
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }

  trackByExperience = (_: number, e: Experience) => e.id;
  trackByService = (_: number, s: ServiceOffering) => s.title;
  trackBySkill = (_: number, s: Skill) => s.id;
}

