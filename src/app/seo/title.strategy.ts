import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const resolved = this.buildTitle(snapshot);
    const base = 'Portfolio';
    if (resolved) {
      this.title.setTitle(`${resolved} | ${base}`);
    } else {
      this.title.setTitle(base);
    }
  }
}
