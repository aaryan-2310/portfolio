import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly _errors$ = new Subject<string>();
  readonly errors$ = this._errors$.asObservable();

  report(error: unknown): void {
    const message = this._stringify(error);
    this._errors$.next(message);
  }

  private _stringify(error: unknown): string {
    if (error instanceof Error) return error.message || 'Unexpected error';
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return 'An unexpected error occurred.';
    }
  }
}
