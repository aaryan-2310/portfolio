import {
  Directive,
  ElementRef,
  HostListener,
  Inject,
  Input,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Reusable ripple effect directive.
 * Usage: <button ripple>Click me</button>
 *        <button ripple [rippleColor]="'rgba(255,255,255,0.3)'">Light ripple</button>
 */
@Directive({
  selector: '[ripple]',
  standalone: true,
})
export class RippleDirective {
  /** Custom ripple color (default: semi-transparent white) */
  @Input() rippleColor = 'rgba(255, 255, 255, 0.4)';

  /** Duration of ripple animation in ms */
  @Input() rippleDuration = 600;

  /** Whether ripple is disabled */
  @Input() rippleDisabled = false;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) platformId: object,
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);

    // Ensure host has relative/absolute positioning for ripple containment
    if (this.isBrowser) {
      const position = getComputedStyle(this.el.nativeElement).position;
      if (position === 'static') {
        this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
      }
      this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');
    }
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.isBrowser || this.rippleDisabled) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.createRipple(event);
  }

  private createRipple(event: MouseEvent): void {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();

    // Calculate ripple size (diameter = max of width/height * 2)
    const diameter = Math.max(rect.width, rect.height) * 2;
    const radius = diameter / 2;

    // Calculate click position relative to element
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    // Create ripple element
    const ripple = this.renderer.createElement('span');
    this.renderer.addClass(ripple, 'ripple-effect');

    // Apply styles
    this.renderer.setStyle(ripple, 'width', `${diameter}px`);
    this.renderer.setStyle(ripple, 'height', `${diameter}px`);
    this.renderer.setStyle(ripple, 'left', `${x}px`);
    this.renderer.setStyle(ripple, 'top', `${y}px`);
    this.renderer.setStyle(ripple, 'background', this.rippleColor);
    this.renderer.setStyle(ripple, 'position', 'absolute');
    this.renderer.setStyle(ripple, 'border-radius', '50%');
    this.renderer.setStyle(ripple, 'transform', 'scale(0)');
    this.renderer.setStyle(ripple, 'pointer-events', 'none');
    this.renderer.setStyle(
      ripple,
      'animation',
      `ripple-animation ${this.rippleDuration}ms ease-out`,
    );

    // Append to element
    this.renderer.appendChild(element, ripple);

    // Remove after animation
    setTimeout(() => {
      if (ripple.parentNode) {
        this.renderer.removeChild(element, ripple);
      }
    }, this.rippleDuration);
  }
}
