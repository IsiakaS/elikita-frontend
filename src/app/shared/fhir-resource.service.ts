import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { backendEndPointToken } from '../app.config';
import { Observable, of, map, catchError } from 'rxjs';
import { StateService } from './state.service';
import { UtilityService } from './utility.service';
import { Resource, Bundle } from 'fhir/r4';

interface PostOpts {
    patientId?: string;
    encounterId?: string;
    performerId?: string;
    defaultStatus?: string;
    codeFieldNames?: string[];
    referenceFieldNames?: string[];
}

@Injectable({ providedIn: 'root' })
export class FhirResourceService {
    constructor(
        private http: HttpClient,
        @Inject(backendEndPointToken) private baseUrl: string,
        private state: StateService,
        private util: UtilityService
    ) { }

    postResource(resourceType: string, values: any, opts?: PostOpts): Observable<{ saved: boolean; resource: Resource }> {
        const resource = this.util.buildFhirResource(resourceType, values, opts) as Resource;
        return this.http.post<Resource>(this.baseUrl, resource, {
            headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' }
        }).pipe(
            map((resp) => {
                const finalRes = { ...resource, ...resp };
                this.state.persistLocalResource(finalRes, 'saved');
                return { saved: true, resource: finalRes };
            }),
            catchError(err => {
                console.error('POST resource failed:', err);
                // Persist locally only once (unsaved) if server failed
                this.state.persistLocalResource(resource, 'unsaved');
                return of({ saved: false, resource });
            })
        );
    }

    postBundle(bundle: Bundle): Observable<{ saved: boolean; bundle: Bundle }> {
        return this.http.post<Bundle>(this.baseUrl, bundle, {
            headers: { 'Content-Type': 'application/fhir+json', Accept: 'application/fhir+json' }
        }).pipe(
            map(resp => {
                this.state.processBundleTransaction(resp);
                return { saved: true, bundle: resp };
            }),
            // catchError(err => {
            //     console.error('POST bundle failed:', err);
            //     // Fallback: process original bundle locally as unsaved
            //     this.state.processBundleTransaction(bundle);
            //     return of({ saved: false, bundle });
            // })
        );
    }
}
