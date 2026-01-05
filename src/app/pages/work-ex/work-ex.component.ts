import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { WorkExperience, WorkExperienceSkill as WorkSkill } from '../../shared/models/work-experience.interface';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../../shared/button/button.component';
import { forkJoin } from 'rxjs';
import { Experience, ExperienceService } from '../../core/services/experience.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'portfolio-work-ex',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatStepperModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    ExperienceCardComponent,
    ButtonComponent,
    NgOptimizedImage
  ],
  templateUrl: './work-ex.component.html',
  styleUrl: './work-ex.component.scss',
})
export class WorkExComponent implements AfterViewInit, OnInit {
  revealActive = true;
  experiences: WorkExperience[] = [];
  experienceCount = 0;
  projectCount = 0;
  yearsOfExperience = 0;

  readonly githubUrl = 'https://github.com/aaryan-2310';
  readonly linkedinUrl = 'https://linkedin.com/in/aaryan-mishra-dev';
  readonly xUrl = 'https://x.com/';

  constructor(
    private experienceService: ExperienceService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    forkJoin({
      experiences: this.experienceService.getAll(),
      projects: this.projectService.getAll()
    }).subscribe(({ experiences, projects }) => {
      this.experiences = experiences.map((exp, i) => this.mapToWorkExperience(exp, i));
      this.experienceCount = this.getUniqueCompanyCount(experiences);
      this.projectCount = projects.length;
      this.yearsOfExperience = this.calculateYearsOfExperience(experiences);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => (this.revealActive = true), 0);
  }

  replayReveal(): void {
    this.revealActive = false;
    setTimeout(() => (this.revealActive = true), 0);
  }

  private getUniqueCompanyCount(experiences: Experience[]): number {
    const uniqueCompanies = new Set(experiences.map(exp => exp.company));
    return uniqueCompanies.size;
  }

  private calculateYearsOfExperience(experiences: Experience[]): number {
    if (experiences.length === 0) return 0;

    // Find the earliest start date
    const earliestStart = experiences.reduce((earliest, exp) => {
      const startDate = new Date(exp.startDate);
      return startDate < earliest ? startDate : earliest;
    }, new Date(experiences[0].startDate));

    const now = new Date();
    const years = (now.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  private mapToWorkExperience(exp: Experience, index: number): WorkExperience {
    const descriptionArray: string[] = exp.description || [];

    const skills: WorkSkill[] = exp.skills?.map(s => ({
      name: s.name,
      icon: s.icon || 'code',
      isCustomIcon: s.isCustomIcon ?? false
    })) || [];

    return {
      id: exp.id,
      company: exp.company,
      logoUrl: exp.logoUrl || '',
      role: exp.role,
      startDate: new Date(exp.startDate),
      endDate: exp.endDate ? new Date(exp.endDate) : null,
      location: exp.location,
      description: descriptionArray,
      skills,
      state: index === 0 ? 'current' : 'past'
    };
  }
}

