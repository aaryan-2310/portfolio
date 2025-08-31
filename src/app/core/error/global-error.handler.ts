import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { GlobalErrorService } from './global-error.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    try {
      const svc = this.injector.get(GlobalErrorService);
      svc.report(error);
    } catch {
      // Swallow errors from error reporting to avoid infinite loops
    }
    // Always log for visibility during development/CI
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
