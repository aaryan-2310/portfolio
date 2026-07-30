import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable skeleton loader component for loading states.
 * Usage:
 *   <portfolio-skeleton width="100%" height="200px"></portfolio-skeleton>
 *   <portfolio-skeleton variant="text" [lines]="3"></portfolio-skeleton>
 *   <portfolio-skeleton variant="circle" width="48px"></portfolio-skeleton>
 *   <portfolio-skeleton variant="card"></portfolio-skeleton>
 */
@Component({
  selector: 'portfolio-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
})
export class SkeletonComponent {
  /** Skeleton variant type */
  @Input() variant: 'rect' | 'text' | 'circle' | 'card' | 'avatar' = 'rect';

  /** Width of the skeleton (for rect/circle) */
  @Input() width = '100%';

  /** Height of the skeleton (for rect) */
  @Input() height = '20px';

  /** Border radius (for rect) */
  @Input() borderRadius = 'var(--radius-sm)';

  /** Number of text lines (for text variant) */
  @Input() lines = 3;

  get linesArray(): number[] {
    return Array.from({ length: this.lines }, (_, i) => i);
  }
}
