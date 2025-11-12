import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Bundle, BundleEntry, Encounter, Observation } from 'fhir/r4';
import { delay, map, catchError, of, forkJoin } from 'rxjs';
import { StateService } from '../shared/state.service';

export const patientsRecordResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  const patientId = route.parent?.params['id'] || route.params['id'];
  const stateService = inject(StateService);

  console.log('Resolving patient data for ID:', patientId);

  const baseUrl = 'https://elikita-server.daalitech.com';

  // Try to fetch from live FHIR server first
  return forkJoin([
    http.get(`${baseUrl}/Patient/${patientId}`).pipe(
      map((patient: any) => {
        console.log('Successfully fetched patient from FHIR server:', patient);
        return patient;
      }),
      catchError(error => {
        console.warn('Failed to fetch from FHIR server, falling back to static data:', error);

        // Fallback to static JSON data
        return http.get("sample_fhir_patients.json").pipe(
          map((allArray: any) => {
            const foundPatient = allArray.find((element: any) => {
              // Check multiple possible ID formats for compatibility
              return element.identifier?.[0]?.value === patientId ||
                element.id === patientId ||
                element.identifier?.value === patientId;
            });

            if (foundPatient) {
              console.log('Found patient in static data:', foundPatient);
            } else {
              console.error('Patient not found in static data for ID:', patientId);
            }

            return foundPatient;
          }),
          catchError(staticError => {
            console.error('Failed to load static data as well:', staticError);
            return of(null); // Return null if both sources fail
          })
        );
      }),
      // delay(500) // Reduced delay for better UX
    ),
    //fetch patient encounters
    http.get<Bundle<Encounter>>(`${baseUrl}/Encounter?patient=${patientId}`).pipe(
      map((encounters: Bundle<Encounter>) => {
        console.log('Successfully fetched encounters from FHIR server:', encounters);
        //check for encounters in progress
        const encountersInProgress = encounters?.entry?.filter((encounter: BundleEntry<Encounter>) => encounter.resource?.status === 'in-progress');
        if (encountersInProgress && encountersInProgress.length > 0) {
          //set the first encounter in progress as current encounter
          stateService.setCurrentEncounter({ ...encountersInProgress[0].resource, status: 'in-progress' });
        }

        return encounters.entry?.map((encounter: BundleEntry<Encounter>) => encounter.resource);
      })),
    //fetch patient observations,
    http.get<Bundle<Observation>>(`${baseUrl}/Observation?patient=${patientId}`).pipe(
      map((observations: Bundle<Observation>) => {
        console.log('Successfully fetched observations from FHIR server:', observations);
        return observations.entry?.map((observation: BundleEntry<Observation>) => observation.resource);
      }))


  ]).pipe(map(([patient, encounters, observations]) => {
    return patient;
  })
  );


};

