import { Component, DestroyRef, HostListener, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService } from '../core/services/theme.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule, NgOptimizedImage, DOCUMENT } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { FooterComponent } from '../shared/components/footer/footer.component';
import { ButtonComponent } from '../shared/button/button.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../core/services/settings.service';
import { A11yModule } from '@angular/cdk/a11y';
import { AvailabilityBadgeComponent } from '../shared/components/availability-badge/availability-badge.component';
import { ChatWidgetComponent } from '../shared/components/chat-widget/chat-widget.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'portfolio-layout',
  templateUrl: './layout.component.html',
  standalone: true,
  styleUrl: './layout.component.scss',
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatMenuModule,
    FooterComponent,
    ButtonComponent,
    MatSnackBarModule,
    A11yModule,
    AvailabilityBadgeComponent,
    ChatWidgetComponent,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  private _mobileMenuOpen = false;
  availableForFreelance = false;
  isScrolled = false;

  // Contextual Nav State
  isProjectDetailPage = false;
  activeSection = 'overview';

  private document = inject(DOCUMENT);
  private router = inject(Router);

  get mobileMenuOpen(): boolean {
    return this._mobileMenuOpen;
  }

  set mobileMenuOpen(value: boolean) {
    this._mobileMenuOpen = value;
    if (value) {
      this.document.body.style.overflow = 'hidden';
    } else {
      this.document.body.style.overflow = '';
    }
  }

  constructor(
    private theme: ThemeService,
    private settingsService: SettingsService,
    private destroyRef: DestroyRef,
  ) {
    // Monitor Route Changes for Context Switching
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: any) => {
      this.isProjectDetailPage = event.url.includes('/projects/') && !event.url.endsWith('/projects');
      // Reset active section on navigation
      if (this.isProjectDetailPage) {
        this.activeSection = 'overview';
      }
    });
  }

  ngOnInit(): void {
    this.settingsService.settings$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(settings => {
        if (settings) {
          this.availableForFreelance = settings.availableForFreelance;
        }
      });
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.theme.getCurrentTheme();
  }

  toggleTheme() {
    this.theme.toggle();
  }

  scrollToSection(sectionId: string) {
    const element = this.document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      this.activeSection = sectionId;
      this.mobileMenuOpen = false;
    }
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (typeof window === 'undefined') {
      return;
    }
    this.isScrolled = window.scrollY > 10;

    // Scroll Spy Logic for Project Detail Page
    if (this.isProjectDetailPage) {
      const sections = ['overview', 'architecture', 'decisions', 'learnings'];
      for (const section of sections) {
        const element = this.document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            this.activeSection = section;
            break;
          }
        }
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.mobileMenuOpen) {
      this.mobileMenuOpen = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up body overflow style to prevent it persisting
    this.document.body.style.overflow = '';
  }
}
