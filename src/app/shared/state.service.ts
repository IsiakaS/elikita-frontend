import { Injectable } from '@angular/core';
import { Encounter, Observation, Resource, ServiceRequest, Specimen, MedicationDispense, MedicationAdministration, Task } from 'fhir/r4';
import { Condition, Medication, MedicationRequest, Patient, Location } from 'fhir/r4';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';
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

  currentPatientIdFromResolver = new BehaviorSubject<string | null>(null);

  // ✅ NEW: Reactive stream for current patient ID with multiple source fallback
  // currentPatientId$: Observable<string | null> = combineLatest([
  //   this.PatientResources.currentPatient,
  //   this.currentEncounter,
  //   this.currentPatientIdFromResolver
  // ]).pipe(
  //   map(([patientWrapper, encounter, resolverId]) => {
  //     // Priority 1: Check encounter's patient reference
  //     if (encounter?.['subject']?.reference) {
  //       const patientRef = encounter['subject'].reference;
  //       const match = patientRef.match(/^Patient\/(.+)$/);
  //       if (match) return match[1];
  //       if (!patientRef.includes('/')) return patientRef;
  //     }

  //     // Priority 2: Check current patient resource
  //     if (patientWrapper?.actualResource?.id) {
  //       return patientWrapper.actualResource.id;
  //     }

  //     // Priority 3: Check patient ID from resolver
  //     if (resolverId) {
  //       return resolverId;
  //     }

  //     // No patient ID found
  //     return null;
  //   }),
  //   distinctUntilChanged(), // Only emit when ID actually changes
  //   shareReplay(1) // Cache latest value for late subscribers
  // );

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
    medicationRequests: new BehaviorSubject<Array<{
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
    specimens: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Specimen
    }>>([]),
    medications: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Medication
    }>>([]),
    medicationDispenses: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationDispense
    }>>([]),
    medicationAdministrations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationAdministration
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
    serviceRequests: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Resource
    }>>([]),
    tasks: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Task
    }>>([]),
  }



  orgWideResources = {
    patient: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Patient
    }>>([]),

    observations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Observation
    }>>([]),
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
    specimens: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Specimen
    }>>([]),
    medications: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Medication
    }>>([]),
    medicationDispenses: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationDispense
    }>>([]),
    medicationAdministrations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: MedicationAdministration
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
    serviceRequests: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Resource
    }>>([]),
    tasks: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Task
    }>>([]),
    locations: new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: Location
    }>>([])
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

  processOrgWideBundleTransaction(bundle: Bundle) {
    const entries = bundle?.entry ?? [];
    for (const entry of entries) {
      const resource = entry.resource as Resource | undefined;
      if (!resource) continue;
      const status: 'saved' | 'unsaved' = resource.id ? 'saved' : 'unsaved';
      this.addResourceToOrgWideResources(resource, status);
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
    else list.unshift(item);
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
      case 'Specimen': {
        this.upsertToSubject(this.PatientResources.specimens, {
          referenceId,
          savedStatus,
          actualResource: resource as Specimen
        });
        break;
      }
      case 'Medication': {
        this.upsertToSubject(this.PatientResources.medications, {
          referenceId,
          savedStatus,
          actualResource: resource as Medication
        });
        break;
      }
      case 'MedicationDispense': {
        this.upsertToSubject(this.PatientResources.medicationDispenses, {
          referenceId,
          savedStatus,
          actualResource: resource as MedicationDispense
        });
        break;
      }
      case 'MedicationAdministration': {
        this.upsertToSubject(this.PatientResources.medicationAdministrations, {
          referenceId,
          savedStatus,
          actualResource: resource as MedicationAdministration
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
      // case 'ServiceRequest': {
      //   this.upsertToSubject(this.PatientResources.serviceRequests, {
      //     referenceId,
      //     savedStatus,
      //     actualResource: resource as ServiceRequest
      //   });
      //   break;

      // }
      case 'ServiceRequest': {
        this.upsertToSubject(this.PatientResources.serviceRequests, {
          referenceId,
          savedStatus,
          actualResource: resource as ServiceRequest
        });
        break;
      }
      case 'Task': {
        this.upsertToSubject(this.PatientResources.tasks, {
          referenceId,
          savedStatus,
          actualResource: resource as Task
        });
        break;
      }
      default:
        // Unsupported resource types can be handled here if needed.
        break;
    }
  }

  private addResourceToOrgWideResources(resource: Resource, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
    const referenceId = this.toRefId(resource);
    switch (resource.resourceType) {
      case 'Observation':
        this.upsertToSubject(this.orgWideResources.observations, { referenceId, savedStatus, actualResource: resource as Observation });
        break;
      case 'Condition':
        this.upsertToSubject(this.orgWideResources.condition, { referenceId, savedStatus, actualResource: resource as Condition });
        break;
      case 'MedicationRequest':
        this.upsertToSubject(this.orgWideResources.medicationRequests, { referenceId, savedStatus, actualResource: resource as MedicationRequest });
        break;
      case 'Specimen':
        this.upsertToSubject(this.orgWideResources.specimens, { referenceId, savedStatus, actualResource: resource as Specimen });
        break;
      case 'Medication':
        this.upsertToSubject(this.orgWideResources.medications, { referenceId, savedStatus, actualResource: resource as Medication });
        break;
      case 'MedicationDispense':
        this.upsertToSubject(this.orgWideResources.medicationDispenses, { referenceId, savedStatus, actualResource: resource as MedicationDispense });
        break;
      case 'MedicationAdministration':
        this.upsertToSubject(this.orgWideResources.medicationAdministrations, { referenceId, savedStatus, actualResource: resource as MedicationAdministration });
        break;
      case 'Encounter':
        this.upsertToSubject(this.orgWideResources.encounters, { referenceId, savedStatus, actualResource: resource as Encounter });
        break;
      case 'ServiceRequest':
        this.upsertToSubject(this.orgWideResources.serviceRequests, { referenceId, savedStatus, actualResource: resource as ServiceRequest });
        break;
      case 'Task':
        this.upsertToSubject(this.orgWideResources.tasks, { referenceId, savedStatus, actualResource: resource as Task });
        break;
      default:
        break;
    }
  }

  // Decide if we should also add a current-encounter resource into PatientResources.
  // This ensures the resource belongs to the same patient as the current PatientResources.currentPatient.
  private maybeAddToPatientResources(resource: Resource, savedStatus: 'saved' | 'unsaved') {
    const encPatientId = this.currentEncounter.value?.patientId ?? null;
    const currentPatientId = this.PatientResources.currentPatient.value?.actualResource?.id ?? null;
    if (encPatientId && currentPatientId && encPatientId === currentPatientId) {
      this.addResourceToPatientResources(resource, savedStatus);
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
        // Also reflect into patient resources if the encounter's patient matches the current patient
        this.maybeAddToPatientResources(resource, savedStatus);
        break;
      }
      case 'Condition': {
        this.upsertToSubject(this.currentEncounterResources.diagnosis, {
          referenceId,
          savedStatus,
          actualResource: resource as Condition
        });
        // Also reflect into patient resources if the encounter's patient matches the current patient
        this.maybeAddToPatientResources(resource, savedStatus);
        break;
      }
      case 'MedicationRequest': {
        this.upsertToSubject(this.currentEncounterResources.medicationRequests, {
          referenceId,
          savedStatus,
          actualResource: resource as MedicationRequest
        });
        // Also reflect into patient resources if the encounter's patient matches the current patient
        this.maybeAddToPatientResources(resource, savedStatus);
        break;
      }
      default:
        // Non-encounter-list resources are ignored here (e.g., Encounter itself).
        break;
    }
  }
  // currentPatientIdFromResolver = new BehaviorSubject<string | null>(null);
  public isEncounterActive(): boolean {
    const enc = this.currentEncounter.value;
    return !!enc && ['in-progress', 'planned'].includes(enc.status);
  }

  public persistLocalResource(resource: Resource, savedStatus: 'saved' | 'unsaved') {
    if (this.isResourceForCurrentEncounter(resource)) {
      this.addResourceToCurrentEncounterResources(resource, savedStatus);
    } else {
      this.addResourceToPatientResources(resource, savedStatus);

    }
  }

  public persistPatientResource(resource: Resource, savedStatus: 'saved' | 'unsaved' = 'unsaved') {
    this.addResourceToPatientResources(resource, savedStatus);
  }


  public persistOrgWideResource(resource: Resource, savedStatus: 'saved' | 'unsaved') {
    this.addResourceToOrgWideResources(resource, savedStatus);
  }

  private buildCodeableConcept(raw: any): any {
    if (!raw) return null;
    if (typeof raw === 'string') {
      if (raw.includes('$#$')) {
        const [code = '', display = '', system = ''] = raw.split('$#$');
        return {
          coding: [{ code, display, system }],
          text: display || code
        };
      }
      return { text: raw };
    }
    if (raw.coding) return raw;
    return { text: String(raw) };
  }

  private buildObservationValue(values: any): { valueQuantity?: any; valueString?: string } {
    const rt = values?.value?.result_type;
    if (rt === 'Number') {
      const num = Number(values?.value?.result_value);
      if (!isNaN(num)) {
        return {
          valueQuantity: {
            value: num,
            unit: values?.value?.result_unit || undefined,
            system: 'http://unitsofmeasure.org',
            code: values?.value?.result_unit || undefined
          }
        };
      }
    }
    if (rt === 'Text') {
      const txt = values?.value?.result_value_text || values?.value?.result_value;
      if (txt) return { valueString: String(txt) };
    }
    return {};
  }

  /**
   * Build and persist an Observation from form values.
   * Expects keys: status, category, name, value (group), attachment(optional).
   * Returns { success, resource?, error? }.
   */
  public postObservation(values: any): { success: boolean; resource?: Observation; error?: string } {
    if (!this.isEncounterActive()) {
      return { success: false, error: 'No active encounter.' };
    }
    const patient = this.PatientResources.currentPatient.value?.actualResource;
    if (!patient?.id) {
      return { success: false, error: 'No current patient selected.' };
    }
    const encounterId = this.getCurrentEncounterId();
    if (!encounterId) {
      return { success: false, error: 'Encounter ID missing.' };
    }

    const status = (values?.status || 'preliminary').toLowerCase();
    const categoryCC = this.buildCodeableConcept(values?.category);
    const codeCC = this.buildCodeableConcept(values?.name);
    const valuePart = this.buildObservationValue(values);
    const nowIso = new Date().toISOString();

    const obs: Observation = {
      resourceType: 'Observation',
      status,
      subject: { reference: `Patient/${patient.id}` },
      encounter: { reference: `Encounter/${encounterId}` },
      effectiveDateTime: nowIso,
      // ...(categoryCC ? { category: [categoryCC] } : {}),
      category: categoryCC || { text: 'Uncategorized' },
      // ...(codeCC ? { code: codeCC } : {}),
      ...valuePart,
      code: codeCC || { text: 'Unnamed Observation' }
    };

    // Simple attachment handling -> valueAttachment if single
    if (values?.attachment && Array.isArray(values.attachment) && values.attachment.length) {
      const first = values.attachment[0];
      if (first?.data) {
        (obs as any).valueAttachment = {
          contentType: first.type || first.contentType || 'application/octet-stream',
          data: first.data,
          title: first.name || first.title
        };
      }
    }

    // Persist
    this.addResourceToCurrentEncounterResources(obs, 'unsaved');
    return { success: true, resource: obs };
  }

  /**
   * Get current patient ID from multiple sources with fallback
   * Priority:
   * 1. Current encounter's patient reference
   * 2. Current patient resource ID
   * 3. Patient ID set by resolver
   * @returns Patient ID string or null if not found
   */
  // currentPatientIdFromResolver = new BehaviorSubject<string | null>(null);

  // ✅ NEW: Reactive stream for current patient ID with multiple source fallback
  currentPatientId$: Observable<string | null> = combineLatest([
    this.PatientResources.currentPatient,
    this.currentEncounter,
    this.currentPatientIdFromResolver
  ]).pipe(
    map(([patientWrapper, encounter, resolverId]) => {
      // Priority 1: Check encounter's patient reference
      if (encounter?.['subject']?.reference) {
        const patientRef = encounter['subject'].reference;
        const match = patientRef.match(/^Patient\/(.+)$/);
        if (match) return match[1];
        if (!patientRef.includes('/')) return patientRef;
      }

      // Priority 2: Check current patient resource
      if (patientWrapper?.actualResource?.id) {
        return patientWrapper.actualResource.id;
      }

      // Priority 3: Check patient ID from resolver
      if (resolverId) {
        return resolverId;
      }

      // No patient ID found
      return null;
    }),
    distinctUntilChanged(), // Only emit when ID actually changes
    shareReplay(1) // Cache latest value for late subscribers
  );


  /**
   * Get current patient data in various formats
   * @param format - 'id' | 'reference-string' | 'reference-object' | 'resource'
   * @returns Patient data in requested format, or null if not found
 

  /**
   * Helper: Extract display name from Patient resource
   */
  private getPatientDisplayName(patient: any): string | undefined {
    if (!patient?.name || !Array.isArray(patient.name) || patient.name.length === 0) {
      return undefined;
    }

    const name = patient.name[0];
    const given = Array.isArray(name.given) ? name.given.join(' ') : '';
    const family = name.family || '';

    const fullName = `${given} ${family}`.trim();
    return fullName || undefined;
  }

  /**
   * Clear all patient-scoped data when navigating away from patient routes
   * Should be called in ngOnDestroy of patient-scoped components
   * 
   * Implications of iterating and clearing:
   * ✅ Ensures complete cleanup - no stale data
   * ✅ Prevents memory leaks from accumulated arrays
   * ✅ Resets UI state consistently
   * ⚠️ Any active subscriptions will receive empty arrays
   * ⚠️ Components must handle empty states gracefully
   */
  clearCurrentPatientContext(): void {
    console.log('Clearing patient context from StateService');

    // Clear encounter
    this.setCurrentEncounter(null);

    // Clear patient ID from resolver
    this.currentPatientIdFromResolver.next(null);

    // Iterate through ALL PatientResources properties and reset them
    const resourceKeys = Object.keys(this.PatientResources) as Array<keyof typeof this.PatientResources>;

    resourceKeys.forEach(key => {
      const subject = this.PatientResources[key];

      if (key === 'currentPatient') {
        // Special handling for currentPatient (single object, not array)
        (subject as BehaviorSubject<{
          referenceId: null,
          savedStatus: 'saved' | 'unsaved',
          actualResource: Patient
        }>).next({
          referenceId: null,
          savedStatus: 'unsaved',
          actualResource: {} as Patient
        })
      } else {
        // All other resources are arrays
        (subject as BehaviorSubject<any[]>).next([]);
      }
    });

    console.log('Patient context cleared successfully - all PatientResources reset');
  }

  /**
   * ✅ NEW: Check if a patient has an active admission
   * An active admission is defined as:
   * - Encounter exists for the patient
   * - Encounter status: 'in-progress'
   * - Encounter class: 'IMP' (inpatient)
   * - Has hospitalization data (indicates admission)
   * 
   * @param patientId - Patient ID to check (defaults to current patient)
   * @returns Observable<boolean> that emits true if patient has active admission
   */
  isPatientAdmitted(patientId?: string): Observable<boolean> {
    return combineLatest([
      this.PatientResources.encounters,
      this.currentPatientId$
    ]).pipe(
      map(([encounters, currentPatId]) => {
        // Use provided patientId or fall back to current patient
        const targetPatientId = patientId || currentPatId;

        if (!targetPatientId) {
          console.warn('No patient ID provided and no current patient found');
          return false;
        }

        // Filter encounters for this specific patient
        const patientEncounters = encounters.filter(wrapper => {
          const encounter = wrapper.actualResource;
          const subjectRef = encounter?.subject?.reference;

          // Match "Patient/{id}" or just "{id}"
          return subjectRef === `Patient/${targetPatientId}` ||
            subjectRef === targetPatientId;
        });

        // Check if any encounter is an active admission
        const hasActiveAdmission = patientEncounters.some(wrapper => {
          const encounter = wrapper.actualResource;

          // Check if encounter is in-progress
          const isInProgress = encounter.status === 'in-progress';

          // Check if encounter class is inpatient (IMP)
          const isInpatient = encounter.class?.code?.toUpperCase() === 'IMP' ||
            encounter.class?.display?.toLowerCase().includes('inpatient');

          // Check if has hospitalization data (indicates admission)
          const hasHospitalization = !!encounter.hospitalization;

          // Additional check: has admission identifier
          const hasAdmissionId = encounter.hospitalization?.preAdmissionIdentifier?.value ||
            encounter.identifier?.some((id: any) =>
              id.system?.includes('admission-id')
            );

          const isActive = isInProgress && isInpatient && hasAdmissionId;

          if (isActive) {
            console.log('🏥 Active admission found for patient:', {
              patientId: targetPatientId,
              encounterId: encounter.id,
              status: encounter.status,
              class: encounter.class,
              admissionId: encounter.hospitalization?.preAdmissionIdentifier?.value,
              hasHospitalization
            });
          }

          return isActive;
        });

        return hasActiveAdmission;
      }),
      distinctUntilChanged(), // Only emit when admission status changes
      shareReplay(1) // Cache latest result
    );
  }

  /**
   * ✅ NEW: Synchronous check if patient has active admission (uses cached value)
   * @param patientId - Patient ID to check (defaults to current patient)
   * @returns boolean indicating if patient has active admission
   * @deprecated Consider using isPatientAdmitted() observable for reactive updates
   */
  isPatientAdmittedSync(patientId?: string): boolean {
    const targetPatientId = patientId

    if (!targetPatientId) {
      console.warn('No patient ID provided and no current patient found');
      return false;
    }

    const encounters = this.PatientResources.encounters.getValue();

    // Filter encounters for this specific patient
    const patientEncounters = encounters.filter(wrapper => {
      const encounter = wrapper.actualResource;
      const subjectRef = encounter?.subject?.reference;

      return subjectRef === `Patient/${targetPatientId}` ||
        subjectRef === targetPatientId;
    });

    // Check if any encounter is an active admission
    return patientEncounters.some(wrapper => {
      const encounter = wrapper.actualResource;

      const isInProgress = encounter.status === 'in-progress';
      const isInpatient = encounter.class?.code?.toUpperCase() === 'IMP' ||
        encounter.class?.display?.toLowerCase().includes('inpatient');

      return isInProgress && isInpatient;
    });
  }

  /**
   * ✅ NEW: Get active admission encounter for a patient
   * @param patientId - Patient ID (defaults to current patient)
   * @returns Observable<Encounter | null>
   */
  getActiveAdmission(patientId?: string): Observable<Encounter | null> {
    return combineLatest([
      this.PatientResources.encounters,
      this.currentPatientId$
    ]).pipe(
      map(([encounters, currentPatId]) => {
        const targetPatientId = patientId || currentPatId;

        if (!targetPatientId) return null;

        // Filter encounters for this patient
        const patientEncounters = encounters.filter(wrapper => {
          const encounter = wrapper.actualResource;
          const subjectRef = encounter?.subject?.reference;

          return subjectRef === `Patient/${targetPatientId}` ||
            subjectRef === targetPatientId;
        });

        // Find the active admission encounter
        const activeAdmission = patientEncounters.find(wrapper => {
          const encounter = wrapper.actualResource;

          const isInProgress = encounter.status === 'in-progress';
          const isInpatient = encounter.class?.code?.toUpperCase() === 'IMP' ||
            encounter.class?.display?.toLowerCase().includes('inpatient');

          return isInProgress && isInpatient;
        });

        return activeAdmission?.actualResource || null;
      }),
      distinctUntilChanged((prev, curr) => prev?.id === curr?.id),
      shareReplay(1)
    );
  }
}

