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
  template: `
    <ng-container [ngSwitch]="variant">
      <!-- Text variant: multiple lines -->
      <ng-container *ngSwitchCase="'text'">
        <div class="skeleton-container">
          <div
            *ngFor="let line of linesArray; let last = last"
            class="skeleton skeleton--text"
            [style.width]="last ? '70%' : '100%'"
          ></div>
        </div>
      </ng-container>

      <!-- Circle variant -->
      <ng-container *ngSwitchCase="'circle'">
        <div class="skeleton skeleton--circle" [style.width]="width" [style.height]="width"></div>
      </ng-container>

      <!-- Card variant -->
      <ng-container *ngSwitchCase="'card'">
        <div class="skeleton skeleton--card">
          <div class="skeleton skeleton--card-image"></div>
          <div class="skeleton-card-content">
            <div class="skeleton skeleton--text" style="width: 70%"></div>
            <div class="skeleton skeleton--text" style="width: 100%"></div>
            <div class="skeleton skeleton--text" style="width: 50%"></div>
          </div>
        </div>
      </ng-container>

      <!-- Avatar with text -->
      <ng-container *ngSwitchCase="'avatar'">
        <div class="skeleton-avatar-row">
          <div class="skeleton skeleton--circle" style="width: 48px; height: 48px"></div>
          <div class="skeleton-avatar-text">
            <div class="skeleton skeleton--text" style="width: 120px"></div>
            <div class="skeleton skeleton--text" style="width: 80px"></div>
          </div>
        </div>
      </ng-container>

      <!-- Default: rectangle -->
      <ng-container *ngSwitchDefault>
        <div
          class="skeleton skeleton--rect"
          [style.width]="width"
          [style.height]="height"
          [style.borderRadius]="borderRadius"
        ></div>
      </ng-container>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .skeleton-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-8, 8px);
      }

      .skeleton {
        background: linear-gradient(
          90deg,
          var(--theme-surface-2, #e0e0e0) 25%,
          var(--theme-surface-1, #f0f0f0) 50%,
          var(--theme-surface-2, #e0e0e0) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s ease-in-out infinite;
        border-radius: var(--radius-sm, 8px);
      }

      .skeleton--text {
        height: 16px;
      }

      .skeleton--circle {
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton--rect {
        min-height: 20px;
      }

      .skeleton--card {
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg, 16px);
        overflow: hidden;
        background: var(--theme-surface-1, #fff);
        border: 1px solid var(--theme-border, #e0e0e0);
      }

      .skeleton--card-image {
        height: 140px;
        border-radius: 0;
      }

      .skeleton-card-content {
        padding: var(--space-16, 16px);
        display: flex;
        flex-direction: column;
        gap: var(--space-8, 8px);
      }

      .skeleton-avatar-row {
        display: flex;
        align-items: center;
        gap: var(--space-12, 12px);
      }

      .skeleton-avatar-text {
        display: flex;
        flex-direction: column;
        gap: var(--space-6, 6px);
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: var(--theme-surface-2, #e0e0e0);
        }
      }
    `,
  ],
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
