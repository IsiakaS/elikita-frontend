import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Bundle, BundleEntry, Specimen, Medication, MedicationDispense, MedicationAdministration, ServiceRequest, Location, MedicationRequest } from 'fhir/r4';
import { forkJoin, map, catchError, of, tap } from 'rxjs';
import { StateService } from '../shared/state.service';

const baseUrl = 'https://elikita-server.daalitech.com';

const bundleToResources = <T>(bundle: Bundle<T> | null | undefined): T[] =>
  bundle?.entry?.map((entry: BundleEntry<T>) => entry.resource as T).filter(Boolean) ?? [];

export const appWrapperDataResolver: ResolveFn<boolean> = (route) => {
  const http = inject(HttpClient);
  const stateService = inject(StateService);

  // Patient is optional; keep existing resolver signature but don’t block execution
  const patientId =
    stateService.currentPatientIdFromResolver.getValue() ??
    route.parent?.params['id'] ??
    route.params['id'] ??
    null;

  return forkJoin({
    locations: http.get<Bundle<Location>>(`${baseUrl}/Location?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    specimens: http.get<Bundle<Specimen>>(`${baseUrl}/Specimen?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    medications: http.get<Bundle<Medication>>(`${baseUrl}/Medication?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    medicationDispenses: http.get<Bundle<MedicationDispense>>(`${baseUrl}/MedicationDispense?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    medicationAdministrations: http.get<Bundle<MedicationAdministration>>(`${baseUrl}/MedicationAdministration?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    medicationRequests: http.get<Bundle<MedicationRequest>>(`${baseUrl}/MedicationRequest?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    ),
    serviceRequests: http.get<Bundle<ServiceRequest>>(`${baseUrl}/ServiceRequest?_count=199`).pipe(
      map(bundleToResources),
      catchError(() => of([]))
    )
  }).pipe(
    tap(({ locations, specimens, medications, medicationDispenses, medicationAdministrations, serviceRequests, medicationRequests }) => {
      stateService.orgWideResources.locations.next(
        locations.map(loc => ({
          referenceId: loc.id ? `Location/${loc.id}` : null,
          savedStatus: 'saved',
          actualResource: loc
        }))
      );
      stateService.orgWideResources.specimens.next(
        specimens.map(specimen => ({
          referenceId: specimen.id ? `Specimen/${specimen.id}` : null,
          savedStatus: 'saved',
          actualResource: specimen
        }))
      );
      stateService.orgWideResources.medications.next(
        medications.map(med => ({
          referenceId: med.id ? `Medication/${med.id}` : null,
          savedStatus: 'saved',
          actualResource: med
        }))
      );
      stateService.orgWideResources.medicationDispenses.next(
        medicationDispenses.map(medDispense => ({
          referenceId: medDispense.id ? `MedicationDispense/${medDispense.id}` : null,
          savedStatus: 'saved',
          actualResource: medDispense
        }))
      );
      stateService.orgWideResources.medicationAdministrations.next(
        medicationAdministrations.map(medAdmin => ({
          referenceId: medAdmin.id ? `MedicationAdministration/${medAdmin.id}` : null,
          savedStatus: 'saved',
          actualResource: medAdmin
        }))
      );
      stateService.orgWideResources.medicationRequests.next(
        medicationRequests.map(medReq => ({
          referenceId: medReq.id ? `MedicationRequest/${medReq.id}` : null,
          savedStatus: 'saved',
          actualResource: medReq
        }))
      );
      stateService.orgWideResources.serviceRequests.next(
        serviceRequests.map(sr => ({
          referenceId: sr.id ? `ServiceRequest/${sr.id}` : null,
          savedStatus: 'saved',
          actualResource: sr
        }))
      );
    }),
    map(() => true),
    catchError(() => of(true))
  );
};
