import { Component, inject, ChangeDetectorRef, Input } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, map, of, switchMap, take, catchError, Subject, tap } from 'rxjs';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
import { ObsResComponent } from '../obs-res/obs-res.component';
import { PatSympComponent } from "../pat-symp/pat-symp.component";
import { Bundle, BundleEntry, CodeableConcept, Condition, Medication, MedicationRequest, Observation, Quantity } from 'fhir/r4';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatDividerModule } from '@angular/material/divider';
import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { StateService } from '../shared/state.service';
import { backendEndPointToken } from '../app.config';
import { UtilityService } from '../shared/utility.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource } from '@angular/material/table';
import { MatTableModule } from '@angular/material/table';
import { ChipsDirective } from '../chips.directive';
import { Encounter } from 'fhir/r4';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
import { LabRequestsComponent } from '../lab-requests/lab-requests.component';
import { NaPipe } from '../shared/na.pipe';
import { VitalHistoryDialogComponent } from './vital-history-dialog.component';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-check-sheet',
  imports: [...commonImports, NaPipe, JsonPipe,
    MatSelectModule, ChipsDirective, LabRequestsComponent,
    AddVitalsComponent, ObsResComponent, PatSympComponent, MatDividerModule, CodeableReferenceDisplayComponent,
    MatMenuModule,
    MatTableModule
  ],
  templateUrl: './check-sheet.component.html',
  styleUrls: ['../patients-record/patients-record.component.scss',
    '../encounter-check/encounter-check.component.scss', '../pat-symp/pat-symp.component.scss',
    './check-sheet.component.scss']
})
export class CheckSheetComponent {
  hardCodedResolvedData: any
  http = inject(HttpClient);
  resolvedData: any;
  patientId = ""
  labRequestAndValue?: any[];
  medRequestAndValue?: any[];
  // Prefill models for child components

  vitalsPrefill: any = {};
  examPrefill: Array<{ name: string; value: string }> = [];
  symptomsPrefill: Array<any> = [];
  dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as any;
  state = inject(StateService);
  backend = inject(backendEndPointToken);
  cdr = inject(ChangeDetectorRef);
  longForm(unit: string | undefined) {
    if (unit === undefined) {
      return ''
    }
    switch (unit) {
      case 'd':
        return 'day';
      case 'h':
        return 'hour';
      case 'min':
        return 'minute';
      case 's':
        return 'second';
      default:
        return unit;
    }
  }
  sourceData: {
    observations: Observation[],
    condition: any[],
    encounter: any[],
    medicationRequests: any[]
  } = {
      observations: [],
      condition: [],
      encounter: [],
      medicationRequests: []
    };
  @Input() forCheckSheet?: boolean
  @Input() bigSourceData: {
    observations: Observation[],
    condition: any[],
    encounter: any[],
    medicationRequests: any[]
  } | null = null;
  labRequestFilters = [
    { field: 'encounter.reference', values: [this.state.getCurrentEncounterReference()?.reference] },

    { field: 'subject.reference', values: [this.state.getPatientReference()?.reference] },

  ]
  ngOnInit() {

    if (this.bigSourceData) {
      this.sourceData = this.bigSourceData;
    } else {
      // Set patientId from dialog data if available
      this.state.PatientResources.condition.subscribe((conditions) => {
        this.sourceData.condition = conditions.map(c => c.actualResource);
        this.afterResolvedDataLoaded();
      });

      this.state.PatientResources.observations.subscribe((observations) => {
        this.sourceData.observations = observations.map(o => o.actualResource);
        this.afterResolvedDataLoaded();
      });

      this.state.PatientResources.encounters.subscribe((encounters) => {
        this.sourceData.encounter = encounters.map(e => e.actualResource);
        this.afterResolvedDataLoaded();
      });

      this.state.PatientResources.medicationRequests.subscribe((medRequests) => {
        this.sourceData.medicationRequests = medRequests.map(mr => mr.actualResource);
        this.afterResolvedDataLoaded();
      });

      //patient from patintresurces
      this.state.PatientResources.currentPatient.subscribe((patient) => {
        this.resolvedData = patient.actualResource;
        this.afterResolvedDataLoaded();
      });
    }
    // Existing demo data (medications/labs) left intact
    this.http.get<Bundle<MedicationRequest>>("https://hapi.fhir.org/baseR5/MedicationRequest?_format=json&_count=100").subscribe((e: Bundle<MedicationRequest>) => {
      this.medRequestAndValue = e?.entry?.filter((e: any) => {
        return e.resource.hasOwnProperty('dosageInstruction') && e.resource.hasOwnProperty('medication');
      }).map((f: BundleEntry<MedicationRequest>) => {
        return {
          name: f.resource?.medicationCodeableConcept,
          dosage: f.resource?.dosageInstruction,
          timing: f.resource?.dosageInstruction?.[0].timing?.repeat?.frequency ? `${f.resource?.dosageInstruction?.[0].timing?.repeat?.frequency}  every 
          ${f.resource?.dosageInstruction?.[0].timing?.repeat?.period} ${this.longForm(f.resource?.dosageInstruction?.[0].timing?.repeat?.periodUnit)}` : '',
        }
      });
    });

    this.http.get<Bundle<Observation>>("https://hapi.fhir.org/baseR5/Observation?_format=json&category=laboratory").pipe(map((e) => {
      return e?.entry?.
        // filter((g: any) => {
        //   return g.hasOwnProperty('valueQuantity');
        // })
        map((f: BundleEntry<Observation>) => {
          //   return {name: f.resource.code,
          //     value: f.resource.valueQuantity}
          return {
            name: f.resource?.code?.text || (f.resource?.code?.coding?.[0].display ||
              f.resource?.code?.coding?.[0].display),
            value: f.resource?.valueQuantity ? `${f.resource?.valueQuantity?.value} ${f.resource?.valueQuantity?.unit || f.resource?.valueQuantity?.code}` : "Result Not Yet Available"
          }
        }
        ).reverse().slice(0, 5)
    })).subscribe((e) => {
      this.labRequestAndValue = e;
    })


    this.http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
      return allArray.find((element: any) => {
        console.log(element)
        return element.identifier[0].value === "100096"
      })
    }),).subscribe((patientData) => {
      console.log(patientData);
      this.resolvedData = patientData;
    });
  }
  requestLabTest() {
    // Logic to request a lab test
    this.encounterService.addServiceRequest('100001');
  }
  encounterService = inject(EncounterServiceService);

  private mapVitals(obs: any[]): any {
    const out: any = {};
    const getCode = (o: any) => o?.code?.coding?.[0]?.code || o?.code?.coding?.find((c: any) => c.system === 'http://loinc.org')?.code;
    for (const o of obs || []) {
      const catCodes = (o.category || []).flatMap((c: any) => (c.coding || []).map((x: any) => x.code));
      const isVital = catCodes.includes('vital-signs');
      if (!isVital) continue;
      const code = getCode(o);
      switch (code) {
        case '8310-5': out.temperature = o.valueQuantity?.value; break;
        case '8867-4': out.pulseRate = o.valueQuantity?.value; break;
        case '9279-1': out.respiratoryRate = o.valueQuantity?.value; break;
        case '59408-5': out.oxygenSaturation = o.valueQuantity?.value; break;
        case '8302-2': out.height = o.valueQuantity?.value; break;
        case '29463-7': out.weight = o.valueQuantity?.value; break;
        case '39156-5': out.bmi = o.valueQuantity?.value; break;
        case '85354-9': {
          const sys = o.component?.find((c: any) => getCode(c) === '8480-6')?.valueQuantity?.value;
          const dia = o.component?.find((c: any) => getCode(c) === '8462-4')?.valueQuantity?.value;
          if (sys && dia) out.bloodPressure = `${sys}/${dia}`;
          break;
        }
      }
    }
    return out;
  }

  private mapExam(obs: any[]): Array<{ name: string; value: string }> {
    const rows: Array<{ name: string; value: string }> = [];
    for (const o of obs || []) {
      const catCodes = (o.category || []).flatMap((c: any) => (c.coding || []).map((x: any) => x.code));
      const isExam = catCodes.includes('exam');
      if (!isExam) continue;
      const name = o.code?.text || o.code?.coding?.[0]?.display || 'Exam finding';
      let value = '';
      if (o.valueString) value = o.valueString;
      else if (o.valueCodeableConcept) value = o.valueCodeableConcept?.text || o.valueCodeableConcept?.coding?.[0]?.display || '';
      else if (o.valueQuantity) value = `${o.valueQuantity?.value} ${o.valueQuantity?.unit || o.valueQuantity?.code || ''}`.trim();
      rows.push({ name, value });
    }
    return rows;
  }

  private mapSymptoms(conditions: any[]): Array<any> {
    const list: any[] = [];
    for (const c of conditions || []) {
      const coding = c.code?.coding?.[0] || {};
      const clinical = c.clinicalStatus?.coding?.[0]?.code || c.clinicalStatus?.text || '';
      const verification = c.verificationStatus?.coding?.[0]?.code || c.verificationStatus?.text || '';
      const severity = c.severity?.coding?.[0]?.display || c.severity?.text || '';
      const onset = c.onsetDateTime || '';
      list.push({
        clinicalStatus: clinical,
        verificationStatus: verification,
        severity,
        onsetDateTime: onset,
        symptom: { code: coding.code, system: coding.system, display: coding.display || c.code?.text }
      });
    }
    return list;
  }
  //implement the addmoreexam functinion












  //utility se
  utilityService = inject(UtilityService)
  vitalMapForTemplate: any = [];
  private pickLatestPerCode(observations: any[]): any[] {
    const byCode = new Map<string, any>();
    const getCode = (obs: any): string | undefined =>
      obs?.code?.coding?.find((c: any) => (c?.system || '').includes('loinc'))?.code ||
      obs?.code?.coding?.[0]?.code;
    const getWhen = (obs: any): number =>
      new Date(obs?.effectiveDateTime || obs?.issued || obs?.meta?.lastUpdated || 0).getTime();

    for (const obs of observations || []) {
      const code = getCode(obs);
      if (!code) continue;
      const prev = byCode.get(code);
      if (!prev || getWhen(obs) > getWhen(prev)) {
        byCode.set(code, obs);
      }
    }
    return Array.from(byCode.values());
  }
  vitalAllForCurrentEncounter: any = [];
  vitalsByCode: Array<[any, any[]]> = [];
  vitalTableDataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  displayedColumns: string[] = ['display', 'value', 'status', 'actions', 'history'];
  examDisplayedColumns: string[] = ['name', 'value', 'status', 'actions'];
  examTableDataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  // Complaints table state
  complaintDisplayedColumns: string[] = ['symptom', 'severity', 'onset', 'actions'];
  complaintTableDataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  complaintRows: Array<{ id: string; symptom: string; severity: string; verification: string; onset: string; original: any }> = [];
  vitalRows: Array<{ id: string; display: string; value: string; status: string; original: any }> = [];
  examRows: Array<{ id: string; name: string; value: string; status: string; original: any }> = [];
  showAddVitals = false;
  @Input() passedEncounter: {
    patientId: string
    status: Encounter['status'],
    [key: string]: any
  } | null = null;
  private afterResolvedDataLoaded() {
    // Build encounter table datasource (latest by period.start)
    let currentEncounter: any;
    if (!this.passedEncounter) {
      currentEncounter = this.state.currentEncounter.getValue();
    } else {
      currentEncounter = this.passedEncounter;
    }


    // Compute vitals snapshot from observations for the latest encounter only
    const lastEncounterId = currentEncounter?.id;
    if (!this.passedEncounter) {
      this.vitalAllForCurrentEncounter = lastEncounterId
        ? this.getVitalObservationRelatedToLastEncounter(`Encounter/${this.state.currentEncounter.getValue()?.['id']}`)
        : [];
    } else {
      this.vitalAllForCurrentEncounter = lastEncounterId
        ? this.getVitalObservationRelatedToLastEncounter(`Encounter/${this.passedEncounter?.['id']}`)
        : [];
    }

    // Build grouped vitals array: [[latestFinal, [others...]], ...]

    // Use only the latest-final observation from each group for the main table
    const latestVitals = this.vitalAllForCurrentEncounter
    this.vitalRows = (latestVitals || []).map((v: any) => {
      const name = this.utilityService.chooseFirstStringFromCodeableConcept(v?.code);
      const isBp = (name + '').toLowerCase() === 'blood pressure';
      const value = isBp
        ? (this.utilityService.convertAllValueTypesToString(v?.component?.[0]) + '/' +
          this.utilityService.convertAllValueTypesToString(v?.component?.[1])).replace(/\s+mmHg/g, '') + ' mmHg'
        : this.utilityService.convertAllValueTypesToString(v);
      return {
        id: v.id,
        display: name,
        value,
        status: v?.status || 'unknown',
        original: v
      };
    });

        this.vitalsByCode = this.groupVitalsByCode(this.vitalRows);

    // Refresh datasource with a new array reference
    this.vitalTableDataSource.data = this.vitalsByCode.slice();

    // Ensure table updates on every emission (new reference) and trigger CD
    // this.vitalTableDataSource.data = this.vitalRows.slice();
    this.cdr.markForCheck();

    // Build exam observations (category 'exam') for current encounter
    let currentEncounterId: string | undefined;
    if (!this.passedEncounter) {
      currentEncounterId = this.state.currentEncounter.getValue()?.['id'];
    } else {
      currentEncounterId = this.passedEncounter?.['id'];
    }
    const allObs: any[] = Array.isArray(this.sourceData?.observations) ? this.sourceData.observations : [];
    const examObsForEncounter = allObs.filter(o => {

      //ALERT BOTH
      // if (this.utilityService.searchCodeableConceptByDisplayOrText(o?.category?.[0], 'exam')) {
      //   alert(JSON.stringify(o?.encounter?.reference));
      //   alert(`Encounter/${currentEncounterId}`);

      //   alert(this.utilityService.searchCodeableConceptByDisplayOrText(o?.category?.[0], 'Physical Examination'));
      // }
      return o?.encounter?.reference === `Encounter/${currentEncounterId}` &&
        this.utilityService.searchCodeableConceptByDisplayOrText(o?.category?.[0], 'Exam')
    });

    this.examRows = examObsForEncounter.map((o: any) => {
      const name = o.code?.text || o.code?.coding?.[0]?.display || 'Exam finding';
      // Reuse existing utility to stringify value; fallback to known value fields
      let value = this.utilityService.convertAllValueTypesToString(o);
      if (!value) {
        if (o.valueString) value = o.valueString;
        else if (o.valueCodeableConcept)
          value = this.utilityService.chooseFirstStringFromCodeableConcept(o.valueCodeableConcept);
        else if (o.valueQuantity)
          value = `${o.valueQuantity.value} ${o.valueQuantity.unit || o.valueQuantity.code || ''}`.trim();
        else value = '';
      }
      return {
        id: o.id,
        name,
        value,
        status: o?.status || 'unknown',
        original: o
      };
    });

    this.examTableDataSource.data = this.examRows.slice();

    // Ensure table updates on every emission (new reference) and trigger CD
    this.examTableDataSource.data = this.examRows.slice();
    this.cdr.markForCheck();

    // Prepare verified conditions datasource for the Condition card
    const conditionsAll: any[] = Array.isArray(this.sourceData?.condition) ? this.sourceData.condition : [];
    // this.conditionDataSource = conditionsAll;
    this.patientConditionDataSource = conditionsAll.filter((condition: Condition) => {
      // asserter is a practitioner
      if (!this.passedEncounter) {
        // if (condition.encounter?.reference === `Encounter/${this.state.currentEncounter.getValue()?.['id']}`) {
        //   alert(JSON.stringify(condition));
        // }
        return condition.asserter && condition.asserter.reference && condition.asserter.reference.toLowerCase().startsWith('patient/')
          && condition.encounter?.reference === `Encounter/${this.state.currentEncounter.getValue()?.['id']}`
      } else {
        return condition.asserter && condition.asserter.reference && !condition.asserter.reference.toLowerCase().startsWith('patient/')
          && condition.encounter?.reference === `Encounter/${this.passedEncounter?.['id']}`
      };
    });

    this.practitionerConditionDataSource = conditionsAll.filter((condition: Condition) => {
      // asserter is a practitioner
      if (!this.passedEncounter) {
        return condition.asserter && condition.asserter.reference && condition.asserter.reference.toLowerCase().startsWith('patient/')
          && condition.encounter?.reference === `Encounter/${this.state.currentEncounter.getValue()?.['id']}`
      } else {
        return condition.asserter && condition.asserter.reference && condition.asserter.reference.toLowerCase().startsWith('patient/')
          && condition.encounter?.reference === `Encounter/${this.passedEncounter?.['id']}`
      };
    });

    // Build complaints rows from patientConditionDataSource (chief complaints asserted by patient)
    this.complaintRows = (this.patientConditionDataSource || []).map((c: any) => {
      const symptom = c?.code?.coding?.[0]?.display || c?.code?.text || c?.code?.coding?.[0]?.code || '';
      const severity = c?.severity?.coding?.[0]?.display || c?.severity?.text || '';
      const verification = c?.verificationStatus?.coding?.[0]?.display
        || c?.verificationStatus?.coding?.[0]?.code
        || c?.verificationStatus?.text
        || '';
      let onset = c?.onsetDateTime || '';
      // convert onset to duration = onset - now if it's still actieve

      const clinicalStatus = c?.clinicalStatus?.coding?.[0]?.display || c?.clinicalStatus?.text || '';
      return {
        id: c.id,
        symptom,
        severity,
        verification,
        onset,
        original: c
      };
    });
    this.complaintTableDataSource.data = this.complaintRows.slice();
    this.cdr.markForCheck();
  }
  practitionerConditionDataSource: Condition[] = [];
  patientConditionDataSource: Condition[] = [];

  toggleVitalStatus(row: { status: string }) {
    row.status = row.status === 'active' ? 'inactive' : 'active';
  }

  // Persist a FHIR transaction bundle to the backend
  private processBundle(bundle: any) {
    return this.http.post<any>(`${this.backend}`, bundle, {
      headers: new HttpHeaders({ 'Content-Type': 'application/fhir+json', 
      'Prefer': 'return=representation'
       })
    }).pipe(tap(e=>this.state.processBundleTransaction(e)));
  }

  // Build a transaction bundle that updates the Observation status via PUT
  private buildObservationStatusBundle(updatedObservation: any) {
    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: updatedObservation,
          request: {
            method: 'PUT',
            url: `Observation/${updatedObservation.id}`
          }
        }
      ]
    };
  }

  // change status on the underlying Observation resource and persist
  changeVitalStatus(row: { status: string; original: any }, newStatus: 'entered-in-error' | 'cancelled') {
    if (!row?.original?.id) return;

    const prevStatus = row.status;

    // Optimistic update
    // row.original.status = newStatus;
    // row.status = newStatus;

    // Clone for payload to avoid accidental reference issues
    const updated = JSON.parse(JSON.stringify({...row.original, status: newStatus}));
    const bundle = this.buildObservationStatusBundle(updated);

    this.processBundle(bundle).subscribe({
      next: () => {
        // Refresh table datasource
        // this.vitalTableDataSource.data = this.vitalRows.slice();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to persist status change', err);
        // Revert on failure
        // row.original.status = prevStatus;
        // row.status = prevStatus;
        // this.vitalTableDataSource.data = this.vitalRows.slice();
        this.cdr.markForCheck();
      }
    });
  }

  changeExamStatus(row: { status: string; original: any }, newStatus: 'entered-in-error' | 'cancelled') {
    if (!row?.original?.id) return;
    const prev = row.status;
    // row.original.status = newStatus;
    // row.status = newStatus;
    const updated = JSON.parse(JSON.stringify({...row.original, status: newStatus}));
    const bundle = this.buildObservationStatusBundle(updated);
    this.processBundle(bundle).subscribe({
      next: () => {
        // this.examTableDataSource.data = this.examRows.slice();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to persist exam status change', err);
        // row.original.status = prev;
        // row.status = prev;
        // this.examTableDataSource.data = this.examRows.slice();
        this.cdr.markForCheck();
      }
    });
  }

  // Build a transaction bundle that updates a Condition verificationStatus via PUT
  private buildConditionStatusBundle(updatedCondition: any) {
    return {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: [
        {
          resource: updatedCondition,
          request: {
            method: 'PUT',
            url: `Condition/${updatedCondition.id}`
          }
        }
      ]
    };
  }

  // Change verificationStatus on the Condition (chief complaint) and persist
  changeComplaintStatus(
    row: { verification: string; original: any },
    newVerification: 'entered-in-error' | 'refuted'
  ) {
    if (!row?.original?.id) return;
    const prev = row.original?.verificationStatus;

    // Optimistic update to verificationStatus
    row.original.verificationStatus = {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: newVerification,
          display: newVerification.replace(/-/g, ' ')
        }
      ],
      text: newVerification.replace(/-/g, ' ')
    };
    row.verification = row.original.verificationStatus.text;

    const updated = JSON.parse(JSON.stringify(row.original));
    const bundle = this.buildConditionStatusBundle(updated);

    this.processBundle(bundle).subscribe({
      next: () => {
        this.complaintTableDataSource.data = this.complaintRows.slice();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to persist complaint status change', err);
        // Revert on failure
        row.original.verificationStatus = prev;
        row.verification =
          prev?.coding?.[0]?.display || prev?.coding?.[0]?.code || prev?.text || row.verification;
        this.complaintTableDataSource.data = this.complaintRows.slice();
        this.cdr.markForCheck();
      }
    });
  }

  submitVitals() {
    const active = this.vitalRows.filter(r => r.status === 'active').map(r => r.original);
    console.log('Submitting vitals:', active);
    // TODO: implement submission as needed
  }
  dialog = inject(MatDialog);
  addMoreVitals() {
    this.showAddVitals = true;
    this.dialog.open(AddVitalsComponent, {
      maxHeight: "90vh",
      maxWidth: "680px"
    });
  }

  // implement the addMoreExam function
  addMoreExam() {
    const ref = this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '1200px',
      autoFocus: false,
      data: {
        isAnyCategory: false,
        observationCategoryValue: "exam"
      }
    })
    ref.afterClosed().subscribe(() => {
      // Refresh tables in case state stream hasn't emitted yet
      this.afterResolvedDataLoaded();
    });
  }

  private getVitalObservationRelatedToLastEncounter(lastEncounterReference: string): any[] {
    //lastencounterReference string regex check
    if (lastEncounterReference && lastEncounterReference.match(/^Encounter\/[A-Za-z0-9\-\.]{1,64}$/)) {
      // alert(lastEncounterReference);
      //get Obervations that have encouter reference as this and ha category
      const observationsAll: any[] = Array.isArray(this.sourceData?.observations) ? this.sourceData.observations : [];
      // alert(JSON.stringify(observationsAll))
      const filteredObservations = observationsAll.filter(obs => {


        const encounterRef = obs?.encounter?.reference || '';
        // alert(".............."); alert(encounterRef === lastEncounterReference && this.utilityService.searchCodeableConceptByDisplayOrText(obs?.category?.[0], 'vital signs'));
        return encounterRef === lastEncounterReference && this.utilityService.searchCodeableConceptByDisplayOrText(obs?.category?.[0], 'vital signs');
      });
      // filteredObservations.forEach(
      //   (e) => { alert(JSON.stringify(e)) }
      // )
      // alert(JSON.stringify(filteredObservations));
      return filteredObservations;

    } else {
      return [];
    }


  }

  /**
   * Group vitals by LOINC code. For each code, return [latestFinalObs, [otherObs...]].
   * latestFinalObs = most recent observation with status='final', sorted by effectiveDateTime desc.
   * otherObs = all remaining observations for that code, sorted by effectiveDateTime desc.
   */
  private groupVitalsByCode(observations: any[]): Array<[any, any[]]> {
    // alert(JSON.stringify(observations));
    // observations = observations.map(o => o.original);
    const byCode = new Map<string, any[]>();
    const getCode = (obs: any) =>
      obs?.original?.code?.coding?.[0]?.code
    const getTime = (obs: any) =>
      new Date(obs?.original?.effectiveDateTime || obs?.original?.issued || obs?.original?.meta?.lastUpdated || 0).getTime();

    for (const obs of observations || []) {
      const code = getCode(obs);
      if (!code) continue;
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code)!.push(obs);
    }

    const result: Array<[any, any[]]> = [];
    for (const [code, list] of byCode.entries()) {
      // sort all by effectiveDateTime desc
      list.sort((a, b) => getTime(b) - getTime(a));

      // find first with status='final'
      const finalIdx = list.findIndex(o => (o.status || '').toLowerCase() === 'final');
      if (finalIdx > -1) {
        const latest = list[finalIdx];
        const others = list//.filter((_, i) => i !== finalIdx);
        result.push([latest, others]);
      } else {
        // no final status, treat first as "latest", rest as others
        // const [latest, ...others] = list;
        result.push([{
           id: 'N/A',
        display: 'N/A',
        value: 'N/A',
        status: 'N/A',
        original: {}
        }, list]);
      }
    }
    // alert(JSON.stringify(result));
    return result;
  }

  showVitalHistory(row: [ any, any[]]) {
    // const code = this.getLoincCode(row[0].code);
    // const group = this.vitalsByCode.find(([latest, _]) => this.getLoincCode(latest) === code);
    // if (!group) return;

    // const [_latest, others] = group;
    // const historyRows = others.map((v: any) => {
    //   const name = this.utilityService.chooseFirstStringFromCodeableConcept(v?.code);
    //   const isBp = (name + '').toLowerCase() === 'blood pressure';
    //   const value = isBp
    //     ? (this.utilityService.convertAllValueTypesToString(v?.component?.[0]) + '/' +
    //       this.utilityService.convertAllValueTypesToString(v?.component?.[1])).replace(/\s+mmHg/g, '') + ' mmHg'
    //     : this.utilityService.convertAllValueTypesToString(v);
    //   return {
    //     id: v.id,
    //     display: name,
    //     value,
    //     status: v?.status || 'unknown',
    //     effectiveDateTime: v?.effectiveDateTime || v?.issued || '',
    //     original: v
    //   };
    // });

    this.dialog.open(VitalHistoryDialogComponent, {
      maxWidth: '800px',
      maxHeight: '90vh',
      data: { vitalName: this.utilityService.chooseFirstStringFromCodeableConcept(row[0]?.original.code), history: row[1] }
    });
  }

  private getLoincCode(obs: any): string | undefined {
    return obs?.code?.coding?.find((c: any) => c.system?.includes('loinc'))?.code ||
      obs?.code?.coding?.[0]?.code;
  }
}
// NOTE: Observation display sources:
// - Vitals table: built here (vitalTableDataSource) from Observation category 'vital signs'.
// - Exam table: built here (examTableDataSource) from Observation category 'Exam'.
// - Chief complaints table: built here from Condition resources.
// - AddObservationComponent: used to create new Observation entries (opened in addMoreExam()).
// - Shared table renderer likely in ../shared/table-interface (imported via commonImports).