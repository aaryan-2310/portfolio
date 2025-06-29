import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>About Me</h1>
      <p>I'm a software developer passionate about creating amazing web experiences.</p>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: var(--mdc-theme-primary);
      margin-bottom: 1rem;
    }
  `]
})
export class AboutComponent {}
