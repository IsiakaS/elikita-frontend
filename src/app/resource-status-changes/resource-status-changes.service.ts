import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { backendEndPointToken } from '../app.config';
import { catchError, map } from 'rxjs';

interface StatusLookupEntry {
    /** FHIR value set source or label */
    source: string;
    codes: string[];
}

const RESOURCE_STATUS_LOOKUP: Record<string, StatusLookupEntry> = {
    Location: {
        source: 'FHIR Location status (https://www.hl7.org/fhir/location-definitions.html)',
        codes: ['active', 'suspended', 'inactive']
    },
    MedicationRequest: {
        source: 'MedicationRequest.status (https://www.hl7.org/fhir/medicationrequest-definitions.html#MedicationRequest.status)',
        codes: ['active', 'completed', 'entered-in-error', 'on-hold', 'revoked', 'unknown', 'draft']
    },
    ServiceRequest: {
        source: 'ServiceRequest.status (https://www.hl7.org/fhir/servicerequest-definitions.html#ServiceRequest.status)',
        codes: ['draft', 'active', 'on-hold', 'revoked', 'completed', 'entered-in-error', 'unknown']
    },
    Specimen: {
        source: 'Specimen.status (https://www.hl7.org/fhir/specimen.html#specimen-status)',
        codes: ['available', 'unavailable', 'unsatisfactory', 'entered-in-error', 'unknown', 'ready']
    },
    MedicationDispense: {
        source: 'MedicationDispense.status (https://www.hl7.org/fhir/medicationdispense-definitions.html#MedicationDispense.status)',
        codes: ['preparation', 'in-progress', 'cancelled', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown']
    },
    Observation: {
        source: 'Observation.status (https://www.hl7.org/fhir/observation.html#status)',
        codes: ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown']
    },
    Condition: {
        source: 'Condition.clinicalStatus (https://www.hl7.org/fhir/condition-definitions.html#Condition.clinicalStatus)',
        codes: ['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved']
    },
    MedicationAdministration: {
        source: 'MedicationAdministration.status (https://www.hl7.org/fhir/medicationadministration-definitions.html#MedicationAdministration.status)',
        codes: ['in-progress', 'on-hold', 'completed', 'entered-in-error', 'stopped', 'unknown']
    },
    Task: {
        source: 'Task.status (https://www.hl7.org/fhir/task-definitions.html#Task.status)',
        codes: ['draft', 'requested', 'received', 'accepted', 'rejected', 'ready', 'cancelled', 'in-progress', 'on-hold', 'failed', 'completed', 'entered-in-error']
    },
    Encounter: {
        source: 'Encounter.status (https://www.hl7.org/fhir/encounter-definitions.html#Encounter.status)',
        codes: ['planned', 'arrived', 'triaged', 'in-progress', 'onleave', 'finished', 'cancelled']
    }
};

@Injectable({ providedIn: 'root' })
export class ResourceStatusChangesService {
    private http = inject(HttpClient);
    private backend = inject(backendEndPointToken);

    getStatusLookup(resourceType: string): StatusLookupEntry | undefined {
        return RESOURCE_STATUS_LOOKUP[resourceType];
    }

    getStatusCodes(resourceType: string): string[] {
        return this.getStatusLookup(resourceType)?.codes ?? [];
    }

    changeResourceStatus(resourceType: string, resourceId: string, newStatus: string) {
        const endpoint = `${this.backend}/${resourceType}/${resourceId}`;
        const payload = { status: newStatus };
        return this.http.patch(endpoint, payload, {
            headers: { 'Content-Type': 'application/json-patch+json' }
        }).pipe(
            map(response => ({ resourceType, resourceId, status: newStatus, response })),
            catchError((error) => {
                console.error(`Failed to change status for ${resourceType}/${resourceId}`, error);
                throw error;
            })
        );
    }
}
