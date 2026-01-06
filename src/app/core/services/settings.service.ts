import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { SiteSettings } from '../../shared/models';

// Re-export for backward compatibility
export type { SiteSettings } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    private readonly _settings$ = new BehaviorSubject<SiteSettings | null>(null);
    readonly settings$ = this._settings$.asObservable();

    constructor(private api: ApiService) {
        this.loadSettings();
    }

    loadSettings(): void {
        this.api.get<SiteSettings>('/settings').pipe(
            tap(settings => {
                this._settings$.next(settings);
            })
        ).subscribe({
            error: err => console.error('Failed to load settings', err)
        });
    }

    get currentSettings(): SiteSettings | null {
        return this._settings$.value;
    }
}
