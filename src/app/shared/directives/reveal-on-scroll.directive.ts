import { Directive, ElementRef, Inject, Input, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[revealOnScroll]',
  standalone: true,
  host: {
    '[class.reveal-on-scroll]': 'true'
  }
})
export class RevealOnScrollDirective {
  @Input() threshold = 0.1;
  @Input() rootMargin = '0px 0px -10% 0px';

  private io?: IntersectionObserver;

  constructor(@Inject(PLATFORM_ID) platformId: Object, private el: ElementRef<HTMLElement>) {
    if (!isPlatformBrowser(platformId)) {
      // On the server, render revealed to avoid hidden SSR content.
      this.el.nativeElement.classList.add('revealed');
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.el.nativeElement.classList.add('revealed');
      return;
    }

    this.io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            this.el.nativeElement.classList.add('revealed');
            this.io?.unobserve(this.el.nativeElement);
          }
        }
      },
      { root: null, rootMargin: this.rootMargin, threshold: this.threshold }
    );

    this.io.observe(this.el.nativeElement);
  }
}

