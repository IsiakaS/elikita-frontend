import { Injectable } from '@angular/core';
import { Encounter, Observation, Resource, ServiceRequest, Specimen, MedicationDispense, MedicationAdministration } from 'fhir/r4';
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
  }



  orgWideResources = {
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
currentPatientIdFromResolver = new BehaviorSubject<string | null>(null);
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

  ngOnInit(){
    this.orgWideResources.locations = new BehaviorSubject<Array<{
      referenceId: string | null,
      savedStatus: 'saved' | 'unsaved',
      actualResource: any
    }>>([]);
  }

  
}

