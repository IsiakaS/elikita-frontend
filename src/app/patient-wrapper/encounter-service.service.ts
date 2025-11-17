import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, Inject, Injectable } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTab, MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
//import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { combineLatest, forkJoin, map, Observable, of, sample } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField, CodeableConceptFieldFromBackEnd, generalFieldsData } from '../shared/dynamic-forms.interface2';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';
//import { EncounterServiceService } from './encounter-service.service';
import { MatMenuModule } from '@angular/material/menu';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
import { SidemenuComponent } from '../sidemenu/sidemenu.component';
import { DashboardsWrapperComponent } from '../dashboards-wrapper/dashboards-wrapper.component';
import { TopbreadcrumbComponent } from '../topbreadcrumb/topbreadcrumb.component';
import { TopProfileComponent } from '../top-profile/top-profile.component';
import { PatientSidedetailsComponent } from '../patient-sidedetails/patient-sidedetails.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { StateService } from '../shared/state.service';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

import { BehaviorSubject } from 'rxjs';
import { EncounterCheckComponent } from '../encounter-check/encounter-check.component';
import { AddLabRequestsComponent } from '../lab-requests/add-lab-requests/add-lab-requests.component';
import { AddMedicineRequestsComponent } from '../medicine-requests/add-medicine-requests/add-medicine-requests.component';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
import { TestingTasksComponent } from '../testing-tasks/testing-tasks.component';
// import { AddAlllergyComponent } from '../allergy/add-alllergy/add-alllergy.component';
import { AddAllergyComponent } from '../allergy/add-allergy/add-allergy.component';
import { UtilityService } from '../shared/utility.service';
import { AuthService } from '../shared/auth/auth.service';
import { backendEndPointToken } from '../app.config';
import { Resource } from 'fhir/r4';

@Injectable({
  providedIn: 'root'
})
export class EncounterServiceService {
  route = inject(ActivatedRoute);
  sn = inject(MatSnackBar);
  dialog = inject(MatDialog);
  http = inject(HttpClient);
  authService = inject(AuthService);
  encounterState: Observable<any> | undefined;
  patientId: string = '';
  links: string[] = ['summary', 'observations', 'conditions', 'medications'];
  // 'medications', 'procedures', 'immunizations', 'allergies', 'encounters'];
  activeLink = this.links[0];
  //ecounterService = inject(EncounterServiceService)

  resolvedData: any;

  globalEncounterState: {
    [patientId: string]: BehaviorSubject<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'>

  } = {}
  constructor(@Inject(backendEndPointToken) private backendEndPoint: string) { }
  // Configurable list of required vitals that must be filled before proceeding
  requiredVitals: string[] = ['temperature', 'pulseRate', 'respiratoryRate', 'bloodPressure', 'oxygenSaturation'];

  // Local builder for vitals Observations (used if dialog does not supply pre-built list)
  private buildVitalsObservations(v: any, patientId: string, encounterId?: string, performerRef?: string, effectiveDateTime?: string): any[] {
    const subject = { reference: `Patient/${patientId}` };
    const effective = effectiveDateTime || new Date().toISOString();
    const vitalCat = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }], text: 'Vital Signs' }];
    const examCat = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }], text: 'Exam' }];
    // SNOMED CT mapping for appearance & gait common clinical descriptors
    const appearanceMap: Record<string, { code: string; display: string }> = {
      'well': { code: '102876003', display: 'Well' }, // Clinical finding present
      'unwell': { code: '271838008', display: 'Unwell' },
      'pale': { code: '271807003', display: 'Pallor' },
      'flushed': { code: '248196009', display: 'Flushed face' },
      'icteric': { code: '267036007', display: 'Jaundice' },
      'lethargic': { code: '248279007', display: 'Lethargic' },
      'active': { code: '224960004', display: 'Active' },
      'agitated': { code: '271794005', display: 'Agitated' },
      'calm': { code: '272151009', display: 'Calm' },
      'compliant': { code: '105480006', display: 'Cooperative' },
      'combative': { code: '271795006', display: 'Aggressive behaviour' }
    };
    const gaitMap: Record<string, { code: string; display: string }> = {
      'walks normally': { code: '248263006', display: 'Normal gait' },
      'walks with support': { code: '282301002', display: 'Gait difficulty' },
      'walks with limp': { code: '282300003', display: 'Antalgic gait' },
      'unable to walk': { code: '282310008', display: 'Unable to walk' }
    };
    const base = () => ({
      resourceType: 'Observation',
      status: 'final',
      subject,
      effectiveDateTime: effective,
      ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
      ...(performerRef ? { performer: [{ reference: performerRef }] } : {})
    });
    const obs: any[] = [];
    if (v?.temperature) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }], text: 'Body temperature' }, valueQuantity: { value: Number(v.temperature), unit: '°C', system: 'http://unitsofmeasure.org', code: 'Cel' } });
    if (v?.pulseRate) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' }, valueQuantity: { value: Number(v.pulseRate), unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' } });
    if (v?.respiratoryRate) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '9279-1', display: 'Respiratory rate' }], text: 'Respiratory rate' }, valueQuantity: { value: Number(v.respiratoryRate), unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' } });
    if (v?.oxygenSaturation) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation in Arterial blood by Pulse oximetry' }], text: 'SpO2' }, valueQuantity: { value: Number(v.oxygenSaturation), unit: '%', system: 'http://unitsofmeasure.org', code: '%' } });
    if (v?.height) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '8302-2', display: 'Body height' }], text: 'Height' }, valueQuantity: { value: Number(v.height), unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' } });
    if (v?.weight) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Weight' }, valueQuantity: { value: Number(v.weight), unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' } });
    if (v?.bmi) obs.push({ ...base(), category: vitalCat, code: { coding: [{ system: 'http://loinc.org', code: '39156-5', display: 'Body mass index (BMI) [Ratio]' }], text: 'BMI' }, valueQuantity: { value: Number(v.bmi), unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' } });
    if (v?.bloodPressure && /^\d{1,3}\/\d{1,3}$/.test(String(v.bloodPressure))) {
      const [sys, dia] = String(v.bloodPressure).split('/').map((n: any) => Number(n));
      obs.push({
        ...base(),
        category: vitalCat,
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }], text: 'Blood Pressure' },
        component: [
          { code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: { value: sys, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } },
          { code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: { value: dia, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' } }
        ]
      });
    }
    if (v?.appearance) {
      const raw = String(v.appearance).trim();
      const key = raw.toLowerCase();
      const mapped = appearanceMap[key];
      obs.push({
        ...base(),
        category: examCat,
        code: { text: 'Appearance' },
        valueCodeableConcept: mapped
          ? { coding: [{ system: 'http://snomed.info/sct', code: mapped.code, display: mapped.display }], text: mapped.display }
          : { text: raw }
      });
    }
    if (v?.gait) {
      const raw = String(v.gait).trim();
      const key = raw.toLowerCase();
      const mapped = gaitMap[key];
      obs.push({
        ...base(),
        category: examCat,
        code: { text: 'Gait' },
        valueCodeableConcept: mapped
          ? { coding: [{ system: 'http://snomed.info/sct', code: mapped.code, display: mapped.display }], text: mapped.display }
          : { text: raw }
      });
    }
    return obs;
  }

  // Coerce any heterogeneous value (string | flat object | CodeableConcept) to a CodeableConcept-like object
  private coerceCodeableConcept(v: any): { coding?: Array<{ system?: string; code?: string; display?: string }>; text?: string } | null {
    if (!v) return null;
    // Already a CodeableConcept
    if (typeof v === 'object' && Array.isArray(v.coding)) return v;
    // Flat object with code/display/system
    if (typeof v === 'object' && (v.code || v.display || v.system)) {
      const code = v.code || '';
      const display = v.display || v.text || '';
      const system = v.system || '';
      return { coding: [{ code, display, system }], text: display || code };
    }
    // Encoded string: code$#$display$#$system or free text
    if (typeof v === 'string') {
      if (v.includes('$#$')) {
        const [code = '', display = '', system = ''] = v.split('$#$');
        return { coding: [{ code, display, system }], text: display || code };
      }
      return { text: v };
    }
    return null;
  }

  // Build Encounter resource from dialog values
  private buildEncounterResource(patientId: string, details: any, actors: any): any {
    const patientRef = { reference: `Patient/${patientId}` };
    // Normalize class and priority to CodeableConcept, then derive Coding/CodeableConcept as required
    const classCC = this.coerceCodeableConcept(details?.class);
    const priorityCC = this.coerceCodeableConcept(details?.priority);
    // Encounter.class expects a single Coding
    const encClass = classCC?.coding && classCC.coding.length ? classCC.coding[0] : undefined;
    const priority = priorityCC?.coding ? { coding: priorityCC.coding } : (priorityCC ? { text: priorityCC.text } : undefined);

    // participants could be array of references or strings like "Practitioner/123$#$John Doe"
    const rawParticipants: any[] = actors?.participant || [];
    // alert(JSON.stringify(rawParticipants));
    // ["", { "individual": { "reference": "Practitioner/08fc11a0-666d-4f34-b243-a0f70f917971", "display": "Dr. John Doe" } }]
    const participants = (Array.isArray(rawParticipants) ? rawParticipants : [rawParticipants])
      .filter((o) => { return !!o; })
      // .map((p: any) => {
      //   alert(p);
      //   const ref = this.parseReference(p);
      //   return ref ? { individual: ref } : null;
      // })
      .filter((p): p is { individual: any } => !!p);
    // alert(JSON.stringify(participants));


    const encounter: any = {
      resourceType: 'Encounter',
      status: 'in-progress',
      subject: patientRef,
      period: { start: new Date().toISOString() },
      ...(encClass ? { class: encClass } : {}),
      ...(priority ? { priority } : {}),
      ...(participants.length ? { participant: participants } : {})
    };
    return encounter;
  }

  private conditionClinicalCodeMap = new Set(['active', 'recurrence', 'relapse', 'inactive', 'remission', 'resolved']);
  private conditionVerificationCodeMap = new Set(['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error']);

  private buildConditionResources(symptomsForm: any, patientId: string, encounterId: string, practitionerRef?: string): any[] {
    const patientRef = { reference: `Patient/${patientId}` };
    const encounterRef = { reference: `Encounter/${encounterId}` };
    const list: any[] = [];
    const arr = symptomsForm?.symptoms || [];
    for (const row of arr) {
      if (!row?.code?.code) continue;
      const clinical = String(row?.clinicalStatus || '').trim().toLowerCase();
      const verification = String(row?.verificationStatus || '').trim().toLowerCase();
      const onset = row?.onsetDateTime ? new Date(row.onsetDateTime).toISOString() : undefined;
      const base: any = {
        resourceType: 'Condition',
        subject: patientRef,
        encounter: encounterRef,
        code: {
          coding: [{ system: row.code.system || 'http://snomed.info/sct', code: row.code.code, display: row.code.display }],
          text: row.code.display || row.code.code
        },
        ...(onset ? { onsetDateTime: onset } : {})
      };
      if (this.conditionClinicalCodeMap.has(clinical)) {
        base.clinicalStatus = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: clinical, display: clinical.charAt(0).toUpperCase() + clinical.slice(1) }], text: clinical };
      } else if (clinical) {
        base.clinicalStatus = { text: row.clinicalStatus };
      }
      const verificationCode = this.conditionVerificationCodeMap.has(verification) ? verification : 'provisional';
      base.verificationStatus = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: verificationCode, display: verificationCode.charAt(0).toUpperCase() + verificationCode.slice(1) }], text: verificationCode };

      if (row?.severity) {
        base.severity = { text: String(row.severity) };
      }

      const isConfirmed = verificationCode === 'confirmed';
      base.asserter = isConfirmed && practitionerRef ? { reference: practitionerRef } : patientRef;

      list.push(base);

      // Clone rule: if confirmed and asserter practitioner, add a provisional patient-stated clone
      if (isConfirmed && practitionerRef) {
        const clone = JSON.parse(JSON.stringify(base));
        clone.verificationStatus = { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'provisional', display: 'Provisional' }], text: 'provisional' };
        clone.asserter = patientRef;
        list.push(clone);
      }
    }
    return list;
  }

  private parseReference(input: any): { reference: string; display?: string; type?: string } | null {
    if (!input) return null;
    if (typeof input === 'string') {
      const parts = input.split('$#$');
      if (parts.length >= 1) {
        return { reference: parts[0], display: parts[1], type: parts[2] };
      }
      // assume the string is already a FHIR reference
      return { reference: input };
    }
    if (typeof input === 'object' && input.reference) {
      return input as any;
    }
    return null;
  }

  // Build a FHIR R4 transaction Bundle for Encounter + Conditions + Observations
  private buildEncounterBundle(encounter: any, conditions: any[], observations: any[]): any {
    // Assign temporary UUIDs and use urn:uuid references so intra-bundle links resolve
    const encounterUUID = (crypto.randomUUID ? crypto.randomUUID() : Math.floor(Math.random() * 1e12).toString());
    const encounterFullUrl = `urn:uuid:${encounterUUID}`;
    const encounterEntry = {
      fullUrl: encounterFullUrl,
      resource: encounter,
      request: { method: 'POST', url: 'Encounter' }
    };

    // Ensure all resources reference the bundle Encounter
    const fixRef = (r: any) => {
      if (r && r.encounter && r.encounter.reference && r.encounter.reference.startsWith('Encounter/')) {
        r.encounter.reference = encounterFullUrl;
      }
    };
    const conditionEntries = (conditions || []).map((c) => {
      fixRef(c);
      return {
        fullUrl: `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : Math.floor(Math.random() * 1e12).toString()}`,
        resource: c,
        request: { method: 'POST', url: 'Condition' }
      };
    });
    const observationEntries = (observations || []).map((o) => {
      fixRef(o);
      return {
        fullUrl: `urn:uuid:${crypto.randomUUID ? crypto.randomUUID() : Math.floor(Math.random() * 1e12).toString()}`,
        resource: o,
        request: { method: 'POST', url: 'Observation' }
      };
    });

    // Also ensure the Encounter.subject is a Patient reference (external), leave as-is
    // Performer refs remain as external Practitioner/{id}

    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [encounterEntry, ...conditionEntries, ...observationEntries]
    };
  }

  // POST the transaction bundle to the FHIR server
  private postEncounterBundle(bundle: any): Observable<any> {
    // NOTE: Replace base URL and headers to match your environment
    const baseUrl = this.backendEndPoint; // e.g., 'https://your-server/fhir'
    return this.http.post(`${baseUrl}`, bundle, {
      headers: { 'Content-Type': 'application/fhir+json', 'Accept': 'application/fhir+json' }
    });
  }

  setEncounterState(patientId: string, encounter: 'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown') {
    if (this.globalEncounterState.hasOwnProperty(patientId)) {
      console.log(encounter);
      this.globalEncounterState[patientId].next(encounter);

    } else {
      this.globalEncounterState[patientId] = new BehaviorSubject(encounter);
    }
  }

  getEncounterState(patientId: string): Observable<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'> {
    if (this.globalEncounterState.hasOwnProperty(patientId)) {

      return this.globalEncounterState[patientId];
      return this.globalEncounterState[patientId];
    } else {
      this.globalEncounterState[patientId] = new BehaviorSubject<'planned' | 'in-progress' | 'on-hold' | 'discharged' | 'completed' | 'cancelled' | 'discontinued' | 'entered-in-error' | 'unknown'>('unknown');

      return this.globalEncounterState[patientId];
    }
  }

  getPatientId() {
    return this.route.snapshot.paramMap.get('patientId') || '';
  }

  router = inject(Router)
  stateService = inject(StateService)
  addEncounter(patientId: string) {
    // alert("added here");
    // alert(patientId);
    // Logic to add an encounter
    console.log('Add Encounter clicked');
    // Check if there is already a current encounter in state
    let currentEncounter: any = null;
    this.stateService.currentEncounter.subscribe(enc => currentEncounter = enc).unsubscribe();
    if (currentEncounter && currentEncounter.status == 'in-progress') {
      const startText = currentEncounter?.period?.start
        ? new Date(currentEncounter.period.start).toLocaleString()
        : null;
      const msg = startText
        ? `An encounter is already in progress for this patient (started ${startText}). Use the Tasks button to continue.`
        : `An encounter is already in progress for this patient. Use the Tasks button to continue.`;
      this.sn.openFromComponent(SuccessMessageComponent, {
        data: { message: msg, action: 'Open Tasks' },
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    forkJoin({
      class: this.formFieldsDataService.getFormFieldSelectData('encounter', 'class'),
      priority: this.formFieldsDataService.getFormFieldSelectData('encounter', 'priority'),
      participant: this.formFieldsDataService.getFormFieldSelectData('encounter', 'participant'),
      reason: this.formFieldsDataService.getFormFieldSelectData('encounter', 'reason'),
    }).subscribe((g: any) => {
      console.log(g);
      const dRef = this.dialog.open(EncounterCheckComponent, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        disableClose: true,
        data: {
          requiredVitals: this.requiredVitals,

          formMetaDataToUse: <formMetaData>{
            formName: 'Encounter (Visits)',
            formDescription: "Record your encounter with patient",
            submitText: 'Initiate Encounter',
          },

          formFieldsToUse:
          {
            'details': <FormFields[]>[
              {
                generalProperties: {

                  fieldApiName: 'class',
                  fieldName: 'Type of Encounter',
                  fieldLabel: 'Type of Encounter',
                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false,
                  validations: [
                    { type: 'default', name: 'required' }
                  ]
                },
                data: <codeableConceptDataType>{
                  coding: g.class.concept
                }
              },
              {
                generalProperties: {

                  fieldApiName: 'priority',
                  fieldName: 'Encounter Urgency',
                  fieldLabel: 'Encounter Urgency',
                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false,
                  validations: [
                    { type: 'default', name: 'required' }
                  ]
                },
                data: <codeableConceptDataType>{
                  coding: g.priority.concept
                }
              },
            ],
            'actors': <FormFields[]>[
              {
                generalProperties: {

                  fieldApiName: 'participant',
                  fieldName: 'Participant',
                  fieldLabel: 'People Providing Service',
                  fieldType: 'IndividualReferenceField',
                  isArray: true,
                  isGroup: false
                },
                data: g.participant as ReferenceDataType[]



              }],
            'notes': <FormFields[]>[{
              generalProperties: {

                fieldApiName: 'notes',
                fieldName: 'Other Symptom Details',
                fieldLabel: 'Other Symptom Details',
                fieldType: 'IndividualField',
                inputType: 'textarea',
                isArray: false,
                isGroup: false
              },
              data: ''
            }
            ]
            ,

            // {
            //   generalProperties: {
            //     fieldApiName: 'encounter_reason',
            //     fieldName: 'Reason for Encounter',
            //     fieldLabel: 'Reason for Encounter',
            //     isArray: true,
            //     isGroup: true

            //   },
            //   groupFields: {
            'reason': <FormFields[]>[<CodeableConceptFieldFromBackEnd>{
              generalProperties: {
                fieldApiName: 'reason',
                fieldName: 'Patient Symptom',
                fieldLabel: 'Patient Symptom',
                fieldType: "CodeableConceptFieldFromBackEnd",
                isArray: false,
                isGroup: false,
                allowedOthers: true,
                validations: [
                  { type: 'default', name: 'required' }
                ]
              },
              data: ['https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/condition-code&_format=json'],
            },
            <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'clinicalStatus',
                fieldName: "Clinical Status",
                fieldType: 'SingleCodeField',
                inputType: 'text',
                fieldLabel: "Whether the symptom is still active",
                fieldPlaceholder: "Whether the symptom is still active",
                value: 'Active',
                isArray: false,
                isGroup: false,

              },
              data: "active | recurrence | relapse | inactive | remission | resolved | unknown".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
            },
            <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'verificationStatus',
                fieldName: "Verification Status",
                fieldType: 'SingleCodeField',
                isHidden: true,
                inputType: 'text',
                fieldLabel: "Is the Symptom Confirmed",
                fieldPlaceholder: "Is the Symptom Confirmed",
                isArray: false,
                isGroup: false,
                value: 'Provisional'
              },
              data: "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
            },
            //severity
            <SingleCodeField>{
              generalProperties: <generalFieldsData>{
                auth
                  : {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'severity',
                fieldName: "Severity",
                fieldType: 'SingleCodeField',
                inputType: 'text',
                isArray: false,
                isGroup: false,
              },
              data: "mild | moderate | severe".split(' | ').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
            },

















            <IndividualField>{
              generalProperties: <generalFieldsData>{
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldApiName: 'onsetDateTime',
                fieldName: "Onset Date/Time",
                fieldLabel: "When the symptom started",
                fieldPlaceholder: "When the symptom started",
                fieldType: 'IndividualField',
                inputType: 'datetime-local',
                isArray: false,
                isGroup: false,
              },
              data: ""
            }
              // 'encounter_use': <CodeableConceptField>{
              //   generalProperties: {
              //     fieldApiName: 'encounter_reason_use',
              //     fieldName: 'Reason\'s Type',
              //     fieldLabel: 'Reason\'s Type',
              //     fieldType: 'CodeableConceptField',
              //     isArray: false,
              //     isGroup: false
              //   },
              //   data: {
              //     coding: g.reason_use.concept
              //   }
              // }
              // }




              // }

            ]


          }
        }
      })

      dRef.afterClosed().subscribe((result) => {
        console.log(result);
        if (result && result.encounterInitiated) {
          // Simulate encounter creation and get an Encounter ID (would be POST in real impl)
          const encounterId = crypto.randomUUID ? crypto.randomUUID() : Math.floor(Math.random() * 1e12).toString();
          this.setEncounterState(patientId, 'in-progress');

          // Build performer reference from auth user (Practitioner)
          const authUser = this.authService.user.getValue();
          const performerRef = authUser?.['userId'] ? `Practitioner/${authUser['userId']}` : undefined;

          // Build vitals Observations with encounter and performer references using raw vitals
          const vitalsObservations = this.buildVitalsObservations(result.vitals || {}, patientId, encounterId, performerRef, new Date().toISOString());
          // alert(result.actors)
          // Build Encounter resource from details and actors
          const encounterResource = this.buildEncounterResource(patientId, result.details || {}, result.actors || {});
          // Build Condition resources from symptoms form with clone rule
          const conditions = this.buildConditionResources(result.symptomsForm || {}, patientId, encounterId, performerRef);

          // Compose a transaction bundle with urn:uuid linking
          const bundle = this.buildEncounterBundle(encounterResource, conditions, vitalsObservations);
          console.log('FHIR Transaction Bundle:', bundle);

          // Submit to FHIR server
          this.postEncounterBundle(bundle).subscribe({
            next: (resp) => {
              // Build a server-aligned bundle with assigned ids and fixed references
              const mergedBundle = this.materializeTransactionResponse(bundle, resp);

              // Use the real Encounter (with server id) to seed current encounter
              const encounterResource = this.findResourceInBundle(mergedBundle, 'Encounter');
              if (encounterResource) {
                this.stateService.setCurrentEncounter({
                  patientId,
                  status: encounterResource.status || 'in-progress',
                  ...encounterResource
                });
              }

              console.log('FHIR Transaction Response:', resp);
              this.sn.openFromComponent(SuccessMessageComponent, {
                data: { message: 'Encounter and related records saved' },
                duration: 3000,
                horizontalPosition: 'center',
                verticalPosition: 'top'
              });

              // Use the merged response (not the pre-post request bundle)
              this.stateService.processBundleTransaction(mergedBundle);

              this.dialog.closeAll();
            },
            error: (err) => {
              console.error('FHIR Transaction Error:', err);
              this.errorService.openandCloseError('Failed to save encounter. Please try again.');
            }
          });
        } else {
          this.errorService.openandCloseError('You did not initiate an encounter before closing the encounter form!.');
        }
      });

      // this.dialog.open(DynamicFormsComponent, {
      //   maxWidth: '560px',
      //   maxHeight: '90%',
      //   autoFocus: false,
      //   data: {
      //     formMetaData: <formMetaData>{
      //       formName: 'Encounter (Visits)',
      //       formDescription: "Record your encounter with patient",
      //       submitText: 'Initiate Encounter',
      //     },
      //     formFields: <formFields[]>[{
      //       fieldApiName: 'class',
      //       fieldName: 'Type of Encounter',
      //       fieldLabel: 'Type of Encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.class.concept,
      //       codingSystems: g.class.system

      //     },

      //     {
      //       fieldApiName: 'priority',
      //       fieldName: 'Encounter Urgency',
      //       fieldLabel: 'Urgency of the encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.priority.concept,
      //       codingSystems: g.priority.system

      //     }, {
      //       fieldApiName: 'participant',
      //       fieldName: 'Participant',
      //       fieldLabel: 'People Providing Service',
      //       dataType: 'Reference',
      //       BackboneElement_Array: true,
      //       Reference: g.participant,

      //     }, {
      //       fieldApiName: 'reason',
      //       fieldName: 'Reaon for Encounter',
      //       fieldLabel: 'Reason for Encounter',
      //       dataType: 'CodeableConcept',
      //       codingConcept: g.reason.concept,
      //       codingSystems: g.reason.system,
      //       BackboneElement_Array: true,


      //     }]
      //   }
      // })
    })
    // You can implement the logic to open a dialog or navigate to a form here
  }

  addObservation_former(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      forkJoin({

        practitioner: this.http.get("/encounter/encounter_participant.json") as Observable<ReferenceDataType>,
        category: this.http.get("/observation/observation_category.json"),
        code: this.http.get("/observation/observation_code.json"),


      }).pipe(map((all: any) => {
        const keys = Object.keys(all);
        keys.forEach((key) => {
          console.log(all[key]);
          if (all[key].hasOwnProperty('system') && all[key].hasOwnProperty('property')) {
            all[key] = {
              ...all[key], concept: all[key].concept.map((e: any) => {

                const system = all[key].system;
                return { ...e, system }


              })
            }
          } else {
            all[key] = all[key]
          }
        })
        return all;
      })).subscribe((g: any) => {
        console.log(g);
        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '900px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Observations',
              formDescription: "Record your Observations",
              submitText: 'Submit Observation',
            },
            formFields: <FormFields[]>[
              {

                generalProperties: {

                  fieldApiName: 'category',
                  fieldName: 'Observation Category',
                  fieldLabel: 'Observation Category',

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.category.concept
                }
                ,
              },

              {

                generalProperties: {

                  fieldApiName: 'name',
                  fieldName: 'Name of Observation',
                  fieldLabel: 'Name of Observation',

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: <codeableConceptDataType>{
                  coding: g.code.concept
                }
                ,
              },
              <SingleCodeField>{

                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Observation\'s Status',
                  fieldLabel: 'Observation\'s Status',

                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: false
                },
                data: this.observation_status
                ,
              },
              <GroupField>{
                groupFields: {
                  'result_type': <SingleCodeField>{

                    generalProperties: {

                      fieldApiName: 'result_type',
                      fieldName: 'Type of Result',
                      fieldLabel: 'Type of Result',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: ['Number', 'Text']

                  },
                  'result_value': <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'result_value',
                      fieldName: 'Result Value',
                      fieldLabel: 'Result Value',

                      fieldType: 'IndividualField',
                      isArray: false,
                      isGroup: false
                    },


                  },

                  'result_unit': <IndividualField>{

                    generalProperties: {

                      fieldApiName: 'result_unit',
                      fieldName: 'Unit',
                      fieldLabel: 'Unit',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: this.observation_units

                  },


                },
                keys: [
                  ''
                ],
                generalProperties: {

                  fieldApiName: 'value',
                  fieldName: 'Observation / Tests Results',
                  fieldLabel: 'Observation / Tests Results',
                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: true
                },


              },

              <GroupField>{
                groupFields: {
                  'result_type': <SingleCodeField>{

                    generalProperties: {

                      fieldApiName: 'result_type',
                      fieldName: 'Type',
                      fieldLabel: 'Type',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: ['Numbers', 'words']

                  },
                  'result_value': <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'result_value',
                      fieldName: 'Value',
                      fieldLabel: ' Value',

                      fieldType: 'IndividualField',
                      isArray: false,
                      isGroup: false
                    },


                  },

                  'result_unit': <IndividualField>{

                    generalProperties: {

                      fieldApiName: 'result_unit',
                      fieldName: 'Unit',
                      fieldLabel: 'Unit',

                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false
                    },
                    data: this.observation_units

                  },


                },
                keys: [
                  ''
                ],
                generalProperties: {

                  fieldApiName: 'Normal Range',
                  fieldName: 'Normal Test  Range',
                  fieldLabel: 'Normal Test Range',
                  fieldType: 'SingleCodeField',
                  isArray: false,
                  isGroup: true
                },


              },
            ]
          }
        })
      })
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }

  }
























  addObservation(patientId: string, observationCategory: string | null = null, incomingDref: MatDialogRef<any> | null = null, ObsCat: string | null = null) {
    let category = 'category'
    if (observationCategory) {
      switch (observationCategory) {
        case 'vitalSigns-exam':
          category = 'category2';
          break;
        case 'exam':
          category = 'category3'
          break;
        case 'lab-test':
          category = 'category4'
          break;
        default:
          break;


      }
    }
    if (
      (
        (category === 'category2' || category === 'category3') &&
        this.globalEncounterState.hasOwnProperty(patientId)
        && this.globalEncounterState[patientId].getValue() == 'in-progress'
      ) || (category !== 'category2' && category !== 'category3')
    ) {
      forkJoin({
        practitioner: this.formFieldsDataService.getFormFieldSelectData('observation', 'practitioner'),
        category2: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category3: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category4: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        code: this.formFieldsDataService.getFormFieldSelectData('observation', 'code'),
      }).subscribe((g: any) => {

        // alert(JSON.stringify(g.code));
        console.log(g.category);
        const toSpreadObj: any = {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {
            isAnyCategory: false,
            obsCategory: ObsCat,
            observationformFields: [

              ['category', {
                formFields:
                  <FormFields[]>[
                    {
                      generalProperties: {
                        fieldApiName: 'category',
                        fieldName: 'Observation / Test Category',
                        fieldLabel: 'Observation / Test Category',
                        fieldType: 'CodeableConceptField',
                        isArray: false,
                        isGroup: false
                      },
                      data: <codeableConceptDataType>{
                        coding: g[category].filter((c: any) => {
                          if (typeof c === 'string' && c.split('$#$').length >= 3) {
                            const code = c.split('$#$')[0];
                            return code !== 'vital-signs' && code !== 'exam'

                          } else {
                            if (typeof c === 'object' && c.code) {
                              return c.code !== 'vital-signs' && c.code !== 'exam'
                            } else {
                              return true;
                            }
                          }
                        })
                      },
                    },
                  ]
              }],
              ['status', {
                formFields: [
                  <SingleCodeField>{
                    generalProperties: {
                      fieldApiName: 'status',
                      fieldName: 'Observation Status',
                      fieldLabel: 'Observation Status',
                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: false,
                      value: 'final',
                      validations: [{ type: 'default', name: 'required' }]
                    },
                    data: ['preliminary', 'final']
                  }
                ] as FormFields[]
              }],
              ['name', {
                formFields:
                  <FormFields[]>[
                    {
                      generalProperties: {
                        fieldApiName: 'name',
                        fieldName: 'Name of Observation / Test',
                        fieldHint: 'Pick from suggested names or enter your own',
                        fieldLabel: 'Name of Observation / Test',
                        allowedOthers: true,
                        fieldType: 'CodeableConceptFieldFromBackEnd',
                        isArray: false,
                        isGroup: false
                      },
                      data: g.code
                    },
                  ]
              }],
              ['value', {
                formFields: [
                  <GroupField>{


                    groupFields: {
                      'result_type': <SingleCodeField>{

                        generalProperties: {

                          fieldApiName: 'result_type',
                          fieldName: 'Type of Result',
                          fieldLabel: 'Type of Result',
                          // value: category === "category3" ? 'Text' : '',
                          controllingField: [{
                            isAControlField: true,
                            dependentFieldVisibilityTriggerValue: 'Text',
                            controlledFieldDependencyId: "result_type.text"

                          },
                          {
                            isAControlField: true,
                            dependentFieldVisibilityTriggerValue: 'Number',
                            controlledFieldDependencyId: "result_type.number2"

                          },

                          {
                            isAControlField: true,
                            controlledFieldDependencyId: "result_type.number",
                            dependentFieldVisibilityTriggerValue: 'Number'
                          }],
                          fieldType: 'SingleCodeField',
                          isArray: false,
                          isGroup: false
                        },
                        data: ['Number', 'Text']

                      },
                      'result_value': <IndividualField>{
                        generalProperties: {

                          fieldApiName: 'result_value',
                          fieldName: 'Result Value',
                          fieldLabel: 'Result Value',
                          inputType: 'number',
                          dependence_id: 'result_type.number',
                          fieldType: 'IndividualField',
                          isArray: false,
                          isGroup: false
                        },


                      },

                      'result_value_text': <IndividualField>{
                        generalProperties: {

                          fieldApiName: 'result_value',
                          fieldName: 'Result ',
                          fieldLabel: 'Result ',
                          inputType: 'textarea',
                          dependence_id: 'result_type.text',
                          fieldType: 'IndividualField',
                          isArray: false,
                          isGroup: false
                        },


                      },

                      'result_unit': <IndividualField>{

                        generalProperties: {

                          fieldApiName: 'result_unit',
                          fieldName: 'Unit',
                          fieldLabel: 'Unit',
                          fieldHint: 'Pick from suggested units or enter your own',
                          dependence_id: 'result_type.number2',
                          fieldType: 'SingleCodeField',
                          isArray: false,
                          isGroup: false
                        },
                        data: this.observation_units

                      },


                    },
                    keys: [
                      ''
                    ],
                    generalProperties: {

                      fieldApiName: 'value',
                      fieldName: category === "category3" ? 'Observation Results' : 'Observation / Test Results',
                      fieldLabel: category === "category3" ? 'Observation Results' : 'Observation / Test Results',
                      fieldType: 'SingleCodeField',
                      isArray: false,
                      isGroup: true
                    },


                  },
                ]
              }],

              [
                'attachment', {
                  formFields: [
                    <IndividualField>{
                      generalProperties: {

                        fieldApiName: 'attachment',
                        fieldName: 'Add an Attachment',
                        fieldLabel: 'Add an Attachment',
                        fieldType: 'IndividualField',
                        isArray: false,
                        isGroup: false,
                        inputType: 'photo_upload'
                      },
                      data: ''
                    },

                  ]
                }
              ]]
              .filter((ff: any) => {
                if (category !== 'category' && ff[0] === 'category') {
                  return false;
                }


                return true;
              })
          }



        }

        if (incomingDref) {
          incomingDref.close();
          incomingDref.afterClosed().subscribe(() => {
            // alert("i am closed");
            this.dialog.open(AddObservationComponent, {
              ...toSpreadObj
            });
          });
        } else {

          this.dialog.open(AddObservationComponent, {
            ...toSpreadObj
          });
        }
        // alert(toSpreadObj.data.observationformFields.name.)


      })
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }
  }





















































  addAnotherFormerObservation(patientId: string, observationCategory: string | null = null) {
    let category = 'category'
    if (observationCategory) {
      switch (observationCategory) {
        case 'vitalSigns-exam':
          category = 'category2';
          break;
        case 'exam':
          category = 'category3'
          break;
        default:
          break;


      }
    }
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      forkJoin({
        practitioner: this.formFieldsDataService.getFormFieldSelectData('observation', 'practitioner'),
        category2: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category3: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        category: this.formFieldsDataService.getFormFieldSelectData('observation', category),
        code: this.formFieldsDataService.getFormFieldSelectData('observation', 'code'),
      }).subscribe((g: any) => {
        console.log(g);
        const dRef = this.dialog.open(AddObservationComponent, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {
            observationformFields: [[
              'category', {
                formFields:
                  <FormFields[]>[
                    {

                      generalProperties: {

                        fieldApiName: 'category',
                        fieldName: 'Observation Category',
                        fieldLabel: 'Observation Category',

                        fieldType: 'CodeableConceptField',
                        isArray: false,
                        isGroup: false
                      },
                      data: <codeableConceptDataType>{
                        coding: g[category]['concept']
                      }
                      ,
                    },

                  ]
              }],
            ['name',
              {
                formFields:
                  <FormFields[]>[
                    {

                      generalProperties: {

                        fieldApiName: 'name',
                        fieldName: 'Name of Observation',
                        fieldLabel: 'Name of Observation',

                        fieldType: 'CodeableConceptField',
                        isArray: false,
                        isGroup: false
                      },
                      data: <codeableConceptDataType>{
                        coding: g.code.concept
                      }
                      ,
                    },
                  ]

              }],
            ['value', {
              formFields: [
                <GroupField>{
                  groupFields: {
                    'result_type': <SingleCodeField>{

                      generalProperties: {

                        fieldApiName: 'result_type',
                        fieldName: 'Type of Result',
                        fieldLabel: 'Type of Result',

                        fieldType: 'SingleCodeField',
                        isArray: false,
                        isGroup: false
                      },
                      data: ['Number', 'Text']

                    },
                    'result_value': <IndividualField>{
                      generalProperties: {

                        fieldApiName: 'result_value',
                        fieldName: 'Result Value',
                        fieldLabel: 'Result Value',

                        fieldType: 'IndividualField',
                        isArray: false,
                        isGroup: false
                      },


                    },

                    'result_unit': <IndividualField>{

                      generalProperties: {

                        fieldApiName: 'result_unit',
                        fieldName: 'Unit',
                        fieldLabel: 'Unit',

                        fieldType: 'SingleCodeField',
                        isArray: false,
                        isGroup: false
                      },
                      data: this.observation_units

                    },


                  },
                  keys: [
                    ''
                  ],
                  generalProperties: {

                    fieldApiName: 'value',
                    fieldName: 'Observation / Test Results',
                    fieldLabel: 'Observation / Test Results',
                    fieldType: 'SingleCodeField',
                    isArray: false,
                    isGroup: true
                  },


                },
              ]
            }]
            ]
          }

        });
      })
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    }
  }

  addDiagnosis(patientId: string) {
    if (this.encounterStateCheck(patientId)) {

    }
  }


  addSpecimen(patientId: string) {


    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('specimen', 'status'),
      type: this.formFieldsDataService.getFormFieldSelectData('specimen', 'type'),
      condition: this.formFieldsDataService.getFormFieldSelectData('specimen', 'condition'),
      bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
      // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).subscribe({
      next: (g: any) => {


        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {
            formMetaData: <formMetaData>{
              formName: 'Specimen Record ',
              formDescription: "Use this form to record specimens for a specific lab test",
              submitText: 'Submit Request',
            },
            formFields: <FormFields[]>[
              {
                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Status of Specimen',
                  fieldLabel: 'Status of Specimen',
                  value: 'Availabe',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.status

              }, {
                generalProperties: {

                  fieldApiName: 'type',
                  fieldName: 'Specimen Type',
                  fieldLabel: 'Specimen Type',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.participant as ReferenceDataType[]

              },
              {
                generalProperties: {

                  fieldApiName: 'receivedTime',
                  fieldName: 'Received Time',
                  fieldLabel: 'Received Time',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: 'datetime-local',
                  isArray: false,
                  isGroup: false
                },


              },
              {
                generalProperties: {

                  fieldApiName: 'condition',
                  fieldName: 'Specimen Condition',
                  fieldLabel: 'Specimen Condition',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.condition


              },
              {
                generalProperties: {

                  fieldApiName: 'bodySite',
                  fieldName: 'Body Collection Site',
                  fieldLabel: 'Body Collection Site',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  isArray: false,
                  isGroup: false
                },
                data: g.bodySite


              },
            ]
          }
        })
      },
      error: (err: any) => {
        this.errorService.openandCloseError("An error ocurred while fetching specimen data");
      }
    });

  }
  addServiceRequest(patientId: string | null) {
    // if (!patientId) {
    //   this.errorService.openandCloseError(`Patient ID is required to add a service request, 
    //     please start from the patient page to choose a patient and then visit the lab requests tab`);
    //   return;
    // }
    // if (this.globalEncounterState.hasOwnProperty(patientId)
    //   && this.globalEncounterState[patientId].getValue() == 'in-progress'
    // ) {
    // forkJoin({
    //   status: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'status'),
    //   intent: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'intent'),
    //   code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
    //   performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
    //   priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    // }).
    // 
    of(sample).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        const dRef = this.dialog.open(AddLabRequestsComponent, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Service Request (Lab Tests, e.t.c.)',
              formDescription: "Use this form to order a lab test or any other medical services from your or other department",
              submitText: 'Submit Request',
            },
            formFields: <FormFields[]>[
              {

                generalProperties: {

                  fieldApiName: 'status',
                  fieldName: 'Status of Request',
                  fieldLabel: 'Status of Request',
                  value: 'active',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.status

              },
              {

                generalProperties: {

                  fieldApiName: 'intent',
                  fieldName: 'Intent of the Request',
                  fieldLabel: 'Intent of the Request',
                  value: 'order',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.intent

              },
              {

                generalProperties: {

                  fieldApiName: 'code',
                  fieldName: 'Service Requested',
                  fieldLabel: 'Service Requested',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  isArray: true,
                  isGroup: false
                },
                data: g.code
              },
              {

                generalProperties: {

                  fieldApiName: 'performerType',
                  fieldName: 'Pratitioner Required',
                  fieldLabel: 'Practitioner Required',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.performerType
              },
              {

                generalProperties: {

                  fieldApiName: 'priority',
                  fieldName: 'Priority',
                  fieldLabel: 'Priority',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  fieldType: 'CodeableConceptField',
                  isArray: false,
                  isGroup: false
                },
                data: g.priority
              },
              {

                generalProperties: {

                  fieldApiName: 'orderDetailParameterValueString',
                  fieldName: 'Additional Details',
                  fieldLabel: 'Additional Details',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: 'textarea',
                  isArray: false,
                  isGroup: false
                },
                data: g.priority
              },



            ]
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');
      }
    })


    // } else {
    //   this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");

    // }
  }
  state = inject(StateService);
  encounterStateCheck(patientId: string) {
    if (this.state.currentEncounter.getValue()
      && this.state.currentEncounter.getValue()?.['patientId'] == patientId
      && (this.state.currentEncounter.getValue()?.status == 'in-progress' ||
        this.state.currentEncounter.getValue()?.status == 'planned')


    ) {
      return true;

    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
      return false;
    }
  }

  addDiagnosisV2() {
    forkJoin({
      code: this.formFieldsDataService.getFormFieldSelectData('condition', 'code'),
      //ce.getFormFieldSelectData('medication', 'reason'),
    }).subscribe({
      next: (g: any) => {
        const dRef = this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '650px',
          autoFocus: false,
          data: {

            formMetaData: <formMetaData>{
              formName: 'Diagnosis Form',
              formDescription: "Use this form to enter a diagnosis for the patient. You can request A.I. assistance using the side chat",
              submitText: 'Confirm Diagnosis',
            },
            formFields: <FormFields[]>[
              // verificationStatus - unconfirmed | provisional | differential | confirmed | refuted | entered-in-error
              //clinicalStatus - 	active | recurrence | relapse | inactive | remission | resolved | unknown
              //severity - mild | moderate | severe
              //code - 
              //onsetDateTime - 
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'clinicalStatus',
                  fieldName: "Clinical Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                },
                data: "active | recurrence | relapse | inactive | remission | resolved | unknown".split('|').map((e: string) => e.trim())
              },
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'verificationStatus',
                  fieldName: "Verification Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                },
                data: "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split('|').map((e: string) => e.trim())
              },
              //severity
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'severity',
                  fieldName: "Severity",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,
                },
                data: "mild | moderate | severe".split('|').map((e: string) => e.trim())
              },
              //code
              <CodeableConceptFieldFromBackEnd>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'code',
                  fieldName: "Diagnosis Code & Name",
                  fieldType: 'CodeableConceptFieldFromBackEnd',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                },
                data: g.code,
              },



              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'onsetDateTime',
                  fieldName: "Onset Date/Time",
                  fieldType: 'IndividualField',
                  inputType: 'datetime-local',
                  isArray: false,
                  isGroup: false,
                },
                data: ""
              }
            ]
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching diagnosis data:', err);
        this.errorService.openandCloseError('Error fetching diagnosis data. Please try again later.');




      }
    })
  }





  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService)
  addMedicationRequest(patientId: string) {
    // if (this.globalEncounterState.hasOwnProperty(patientId)
    //   && this.globalEncounterState[patientId].getValue() == 'in-progress'
    // ) {

    const dRef = this.dialog.open(AddMedicineRequestsComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      autoFocus: false,
      // data: {

      //   formMetaData: <formMetaData>{
      //     formName: 'Medication Request / Prescription',
      //     formDescription: "Use this form to record a medication request or prescription for the patient.",
      //     submitText: 'Submit Prescription',
      //   },
      //   formFields: <FormFields[]>[
      //     {

      //       generalProperties: {

      //         fieldApiName: 'status',
      //         fieldName: 'Status of Medication',
      //         fieldLabel: 'Status of Medication',
      //         value: 'active',
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },

      //         fieldType: 'SingleCodeField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.status

      //     },
      //     {

      //       generalProperties: {

      //         fieldApiName: 'intent',
      //         fieldName: 'Intent of Medication',
      //         fieldLabel: 'Intent of Medication',
      //         value: 'order',
      //         moreHint: "Do you intend that this medication should be ordered right away or is just a proposal",
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },

      //         fieldType: 'SingleCodeField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.intent

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'medication',
      //         fieldName: 'Medication / Drug',
      //         fieldLabel: 'Medication / Drug',
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },


      //         moreHint: "Search and choose a medication from the list",


      //         fieldType: 'CodeableConceptField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.medication

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'performerType',
      //         fieldName: 'Medication Administered By',
      //         fieldLabel: 'Medication Administered By',
      //         moreHint: "Who should administer the medication to the patient",
      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },


      //         fieldType: 'CodeableConceptField',
      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.performerType

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'reason',
      //         fieldName: 'Reason for Medication',
      //         fieldLabel: 'Reason for Medication',


      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },
      //         fieldType: 'CodeableConceptFieldFromBackEnd',




      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.reason

      //     },
      //     {
      //       generalProperties: {

      //         fieldApiName: 'dosageInstruction',
      //         fieldName: 'Dosage Instruction',
      //         fieldLabel: 'Dosage Instruction',

      //         auth: {
      //           read: 'all',
      //           write: 'doctor, nurse'
      //         },
      //         inputType: "textarea",



      //         isArray: false,
      //         isGroup: false
      //       },
      //       data: g.performerType

      //     },


      //   ]
      // }
    })




    // } else {
    //   this.errorService.openandCloseError("You need to initiate an encounter before an observation can be added for this patient");
    // }


  }

  completeEncounter() { }


  addAllergy(patientId: string) {
    if (this.globalEncounterState.hasOwnProperty(patientId)
      && this.globalEncounterState[patientId].getValue() == 'in-progress'
    ) {
      const dRef = this.dialog.open(AddAllergyComponent, {
        maxHeight: '90vh',
        maxWidth: '650px',
        autoFocus: false,
        data: {
          patientId
        }
      });
    } else {
      this.errorService.openandCloseError("You need to initiate an encounter before an allergy can be added for this patient");
    }

  }

  medication_status = [
    "active", "on-hold", "ended", "stopped", "completed", "cancelled", "entered-in-error"


  ]
  observation_status = [
    "registered",
    "preliminary",
    "final",
    "amended",
    "corrected",
    "cancelled",
    "entered-in-error",
    "unknown"
  ]

  observation_units = [
    "kg",     // kilograms
    "g",      // grams
    "mg",     // milligrams
    "ug",     // micrograms
    "L",      // liters
    "mL",     // milliliters
    "cm",     // centimeters
    "mm",     // millimeters
    "m",      // meters
    "mmHg",   // millimeters of mercury (blood pressure)
    "bpm",    // beats per minute (heart rate)
    "/min",   // per minute (respiration rate)
    "°C",     // degrees Celsius (body temperature)
    "%",      // percent (e.g., oxygen saturation)
    "mol/L",  // moles per liter (common for electrolytes)
    "mmol/L", // millimoles per liter (common for glucose, cholesterol)
    "mg/dL",  // milligrams per deciliter
    "ng/mL",  // nanograms per milliliter
    "U/L",    // units per liter (e.g., liver enzymes)
    "IU/L",   // international units per liter
    "mEq/L",  // milliequivalents per liter
    "cm[H2O]",// centimeters of water (respiratory pressure)
    "s",      // seconds
    "min",    // minutes
    "h",      // hours
    "d"       // days
  ]





  addTask(patientId: string) {
    this.dialog.open(TestingTasksComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      backdropClass: 'custom-backdrop',
      panelClass: 'custom-dialog-panel',
      autoFocus: false,
      data: {
        patientId
      }
    });
  }
  utilityService = inject(UtilityService);
  addInventory() {
    const InventoryDetailsFormFields = this.utilityService.convertFormFields(new Map([
      ['description', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'description',
              fieldName: "Product / Supply Description",
              fieldType: 'IndividualField',
              inputType: 'textarea',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
      ['brandName', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'brandName',
              fieldName: "Brand Name",
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],

      ['status', {
        formFields: <FormFields[]>[
          <SingleCodeField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'status',
              fieldName: "Status",
              fieldType: 'SingleCodeField',
              inputType: 'text',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
            data: 'active | inactive | entered-in-error'.split(' | ')
          },
        ]
      }],

      ['baseUnit', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'baseUnit',
              fieldName: "Base Unit",
              fieldPlaceholder: "e.g. sachet, packet, ml e.t.c.",
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
      ['netContent', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'netContent',
              fieldName: "Quantity to be Stocked",
              fieldType: 'IndividualField',
              inputType: 'number',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
        ]
      }],
      ['expiry', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'expiry',
              fieldName: "Expiry Date For Expirable Products",
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
    ]));

    this.dialog.open(DynamicFormsV2Component, {
      data: {
        formMetaData: {
          formName: "Supplies Stock Form",
          formDescription: "Use this form to keep track of yoour stock supplies",
          showSubmitButton: true,
          submitText: "Submit"

        } as formMetaData,
        formFields: InventoryDetailsFormFields
      }
    })
  }

  addMedStock() {
    const InventoryDetailsFormFields = this.utilityService.convertFormFields(new Map([

      ['baseUnit', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'baseUnit',
              fieldName: "Base Unit",
              fieldPlaceholder: "e.g. sachet, packet, ml e.t.c.",
              fieldType: 'IndividualField',
              inputType: 'text',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
      ['netContent', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'netContent',
              fieldName: "Quantity to be Stocked",
              fieldType: 'IndividualField',
              inputType: 'number',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
        ]
      }],
      ['expiry', {
        formFields: <FormFields[]>[
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'expiry',
              fieldName: "Expiry Date For Expirable Products",
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },

          },

        ]
      }],
    ]));

    this.dialog.open(DynamicFormsV2Component, {
      data: {
        formMetaData: {
          formName: "Medicine Supplies Stock Form",
          formDescription: "Use this form to record medicine stock supplies",
          showSubmitButton: true,
          submitText: "Submit"

        } as formMetaData,
        formFields: InventoryDetailsFormFields
      }
    })
  }

  addAnyObservation(patientId: string | null = null) {
    this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '900px',
      autoFocus: false,
      data: {
        isAnyCategory: true,

      }
    })
  }

  // Parse "ResourceType/{id}/_history/1" -> { resourceType, id }
  private parseLocation(location: string | undefined): { resourceType: string; id: string } | null {
    if (!location) return null;
    const parts = location.split('/');
    if (parts.length >= 2) {
      return { resourceType: parts[0], id: parts[1] };
    }
    return null;
  }

  // Rewrite all FHIR Reference.reference fields from urn:uuid -> ResourceType/id
  private rewriteReferences(obj: any, urnMap: Map<string, { resourceType: string; id: string }>): void {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (key === 'reference' && typeof val === 'string' && urnMap.has(val)) {
        const mapped = urnMap.get(val)!;
        obj[key] = `${mapped.resourceType}/${mapped.id}`;
      } else if (Array.isArray(val)) {
        for (const v of val) this.rewriteReferences(v, urnMap);
      } else if (typeof val === 'object') {
        this.rewriteReferences(val, urnMap);
      }
    }
  }

  // Merge server-assigned ids into request bundle and normalize intra-bundle refs
  private materializeTransactionResponse(requestBundle: any, responseBundle: any): any {
    if (!requestBundle || requestBundle.resourceType !== 'Bundle' || !Array.isArray(requestBundle.entry)) return requestBundle;
    if (!responseBundle || responseBundle.resourceType !== 'Bundle' || !Array.isArray(responseBundle.entry)) return requestBundle;

    const reqEntries = requestBundle.entry;
    const resEntries = responseBundle.entry;
    const urnMap = new Map<string, { resourceType: string; id: string }>();

    // Assume response entries align with request order per FHIR spec
    for (let i = 0; i < reqEntries.length; i++) {
      const reqE = reqEntries[i];
      const resE = resEntries[i];

      const locInfo = this.parseLocation(resE?.response?.location);
      if (locInfo && reqE?.fullUrl && reqE?.resource) {
        reqE.resource.id = locInfo.id; // set server id
        urnMap.set(reqE.fullUrl, { resourceType: locInfo.resourceType, id: locInfo.id });
      }

      // If server returned the full resource, prefer it
      if (resE?.resource?.resourceType && resE.resource?.id) {
        reqE.resource = resE.resource;
      }
    }

    // Rewrite all urn:uuid references to ResourceType/id
    for (const reqE of reqEntries) {
      if (reqE?.resource) this.rewriteReferences(reqE.resource, urnMap);
    }

    // Keep bundle shape compatible with your local processor
    return {
      resourceType: 'Bundle',
      type: requestBundle.type || 'transaction',
      entry: reqEntries
    };
  }

  private findResourceInBundle(bundle: any, resourceType: string): any | null {
    const entries = Array.isArray(bundle?.entry) ? bundle.entry : [];
    for (const e of entries) {
      const r = e?.resource ?? e;
      if (r?.resourceType === resourceType) return r;
    }
    return null;
  }
}



