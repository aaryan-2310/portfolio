import { Component, Input, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { WorkExperience } from '../../models/work-experience.interface';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { formatMonthYear, getDuration } from '../../utils';

@Component({
  selector: 'portfolio-experience-card',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatButtonModule,
  ],
  templateUrl: './experience-card.component.html',
  styleUrls: ['./experience-card.component.scss'],
  animations: [
    trigger('cardAnimation', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(20px)',
        }),
      ),
      transition(':enter', [
        animate(
          '0.3s ease-out',
          style({
            opacity: 1,
            transform: 'translateY(0)',
          }),
        ),
      ]),
    ]),
  ],
})
export class ExperienceCardComponent implements AfterViewInit {
  @Input({ required: true }) experience!: WorkExperience;
  @Input() index = 0;

  // Terms to emphasize inside description points
  private readonly emphasisTerms = [
    'Angular',
    'Spring Boot',
    'TypeScript',
    'RxJS',
    'Java',
    'UI',
    'UX',
    'optimizations?',
    'performance',
    'code reviews',
    'junior developers',
  ];

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    // Set animation delay based on card index
    this.el.nativeElement.style.setProperty('--index', this.index.toString());
  }

  formatDate = formatMonthYear;

  getDateRange(): string {
    return `${this.formatDate(this.experience.startDate)} - ${this.formatDate(this.experience.endDate)}`;
  }

  getDuration(): string {
    return getDuration(this.experience.startDate, this.experience.endDate);
  }

  // Emphasize key phrases and numeric deltas within bullet points
  emphasize(text: string): string {
    const escape = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    let safe = escape(text);

    // Percentages and numeric improvements
    safe = safe.replace(/([+-]?\d+%)/g, '<span class="em">$1</span>');

    // Known terms (case-insensitive)
    for (const term of this.emphasisTerms) {
      const re = new RegExp(`\\b(${term})\\b`, 'gi');
      safe = safe.replace(re, '<span class="em">$1</span>');
    }

    // Plus sign between technologies e.g., Angular + Spring Boot
    safe = safe.replace(/(Angular)\s*\+\s*(Spring Boot)/gi, '<span class="em">$1 + $2</span>');

    return safe;
  }
}
