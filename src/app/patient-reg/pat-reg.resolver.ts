import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
// Using FHIR R4 Bundle typing; adjust if a local R4 type wrapper exists
import { Bundle } from 'fhir/r4';
import { ErrorService } from '../shared/error.service';
import { catchError, of } from 'rxjs';

/**
 * Resolver: Fetch a page of Patient registrations from the Elikita FHIR R4 server.
 * Enhancements:
 *  - Switched base URL to https://elikita-server.daalitech.com
 *  - Targeting R4 (previously R5 fire.ly sandbox)
 *  - Added basic error handling -> returns empty Bundle shape on failure so component can still render gracefully
 */
export const patRegResolver: ResolveFn<Bundle> | [] = (route, state) => {
  const http = inject(HttpClient);
  const errorService = inject(ErrorService);

  const baseUrl = 'https://elikita-server.daalitech.com'; // FHIR R4 base (assumed)
  // If server expects versioned path like /r4, change to `${baseUrl}/r4/Patient`.
  // Only filter by active on the server; exclude deceased client-side after retrieval as requested.
  // Prefer :not to include records where active is missing; if unsupported, fall back to broader fetch.
  const primary = `${baseUrl}/Patient?_format=json&active:not=true`;
  const fallback = `${baseUrl}/Patient?_format=json`;

  return http.get<Bundle>(primary).pipe(
    catchError(err => {
      console.warn('active:not=true may be unsupported; falling back to broad fetch.', err);
      return http.get<Bundle>(fallback);
    }),
    catchError(err => {
      console.error('❌ Failed to load patient registrations:', err);
      errorService.openandCloseError('Failed to load patient registrations');
      // Return an empty Bundle structure to avoid null checks downstream
      return of({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] } as Bundle);
    })
  );
};