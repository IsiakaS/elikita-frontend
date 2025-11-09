import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Bundle } from 'fhir/r4';
import { catchError, of } from 'rxjs';
import { ErrorService } from '../shared/error.service';

// Fetch a broad set of patients for all tabs (pending/approved/deceased) so children can filter locally.
export const patientRegistrationCenterResolver: ResolveFn<Bundle> = () => {
    const http = inject(HttpClient);
    const errorService = inject(ErrorService);
    const baseUrl = 'https://elikita-server.daalitech.com';
    const url = `${baseUrl}/Patient?_format=json&_count=100`;
    return http.get<Bundle>(url).pipe(
        catchError(err => {
            console.error('Failed to load patient registration center bundle', err);
            errorService.openandCloseError('Failed to load patient registrations');
            return of({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] } as Bundle);
        })
    );
}
