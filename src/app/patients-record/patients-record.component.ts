import { Component, inject, Input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatInputModule } from '@angular/material/input'
import { MatDividerModule } from '@angular/material/divider'
import { MatChipsModule } from '@angular/material/chips'
import { MatTabsModule } from '@angular/material/tabs'
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, forkJoin, map } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { MatDialog } from '@angular/material/dialog';
import { formFields, formMetaData } from '../shared/dynamic-forms.interface'
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatTooltipModule } from '@angular/material/tooltip'
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AuthService } from '../shared/auth/auth.service';
import { UtilityService } from '../shared/utility.service';
import { ChipsDirective } from '../chips.directive';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { StateService } from '../shared/state.service';
import { Condition } from 'fhir/r4';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';

@Component({
  selector: 'app-patients-record',
  imports: [MatCardModule, MatButtonModule, CommonModule,
    MatDividerModule, RouterLink, ChipsDirective, CodeableConcept2Pipe, CodeableRef2Pipe,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe, MatTooltipModule,
    MatTabsModule, ReferenceDisplayDirective,
    MatTableModule,
    MatChipsModule,
    MatInputModule, DatePipe,
    MatMenuModule, AgePipe,
    MatTableModule, MatIconModule, ReactiveFormsModule, EmptyStateComponent],
  templateUrl: './patients-record.component.html',
  styleUrl: './patients-record.component.scss'
})
export class PatientsRecordComponent {
  patientOpenAndClose = inject(PatientDetailsKeyService);
  route = inject(ActivatedRoute);
  // resolvedData may be reassigned elsewhere; keep a stable copy in sourceData
  resolvedData: any
  sourceData: any = {};
  summaryTables: any = {}
  dialog = inject(MatDialog)
  auth = inject(AuthService);
  http = inject(HttpClient);

  constructor() {


  }
  patientId!: string
  encounterService = inject(EncounterServiceService);
  @Input() hardCodedResolvedData: any;
  // Data sources for tables/cards
  encounterDataSource: any[] = [];
  conditionDataSource: any[] = [];
  // Vitals map populated from latest observations
  vitals: Map<string, {
    icon: string,
    title: string,
    value: string
  }> = new Map();

  ngOnChanges() {
    if (this.hardCodedResolvedData) {
      this.resolvedData = this.hardCodedResolvedData;
      this.sourceData = this.hardCodedResolvedData;
      this.afterResolvedDataLoaded();
    }
  }
  stateService = inject(StateService);
  ngOnInit() {
    this.encTabDataSource.connect = () => {
      return this.encounterTabDataSource$
    }
    this.condTabDatSource.connect = () => {
      return this.condTabDataSource$

    }


    this.route.parent?.params.subscribe((allParamsObject) => {
      this.patientId = allParamsObject['id']
    })


    this.route.data.subscribe((allData) => {

      if (allData && allData['patientData']) {

        console.log(this.resolvedData);

      }
    })

    this.stateService.PatientResources.condition.subscribe((conditions) => {
      this.sourceData.condition = conditions.map(c => c.actualResource);
      this.afterResolvedDataLoaded();
    });

    this.stateService.PatientResources.observations.subscribe((observations) => {
      this.sourceData.observations = observations.map(o => o.actualResource);
      this.afterResolvedDataLoaded();
    });

    this.stateService.PatientResources.encounters.subscribe((encounters) => {
      this.sourceData.encounter = encounters.map(e => e.actualResource);
      this.afterResolvedDataLoaded();
    });

    this.stateService.PatientResources.medicationRequests.subscribe((medRequests) => {
      this.sourceData.medicationRequests = medRequests.map(mr => mr.actualResource);
      this.afterResolvedDataLoaded();
    });

    //patient from patintresurces
    this.stateService.PatientResources.currentPatient.subscribe((patient) => {
      this.resolvedData = patient.actualResource;
      this.afterResolvedDataLoaded();
    });



    this.summaryTables['encounter'] = {
      displayedColumns: ['date', 'status', 'reason', 'diagnosis']
    }
    this.summaryTables['condition'] = {
      displayedColumns:
        ['recordedDate', 'status', 'code',
          'severity',
          // 'asserter'
        ]
    }


  }

  vitalMapForTemplate: any[] = [];
  private afterResolvedDataLoaded() {
    // Build encounter table datasource (latest by period.start)
    const encountersAll: any[] = Array.isArray(this.sourceData?.encounter) ? this.sourceData.encounter : [];
    const encounters = encountersAll;
    if (encounters.length) {
      const withDates = encounters
        .map(e => {
          const t = new Date(e?.period?.start || e?.period?.end || '').getTime();
          return { e, start: isNaN(t) ? Number.NEGATIVE_INFINITY : t };
        });
      withDates.sort((a, b) => b.start - a.start); // invalid (NEGATIVE_INFINITY) go to end
      const latest = withDates.map(e => {
        const presentedSymptoms = this.computePresentedSymptoms(e.e);
        const presentedSeverity = this.computePresentedSeverity(e.e);
        const diagnosisForEncounter =
          this.sourceData.condition.filter((cond: Condition) => this.stateService.isResourceForCurrentEncounter(cond)).
            filter((f: Condition) => {
              return !['entered-in-error', 'refuted'].includes((f.verificationStatus?.coding?.[0]?.code?.toLowerCase() || "")
                || (f.verificationStatus?.text?.toLowerCase() || "")
              ) &&
                f.asserter && f.asserter.reference && !f.asserter.reference.toLowerCase().startsWith('patient/') &&
                f.encounter?.reference?.endsWith(e.e.id!)
                ;
            }).
            map((condition: any) => condition.code?.text || condition.code?.coding?.[0]?.display || '').join(', ');
        return { ...e.e, presentedSymptoms, presentedSeverity, diagnosis: diagnosisForEncounter };
      });
      this.encounterDataSource = latest;
      this.encounterTabDataSource$.next(latest.slice(0, 4));
    } else {
      this.encounterDataSource = [];
    }

    // Compute vitals snapshot from observations for the latest encounter only
    const lastEncounterId = this.encounterDataSource?.[0]?.id || this.encounterTabDataSource$.getValue()?.[0]?.id;
    const vitalAllForLastEncounter = lastEncounterId
      ? this.getVitalObservationRelatedToLastEncounter(`Encounter/${lastEncounterId}`)
      : [];

    //create a last vitals - vital Obs based on the latest date in the observation
    const vitalObs = this.pickLatestPerCode(this.sourceData?.observations.filter((obs: any) => {
      console.log('logging times......................')
      return this.utilityService.searchCodeableConceptByDisplayOrText(obs?.category?.[0], 'vital signs')
        && obs?.status && !['entered-in-error', 'cancelled', 'unknown'].includes(obs.status.toLowerCase());
    }));

    this.vitalMapForTemplate = vitalObs.map((e) => {
      return {
        ...e,
        key: this.utilityService.chooseFirstStringFromCodeableConcept(e?.code),
        value: (this.utilityService.chooseFirstStringFromCodeableConcept(e?.code) + "").toLowerCase() !== 'blood pressure' ? this.utilityService.convertAllValueTypesToString(e) :
          (this.utilityService.convertAllValueTypesToString(e?.component[0]) + "/" + this.utilityService.convertAllValueTypesToString(e?.component[1])).replace(/\s+mmHg/g, '') + " mmHg",
        icon: this.utilityService.getBefittingIconsForVitals(this.utilityService.chooseFirstStringFromCodeableConcept(e?.code))
      }
    })
    this.vitals = this.computeVitals(vitalObs);

    // Prepare verified conditions datasource for the Condition card
    const conditionsAll: any[] = Array.isArray(this.sourceData?.condition) ? this.sourceData.condition : [];
    this.conditionDataSource = this.filterConditions(conditionsAll);
    this.filteredConditionDataSource = this.conditionDataSource.filter((condition) => {
      // asserter is a practitioner
      return condition.asserter && condition.asserter.reference && !condition.asserter.reference.toLowerCase().startsWith('patient/');
    }).slice(0, 3);
  }
  condTabDatSource = new MatTableDataSource<any>();
  condTabDataSource$ = new BehaviorSubject<any[]>([]);
  //do that for the ret
  encTabDataSource = new MatTableDataSource<any>();
  encounterTabDataSource$ = new BehaviorSubject<any[]>([]);
  filteredConditionDataSource: any[] = [];
  displayForm() {
    forkJoin({ class: this.http.get("/encounter/encounter_class.json") }).pipe(map((all: any) => {
      const keys = Object.keys(all);
      keys.forEach((key) => {
        console.log(all[key]);
        all[key] = {
          ...all[key], concept: all[key].concept.map((e: any) => {

            const system = all[key].system;
            return { ...e, system }


          })
        }
      })
      return all;
    })).subscribe((g: any) => {
      console.log(g);
      this.dialog.open(DynamicFormsV2Component, {
        data: {
          formMetaData: <formMetaData>{
            formName: 'Encounter (Visits)',
            formDescription: "Record your encounter with patient"
          },
          formFields: <formFields[]>[{
            fieldApiName: 'class',
            fieldName: 'Type of Encounter',
            fieldLabel: 'Type of Encounter',
            dataType: 'CodeableConcept',
            codingConcept: g.class.concept,
            codingSystems: g.class.system

          }]
        }
      })
    })
  }
  // Build a vitals snapshot Map from Observations (latest values by LOINC)
  private computeVitals(observations: any[]): Map<string, { icon: string; title: string; value: string }> {
    const byCode = new Map<string, any>();
    const getCode = (obs: any): string | undefined =>
      obs?.code?.coding?.find((c: any) => c?.system?.includes('loinc'))?.code ||
      obs?.code?.coding?.[0]?.code;
    const getWhen = (obs: any): number => new Date(obs?.effectiveDateTime || obs?.issued || obs?.meta?.lastUpdated || 0).getTime();

    // Index latest per code
    for (const obs of observations || []) {
      const code = getCode(obs);
      if (!code) continue;
      const t = getWhen(obs);
      const prev = byCode.get(code);
      if (!prev || getWhen(prev) < t) byCode.set(code, obs);
    }

    const pickQuantity = (code: string): string | undefined => {
      const o = byCode.get(code);
      const q = o?.valueQuantity;
      if (!q || typeof q.value === 'undefined') return undefined;
      const unit = q.unit || q.code || '';
      return `${q.value}${unit ? (unit.startsWith('/') ? unit : ' ' + unit) : ''}`.trim();
    };

    // Blood pressure panel (85354-9) with components 8480-6 (sys) and 8462-4 (dia)
    let bpValue: string | undefined;
    {
      const bp = byCode.get('85354-9');
      if (bp?.component?.length) {
        const sys = bp.component.find((c: any) => c.code?.coding?.some((cc: any) => cc.code === '8480-6'))?.valueQuantity?.value;
        const dia = bp.component.find((c: any) => c.code?.coding?.some((cc: any) => cc.code === '8462-4'))?.valueQuantity?.value;
        if (typeof sys !== 'undefined' && typeof dia !== 'undefined') bpValue = `${sys}/${dia}`;
      }
    }

    const vitals = new Map<string, { icon: string; title: string; value: string }>();
    const pushIf = (key: string, icon: string, title: string, val?: string) => {
      if (typeof val === 'undefined' || val === null || val === '') return;
      vitals.set(key, { icon, title, value: String(val) });
    };

    pushIf('height', 'height', 'Height', pickQuantity('8302-2'));
    pushIf('weight', 'monitor_weight', 'Weight', pickQuantity('29463-7'));
    pushIf('bmi', 'monitor_weight', 'BMI', pickQuantity('39156-5'));
    pushIf('blood_pressure', 'favorite', 'Blood Pressure', bpValue);
    pushIf('heart_rate', 'heart_broken', 'Heart Rate', pickQuantity('8867-4'));
    pushIf('temperature', 'thermostat', 'Temperature', pickQuantity('8310-5'));
    pushIf('respiratory_rate', 'air', 'Resp. Rate', pickQuantity('9279-1'));
    pushIf('spo2', 'monitor_heart', 'SpO2', pickQuantity('59408-5'));

    return vitals;
  }

  // Find Condition(s) asserted by the patient for the given encounter and
  // derive a human-readable symptom string from condition.code
  private computePresentedSymptoms(encounter: any): string {
    if (!encounter) return '';
    const patientId = this.patientId || this.sourceData?.id || this.resolvedData?.id;
    const conditions: any[] = Array.isArray(this.sourceData?.condition) ? this.sourceData.condition : [];
    const encId = encounter?.id || encounter?.reference?.split('/')?.pop();
    if (!encId) return '';

    const assertedByPatient = (asserter: any): boolean => {
      const ref = asserter?.reference || '';
      return ref.toLowerCase().startsWith('patient/') && (!patientId || ref.endsWith('/' + patientId) || ref === 'Patient/' + patientId);
    };

    const forEncounter = (c: any): boolean => {
      const ref = c?.encounter?.reference || '';
      return ref.endsWith('/' + encId) || ref === encId;
    };

    //not entered-in-error, refuted
    const disallowed = new Set(['entered-in-error', 'refuted']);
    const verified = (c: any): boolean => {
      const verStatus = c?.verificationStatus?.coding?.[0]?.code || c?.verificationStatus?.text || '';
      return !disallowed.has(verStatus.toLowerCase());
    };

    const picks = this.filterConditions(conditions).filter(c => forEncounter(c) && assertedByPatient(c.asserter)
      && verified(c));
    if (!picks.length) return '';

    const toDisplay = (c: any): string =>
      c?.code?.coding?.[0]?.display || c?.code?.text || c?.code?.coding?.[0]?.code || '';

    return picks.map(toDisplay).filter(Boolean).join(', ');
  }

  private computePresentedSeverity(encounter: any): string {
    if (!encounter) return '';
    const patientId = this.patientId || this.sourceData?.id || this.resolvedData?.id;
    const conditions: any[] = Array.isArray(this.sourceData?.condition) ? this.sourceData.condition : [];
    const encId = encounter?.id || encounter?.reference?.split('/')?.pop();
    if (!encId) return '';

    const assertedByPatient = (asserter: any): boolean => {
      const ref = asserter?.reference || '';
      return ref.toLowerCase().startsWith('patient/') && (!patientId || ref.endsWith('/' + patientId) || ref === 'Patient/' + patientId);
    };

    const forEncounter = (c: any): boolean => {
      const ref = c?.encounter?.reference || '';
      return ref.endsWith('/' + encId) || ref === encId;
    };

    const picks = this.filterConditions(conditions).filter(c => forEncounter(c) && assertedByPatient(c.asserter));
    if (!picks.length) return '';

    const toSeverity = (c: any): string => c?.severity?.coding?.[0]?.display || c?.severity?.text || '';
    return picks.map(toSeverity).filter(Boolean).join(', ');
  }

  // ----- Filtering helpers -----
  private filterEncounters(encounters: any[]): any[] {
    const disallowed = new Set(['entered-in-error', 'cancelled', 'unknown']);
    return (encounters || []).filter(e => !disallowed.has((e?.status || '').toLowerCase()));
  }
  utilityService = inject(UtilityService);
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

  private filterConditions(conditions: any[]): any[] {
    // alert(JSON.stringify(conditions));
    return conditions;
    const disallowed = new Set(['entered-in-error', 'refuted']);
    const getVerStatus = (c: any): string =>
      c?.verificationStatus?.coding?.[0]?.code || c?.verificationStatus?.text || '';
    return (conditions || []).filter(c => !c?.asserter?.reference || (c.asserter && c.asserter.reference && !c.asserter.reference.toLowerCase().startsWith('patient/')));
  }

  private filterObservations(observations: any[]): any[] {
    const allowed = new Set(['final', 'amended', 'corrected']);
    return (observations || []).filter(o => allowed.has((o?.status || '').toLowerCase()));
  }

  private filterVitalCategory(observations: any[]): any[] {
    const isVital = (o: any): boolean => {
      const cats = o?.category || [];
      const codings = ([] as any[]).concat(...cats.map((c: any) => c?.coding || []));
      return codings.some(cd => (cd?.system || '').includes('observation-category') && (cd?.code || '').toLowerCase() === 'vital-signs');
    };
    return (observations || []).filter(isVital);
  }

  // Pick the latest observation per LOINC code (by effectiveDateTime/issued/lastUpdated)
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

}
