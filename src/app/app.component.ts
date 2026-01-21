import { Component, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalErrorService } from './core/error/global-error.service';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'portfolio';
  errorVisible = false;
  errorMessage = '';

  constructor(
    errors: GlobalErrorService,
    destroyRef: DestroyRef,
    seo: SeoService
  ) {
    seo.updateMetaTags({
      title: 'Aaryan | Senior Software Engineer',
      description: 'Senior Software Engineer specializing in Angular, Node.js, and Cloud Architectures.',
      keywords: ['Angular', 'TypeScript', 'Node.js', 'Cloud Architecture', 'Software Engineer']
    });

    errors.errors$.pipe(takeUntilDestroyed(destroyRef)).subscribe(msg => {
      this.errorMessage = msg || 'Something went wrong';
      this.errorVisible = true;
    });
  }

  dismissError() {
    this.errorVisible = false;
  }
}
