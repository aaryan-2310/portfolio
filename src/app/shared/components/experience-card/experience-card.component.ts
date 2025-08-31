import { Component, Input, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { WorkExperience } from '../../models/work-experience.interface';
import { animate, state, style, transition, trigger } from '@angular/animations';

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

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    // Set animation delay based on card index
    this.el.nativeElement.style.setProperty('--index', this.index.toString());
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Present';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  getDateRange(): string {
    return `${this.formatDate(this.experience.startDate)} - ${this.formatDate(this.experience.endDate)}`;
  }

  getDuration(): string {
    const start = this.experience.startDate;
    const end = this.experience.endDate || new Date();

    // Handle invalid dates
    if (!start || isNaN(start.getTime())) {
      return 'Invalid date';
    }

    const months =
      (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
      return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
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
