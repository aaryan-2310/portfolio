import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private currentTheme: 'light' | 'dark' = 'light';

  constructor() {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (stored === 'light' || stored === 'dark') {
      this.currentTheme = stored;
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark';
    }
    this.applyTheme();
  }

  toggle(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', this.currentTheme);
    }
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
}
