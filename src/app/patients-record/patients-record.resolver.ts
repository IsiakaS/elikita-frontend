import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Bundle, BundleEntry, Encounter, Observation, Condition } from 'fhir/r4';
import { delay, map, catchError, of, forkJoin } from 'rxjs';
import { StateService } from '../shared/state.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const patientsRecordResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  const patientId = route.parent?.params['id'] || route.params['id'];

  const stateService = inject(StateService);
  const snackBar = inject(MatSnackBar);
  stateService.setCurrentEncounter(null);
  stateService.currentPatientIdFromResolver.next(patientId);

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
    // Fetch patient encounters
    http.get<Bundle<Encounter>>(`${baseUrl}/Encounter?patient=${patientId}&_count=200`).pipe(
      map((encounters: Bundle<Encounter>) => {
        console.log('Successfully fetched encounters from FHIR server:', encounters);
        //check for encounters in progress
        const encountersInProgress = encounters?.entry?.filter((encounter: BundleEntry<Encounter>) => encounter.resource?.status === 'in-progress');
        if (encountersInProgress && encountersInProgress.length > 0) {
          const active = encountersInProgress[0].resource as Encounter;
          // Ensure period.start present (fallback to current time if missing)
          if (!active.period) { (active as any).period = { start: new Date().toISOString() }; }
          else if (!active.period.start) { (active.period as any).start = new Date().toISOString(); }
          // Attach a derived participantsDisplay for richer notice messaging
          const participantsDisplay = (active.participant || [])
            .map(p => p.individual?.display || p.individual?.reference || 'Unknown')
            .filter(Boolean);
          stateService.setCurrentEncounter({
            ...active, status: 'in-progress',
            patientId: patientId
          });

          // Notify user with encounter date and participants
          const dateText = active.period?.start ? new Date(active.period.start).toLocaleString() : 'Unknown date';
          const participantsText = participantsDisplay.length ? participantsDisplay.join(', ') : 'No participants recorded';
          snackBar.open(`Encounter already in progress from ${dateText}. Participants: ${participantsText}.`, undefined, {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }

        return encounters.entry?.map((encounter: BundleEntry<Encounter>) => encounter.resource);
      })),
    // Fetch patient conditions
    http.get<Bundle<Condition>>(`${baseUrl}/Condition?patient=${patientId}&_count=200`).pipe(
      map((conditions: Bundle<Condition>) => {
        console.log('Successfully fetched conditions from FHIR server:', conditions);
        return conditions.entry?.map((c: BundleEntry<Condition>) => c.resource) || [];
      }),
      catchError(err => {
        console.warn('Failed to load conditions:', err);
        return of([]);
      })
    ),
    // Fetch patient observations
    http.get<Bundle<Observation>>(`${baseUrl}/Observation?patient=${patientId}&_count=200`).pipe(
      map((observations: Bundle<Observation>) => {
        console.log('Successfully fetched observations from FHIR server:', observations);
        return observations.entry?.map((observation: BundleEntry<Observation>) => observation.resource) || [];
      }),
      catchError(err => {
        console.warn('Failed to load observations:', err);
        return of([]);
      })
    ),
    //medicationRequest
    // Fetch patient medication requests
    http.get<Bundle<any>>(`${baseUrl}/MedicationRequest?patient=${patientId}&_count=200`).pipe(
      map((medRequests) => medRequests.entry?.map((mr: BundleEntry<any>) => mr.resource) || [])
    ),
    //allergies
    http.get<Bundle<any>>(`${baseUrl}/AllergyIntolerance?patient=${patientId}&_count=200`).pipe(
      map((allergies: Bundle<any>) => {
        console.log('Successfully fetched allergies from FHIR server:', allergies);
        return allergies.entry?.map((a: BundleEntry<any>) => a.resource) || [];
      })),
    //fetch patient labRequests - service Requests filtered to laboratory type
    http.get<Bundle<any>>(`${baseUrl}/ServiceRequest?patient=${patientId}&_count=199`).pipe(
      map((labRequests: Bundle<any>) => {
        console.log('Successfully fetched lab requests from FHIR server:', labRequests);
        return labRequests.entry?.map((lr: BundleEntry<any>) => lr.resource) || [];
      })),
    //specimens
    http.get<Bundle<any>>(`${baseUrl}/Specimen?patient=${patientId}&_count=199`).pipe(
      map((bundle) => bundle.entry?.map((entry: BundleEntry<any>) => entry.resource) || []),
      catchError(() => of([]))
    ),
    //medications
    http.get<Bundle<any>>(`${baseUrl}/Medication?patient=${patientId}&_count=199`).pipe(
      map((bundle) => bundle.entry?.map((entry: BundleEntry<any>) => entry.resource) || []),
      catchError(() => of([]))
    ),
    //medicationDispense
    http.get<Bundle<any>>(`${baseUrl}/MedicationDispense?patient=${patientId}&_count=199`).pipe(
      map((bundle) => bundle.entry?.map((entry: BundleEntry<any>) => entry.resource) || []),
      catchError(() => of([]))
    ),
    //medicationAdministration
    http.get<Bundle<any>>(`${baseUrl}/MedicationAdministration?patient=${patientId}&_count=199`).pipe(
      map((bundle) => bundle.entry?.map((entry: BundleEntry<any>) => entry.resource) || []),
      catchError(() => of([]))
    )
  ]).pipe(map(([patient, encounters, conditions, observations, MedicationRequest, AllergyIntolerance, serviceRequests, specimens, medications, medicationDispenses, medicationAdministrations]) => {

    stateService.PatientResources.condition.next(
      (conditions || []).reverse().map((condition: any) => {
        // alert(JSON.stringify(condition));
        return ({

          referenceId: condition.id ? `Condition/${condition.id}` : null,
          savedStatus: 'saved',
          actualResource: condition
        })
      })
    )
    stateService.PatientResources.observations.next(
      (observations || []).map((observation: any) => ({
        referenceId: observation.id ? `Observation/${observation.id}` : null,
        savedStatus: 'saved',
        actualResource: observation
      }))
    )

    stateService.PatientResources.encounters.next(
      (encounters || []).map((encounter: any) => ({
        referenceId: encounter.id ? `Encounter/${encounter.id}` : null,
        savedStatus: 'saved',
        actualResource: encounter
      }))
    );

    stateService.PatientResources.currentPatient.next({
      referenceId: patient.id ? `Patient/${patient.id}` : null,
      savedStatus: 'saved',
      actualResource: patient
    });

    stateService.PatientResources.serviceRequests.next(
      (serviceRequests || []).map((serviceRequest: any) => ({
        referenceId: serviceRequest.id ? `ServiceRequest/${serviceRequest.id}` : null,
        savedStatus: 'saved',
        actualResource: serviceRequest
      }))
    );
    //medicationRequest
    stateService.PatientResources.medicationRequests.next(
      (MedicationRequest || []).reverse().map((medRequest: any) => ({
        referenceId: medRequest.id ? `MedicationRequest/${medRequest.id}` : null,
        savedStatus: 'saved',
        actualResource: medRequest
      }))
    );
    stateService.PatientResources.specimens.next(
      (specimens || []).map(specimen => ({
        referenceId: specimen.id ? `Specimen/${specimen.id}` : null,
        savedStatus: 'saved',
        actualResource: specimen
      }))
    );
    stateService.PatientResources.medications.next(
      (medications || []).map(med => ({
        referenceId: med.id ? `Medication/${med.id}` : null,
        savedStatus: 'saved',
        actualResource: med
      }))
    );
    stateService.PatientResources.medicationDispenses.next(
      (medicationDispenses || []).map(medDispense => ({
        referenceId: medDispense.id ? `MedicationDispense/${medDispense.id}` : null,
        savedStatus: 'saved',
        actualResource: medDispense
      }))
    );
    stateService.PatientResources.medicationAdministrations.next(
      (medicationAdministrations || []).map(medAdmin => ({
        referenceId: medAdmin.id ? `MedicationAdministration/${medAdmin.id}` : null,
        savedStatus: 'saved',
        actualResource: medAdmin
      }))
    );
    // Preserve direct access to patient name/gender/etc while adding arrays
    return {
      ...patient,
      encounter: encounters || [],
      condition: conditions || [],
      observations: observations || []
    };
  },

  ),
    catchError(err => {
      console.error('❌ Failed to load patient record data:', err);
      snackBar.open('Failed to load patient record data', undefined, {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      })
      throw new Error('Failed to load patient record data');

    })

  )

}

