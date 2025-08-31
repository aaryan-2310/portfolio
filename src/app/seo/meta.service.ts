import { Injectable } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MetaService {
  constructor(private readonly router: Router, private readonly meta: Meta) {
    // Update on navigation
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applyFromSnapshot());

    // Initial apply
    this.applyFromSnapshot();
  }

  private applyFromSnapshot() {
    const route = this.getDeepestChild(this.router.routerState.snapshot.root);
    const description = route?.data?.['description'] as string | undefined;
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
    }
  }

  private getDeepestChild(route: any): any {
    let current = route;
    while (current?.firstChild) current = current.firstChild;
    return current;
  }
}

