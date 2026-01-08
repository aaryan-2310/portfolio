import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvailabilityBadgeVariant = 'default' | 'compact';

@Component({
    selector: 'portfolio-availability-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      class="availability-badge"
      [class.compact]="variant === 'compact'"
      [class.available]="available"
      type="button"
      role="status"
      [attr.aria-label]="available ? 'Available for freelance work' : 'Currently booked'"
      style="cursor: default"
    >
      <span class="dot" [class.on]="available"></span>
      <span class="label" *ngIf="showLabel">{{ available ? availableText : bookedText }}</span>
    </button>
  `,
    styleUrl: './availability-badge.component.scss',
})
export class AvailabilityBadgeComponent {
    @Input() available = false;
    @Input() variant: AvailabilityBadgeVariant = 'default';
    @Input() showLabel = true;
    @Input() availableText = 'Available for freelance';
    @Input() bookedText = 'Currently booked';
}
