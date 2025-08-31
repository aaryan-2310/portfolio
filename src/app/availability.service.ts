import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly STORAGE_KEY = 'availability';
  private readonly OWNER_KEY = 'owner';
  private readonly _available$ = new BehaviorSubject<boolean>(true);

  readonly available$ = this._available$.asObservable();

  constructor() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored === 'available' || stored === 'unavailable') {
        this._available$.next(stored === 'available');
      }
    } catch {
      /* empty */
    }
  }

  get value(): boolean {
    return this._available$.value;
  }

  setAvailable(v: boolean): void {
    this._available$.next(v);
    try {
      localStorage.setItem(this.STORAGE_KEY, v ? 'available' : 'unavailable');
    } catch {
      /* empty */
    }
  }

  toggle(): void {
    this.setAvailable(!this._available$.value);
  }

  get isOwner(): boolean {
    try {
      return localStorage.getItem(this.OWNER_KEY) === '1';
    } catch {
      return false;
    }
  }
}
