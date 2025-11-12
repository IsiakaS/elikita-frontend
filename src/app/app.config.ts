import { ApplicationConfig, InjectionToken, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from './loading.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const frontendUrlToken = new InjectionToken('base url on the frontend for resources')
export const backendUrlforSamplesToken = new InjectionToken<string>('backend url used for fetching sample data for this frontend');
export const backendUrlforSamplesValue = 'https://hapi.fhir.org'
export const backendUrlforSamplesToken2 = new InjectionToken<string>('backend-2 url used for fetching sample data for this frontend');
export const backendUrlforSamplesValue2 = 'https://server.fire.ly'


export const backendEndPointToken = new InjectionToken<string>('backend api base url');
export const backendEndPointValue = "https://elikita-server.daalitech.com"
// export const backendEndPointValue = "https://hapi.fhir.org/baseR4"

export const frontendUrlValue = "/app"
export const appConfig: ApplicationConfig = {

  providers: [

    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes),
    { provide: backendEndPointToken, useValue: backendEndPointValue },
    { provide: DateAdapter, useFactory: adapterFactory },

    provideHttpClient(
      withInterceptors([loadingInterceptor])
    ), { provide: frontendUrlToken, useValue: frontendUrlValue },
    { provide: backendUrlforSamplesToken, useValue: backendUrlforSamplesValue },
    { provide: backendUrlforSamplesToken2, useValue: backendUrlforSamplesValue2 }]
};
