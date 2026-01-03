import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { WorkExperience, Skill as WorkSkill } from '../../shared/models/work-experience.interface';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../../shared/button/button.component';
import { map } from 'rxjs';
import { Experience, ExperienceService } from '../../core/services/experience.service';

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
  ],
  templateUrl: './work-ex.component.html',
  styleUrl: './work-ex.component.scss',
})
export class WorkExComponent implements AfterViewInit, OnInit {
  revealActive = true;
  experiences: WorkExperience[] = [];
  experienceCount = 0;

  readonly githubUrl = 'https://github.com/aaryan-2310';
  readonly linkedinUrl = 'https://linkedin.com/in/aaryan-mishra-dev';
  readonly xUrl = 'https://x.com/';

  constructor(private experienceService: ExperienceService) { }

  ngOnInit(): void {
    this.experienceService.getAll().pipe(
      map(exps => exps.map((exp, i) => this.mapToWorkExperience(exp, i)))
    ).subscribe(experiences => {
      this.experiences = experiences;
      this.experienceCount = experiences.length;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => (this.revealActive = true), 0);
  }

  replayReveal(): void {
    this.revealActive = false;
    setTimeout(() => (this.revealActive = true), 0);
  }

  private mapToWorkExperience(exp: Experience, index: number): WorkExperience {
    const skills: WorkSkill[] = exp.skills?.map(s => ({
      name: s.name,
      icon: 'code',
      isCustomIcon: false
    })) || [];

    return {
      company: exp.company,
      logoUrl: '',
      role: exp.role,
      startDate: new Date(exp.startDate),
      endDate: exp.endDate ? new Date(exp.endDate) : null,
      location: exp.location,
      description: exp.description || [],
      skills,
      state: index === 0 ? 'current' : 'past'
    };
  }
}
