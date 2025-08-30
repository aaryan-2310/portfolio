import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatIconModule } from '@angular/material/icon';
import { WorkExperience } from '../../shared/models/work-experience.interface';
import { ExperienceCardComponent } from '../../shared/components/experience-card/experience-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'portfolio-work-ex',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    ExperienceCardComponent,
    ButtonComponent
  ],
  templateUrl: './work-ex.component.html',
  styleUrl: './work-ex.component.scss'
})
export class WorkExComponent implements AfterViewInit {
  revealActive = true;

  ngAfterViewInit(): void {
    // Ensure initial animation plays after view is ready
    setTimeout(() => (this.revealActive = true), 0);
  }

  replayReveal(): void {
    // Toggle the class to retrigger CSS animations
    this.revealActive = false;
    setTimeout(() => (this.revealActive = true), 0);
  }
  readonly githubUrl = 'https://github.com/'; // Replace with your GitHub profile URL
  readonly linkedinUrl = 'https://linkedin.com/in/'; // Replace with your LinkedIn profile URL
  readonly xUrl = 'https://x.com/'; // Replace with your X (formerly Twitter) profile URL

  experiences: WorkExperience[] = [
    {
      company: 'Clarivate',
      logoUrl: 'assets/img/CLVT.png',
      role: 'Software Development Engineer',
      startDate: new Date('2024-11-15'),
      endDate: null,
      location: 'Bengaluru, India',
      description: [
        'Developed and maintained enterprise-level applications using Angular and Spring Boot',
        'Implemented responsive UI designs and improved application performance',
        'Collaborated with cross-functional teams for feature development and bug fixes',
        'Participated in code reviews and mentored junior developers'
      ],
      skills: [
        { name: 'Angular', icon: 'code', isCustomIcon: false },
        { name: 'TypeScript', icon: 'language', isCustomIcon: false },
        { name: 'Java', icon: 'coffee', isCustomIcon: false },
        { name: 'Spring Boot', icon: '/assets/img/spring-boot.png', isCustomIcon: true },
        { name: 'Git', icon: 'merge', isCustomIcon: false }
      ],
      state: 'current'
    },
    {
      company: 'Tech Solutions',
      logoUrl: 'assets/img/CLVT.png',
      role: 'Junior Developer',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2023-05-31'),
      location: 'Remote',
      description: [
        'Assisted in the development of web applications using React and Node.js',
        'Conducted testing and debugging of applications',
        'Aided in the migration of legacy systems to modern technologies',
        'Documented technical specifications and user guides'
      ],
      skills: [
        { name: 'React', icon: 'code', isCustomIcon: false },
        { name: 'Node.js', icon: 'nodejs', isCustomIcon: false },
        { name: 'JavaScript', icon: 'javascript', isCustomIcon: false },
        { name: 'HTML', icon: 'html5', isCustomIcon: false },
        { name: 'CSS', icon: 'css3', isCustomIcon: false }
      ],
      state: 'past'
    }
    // Add more experiences here
  ];
}
