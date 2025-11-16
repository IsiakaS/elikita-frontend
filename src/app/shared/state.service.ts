import { Injectable } from '@angular/core';
import { Encounter, Observation, Resource } from 'fhir/r4';
import { Condition, Medication, MedicationRequest, Patient } from 'fhir/r4';
import { BehaviorSubject, mergeMapTo, Observable } from 'rxjs';
import { Bundle, Reference } from 'fhir/r4';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor() { }

  currentEncounter: BehaviorSubject<null | {
    status: Encounter['status'],
    patientId: string,
    [key: string]: any
  }> = new BehaviorSubject<null | {
    status: Encounter['status'],
    patientId: string,
    [key: string]: any
  }>(null);

  //have all current encounter Resources here as beaahiour subject with referenceId, savedStatus & actualResources
  currentEncounterResources = {
    observations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Observation
    }>>([]),
    diagnosis: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Condition
    }>>([]),
    medications: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationRequest
    }>>([]),



  }

  //full resources for patient

  PatientResources = {
    observations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Observation
    }>>([]),
    //add more resource types as needed
    condition: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Condition
    }>>([]),
    medicationRequests: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationRequest
    }>>([]),
    encounters: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Encounter
    }>>([]),
    currentPatient: new BehaviorSubject<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Patient
    }>({
      referenceId: null,
      savedStatus: 'unsaved',
      actualResource: {} as Patient
    }),

  }



  private encounterChecklistCompleted = new BehaviorSubject<boolean>(false);
  encounterChecklistCompleted$ = this.encounterChecklistCompleted.asObservable();

  setCurrentEncounter(encounter: null | {
    status: Encounter['status'],
    [key: string]: any
  }) {
    (this.currentEncounter as BehaviorSubject<null | {
      status: Encounter['status'],
      [key: string]: any
    }>).next(encounter);


  }

  currentHospital: Observable<{
    id: string,
    name: string,
    [key: string]: any
  }> = new BehaviorSubject({
    id: '1234567890',
    name: 'e-Likita General Hospital'
  })

  setCurrentHospital(hospital: {
    id: string,
    name: string,
    [key: string]: any
  }) {
    (this.currentHospital as BehaviorSubject<{
      id: string,
      name: string,
      [key: string]: any
    }>).next(hospital);
  }

  setEncounterChecklistCompleted(completed: boolean) {
    this.encounterChecklistCompleted.next(completed);
  }

  resetEncounterChecklist() {
    this.encounterChecklistCompleted.next(false);
  }

  addEncounterToPatientResources(encounter: Encounter, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
    const item = {
      referenceId: this.toRefId(encounter),
      savedStatus,
      actualResource: encounter
    };
    this.upsertToSubject(this.PatientResources.encounters, item);
  }

  /**
   * Accepts a FHIR Bundle (e.g., type: 'transaction' or 'batch'), iterates entries,
   * and adds resources to PatientResources. If a resource is linked to the current
   * encounter (resource.encounter.reference === 'Encounter/{currentEncounterId}'),
   * it will also be added to currentEncounterResources in the appropriate collection.
   */
  processBundleTransaction(bundle: Bundle) {
    const entries = bundle?.entry ?? [];
    for (const e of entries) {
      const resource = e.resource as Resource | undefined;
      if (!resource) continue;
      const status: 'saved' | 'unsaved' = resource.id ? 'saved' : 'unsaved';

      // Add to overall patient resources
      this.addResourceToPatientResources(resource, status);

      // If tied to the current encounter, mirror into currentEncounterResources
      if (this.isResourceForCurrentEncounter(resource)) {
        this.addResourceToCurrentEncounterResources(resource, status);
      }
    }
  }

  // ---------------------- Helpers ----------------------

  public toRefId(resource: Resource | { resourceType?: string; id?: string } | undefined | null): string | null {
    if (!resource || !resource.resourceType || !resource.id) return null;
    return `${resource.resourceType}/${resource.id}`;
  }

  private getCurrentEncounterId(): string | null {
    const ce = this.currentEncounter.value;
    const id = (ce && (ce as any).id) ? String((ce as any).id) : null;
    return id ?? null;
  }

  getCurrentEncounterReference(): Reference | null {
    const id = this.getCurrentEncounterId();
    return id ? this.buildReference('Encounter', id) : null;
  }

  getPatientReference(): Reference | null {
    const patient = this.PatientResources.currentPatient.value?.actualResource;
    const id = patient?.id;
    return id ? this.buildReference('Patient', id) : null;
  }

  getPractitionerReference(practitionerId?: string | null): Reference | null {
    // Provide the ID from the caller (e.g., from auth.user.userId). We avoid injecting AuthService here.
    if (!practitionerId) return null;
    return this.buildReference('Practitioner', practitionerId);
  }

  private buildReference(resourceType: 'Patient' | 'Encounter' | 'Practitioner', id: string): Reference {
    return { reference: `${resourceType}/${id}` };
  }

  public isResourceForCurrentEncounter(resource: Resource): boolean {
    const currentEncId = this.getCurrentEncounterId();
    const encRef = (resource as any)?.encounter?.reference as string | undefined;
    if (!currentEncId || !encRef) return false;
    // Basic match: 'Encounter/{id}'. If full URL is provided elsewhere, you can normalize here.
    return encRef === `Encounter/${currentEncId}`;
  }

  private upsertToSubject<T extends { referenceId: string | null }>(
    subject: BehaviorSubject<T[]>,
    item: T
  ) {
    const list = subject.value.slice();
    const idx = item.referenceId
      ? list.findIndex(x => x.referenceId === item.referenceId)
      : -1;
    if (idx > -1) list[idx] = item;
    else list.push(item);
    subject.next(list);
  }

  private addResourceToPatientResources(resource: Resource, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
    const referenceId = this.toRefId(resource);
    switch (resource.resourceType) {
      case 'Observation': {
        this.upsertToSubject(this.PatientResources.observations, {
          referenceId,
          savedStatus,
          actualResource: resource as Observation
        });
        break;
      }
      case 'Condition': {
        this.upsertToSubject(this.PatientResources.condition, {
          referenceId,
          savedStatus,
          actualResource: resource as Condition
        });
        break;
      }
      case 'MedicationRequest': {
        this.upsertToSubject(this.PatientResources.medicationRequests, {
          referenceId,
          savedStatus,
          actualResource: resource as MedicationRequest
        });
        break;
      }
      case 'Encounter': {
        this.addEncounterToPatientResources(resource as Encounter, savedStatus);
        break;
      }
      case 'Patient': {
        this.PatientResources.currentPatient.next({
          referenceId,
          savedStatus,
          actualResource: resource as Patient
        });
        break;
      }
      default:
        // Unsupported resource types can be handled here if needed.
        break;
    }
  }

  private addResourceToCurrentEncounterResources(resource: Resource, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
    const referenceId = this.toRefId(resource);
    switch (resource.resourceType) {
      case 'Observation': {

        this.upsertToSubject(this.currentEncounterResources.observations, {
          referenceId,
          savedStatus,
          actualResource: resource as Observation
        });
        break;
      }
      case 'Condition': {
        this.upsertToSubject(this.currentEncounterResources.diagnosis, {
          referenceId,
          savedStatus,
          actualResource: resource as Condition
        });
        break;
      }
      case 'MedicationRequest': {
        this.upsertToSubject(this.currentEncounterResources.medications, {
          referenceId,
          savedStatus,
          actualResource: resource as MedicationRequest
        });
        break;
      }
      default:
        // Non-encounter-list resources are ignored here (e.g., Encounter itself).
        break;
    }
  }

}

