import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'portfolio-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="nf">
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist.</p>
      <a routerLink="/home" class="back">Go back home</a>
    </section>
  `,
  styles: [
    `
      .nf {
        max-width: 960px;
        margin: 48px auto;
        padding: 0 16px;
        text-align: center;
      }
      h1 {
        font-size: clamp(1.8rem, 3vw, 2.4rem);
        margin-bottom: 8px;
      }
      p {
        margin: 0 0 16px;
      }
      .back {
        color: var(--theme-accent);
        text-decoration: none;
        font-weight: 600;
      }
      .back:hover {
        text-decoration: underline;
      }
    `,
  ],
})
export class NotFoundComponent {}
