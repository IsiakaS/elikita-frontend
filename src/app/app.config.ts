import { ApplicationConfig, InjectionToken, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './loading.interceptor';

export const frontendUrlToken = new InjectionToken('base url on the frontend for resources')

export const frontendUrlValue = "/app"
export const appConfig: ApplicationConfig = {

  providers: [provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes), provideHttpClient(
    withInterceptors([loadingInterceptor])
  ), { provide: frontendUrlToken, useValue: frontendUrlValue }]
};
