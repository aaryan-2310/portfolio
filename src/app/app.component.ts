import { Component, DestroyRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GlobalErrorService } from './core/error/global-error.service';

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

  constructor(errors: GlobalErrorService, destroyRef: DestroyRef) {
    errors.errors$.pipe(takeUntilDestroyed(destroyRef)).subscribe(msg => {
      this.errorMessage = msg || 'Something went wrong';
      this.errorVisible = true;
    });
  }

  dismissError() {
    this.errorVisible = false;
  }
}
