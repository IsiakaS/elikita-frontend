import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatInputModule } from '@angular/material/input'
import { MatFormField } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider'
import { MatChipsModule } from '@angular/material/chips'
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, map, Observable, startWith } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { HttpClient } from '@angular/common/http';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { StateService } from '../shared/state.service';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { NaPipe } from '../shared/na.pipe';
import { JoinedCodeableConceptPipe } from "../shared/joinedcodeableconcept.pipe";
import { join } from 'path';
import { ValueToStringPipe } from '../shared/value-to-string.pipe';
import { ChipsDirective } from '../chips.directive';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { UtilityService } from '../shared/utility.service';
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { TruncateWordsDirective } from '../shared/truncate-words.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';
import { AuthService } from '../shared/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { RowDetailsDialogComponent } from './add-observation/add-observation.component';


@Component({
  selector: 'app-patient-observation',
  imports: [MatCardModule, MatButtonModule, CodeableConcept2Pipe, NaPipe,
    TruncateWordsDirective,
    JoinedCodeableConceptPipe, ValueToStringPipe, ChipsDirective,
    CodeableRef2Pipe, TruncateWordsDirective, EmptyStateComponent,
    MatFormField, MatDividerModule, DatePipe, RouterLink, CommonModule,
    RouterLinkActive, ReferenceDisplayDirective,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule, JoinedCodeableConceptPipe],
  templateUrl: './patient-observation.component.html',
  styleUrl: './patient-observation.component.scss'
})
export class PatientObservationComponent {
  utilityService = inject(UtilityService);
  route = inject(ActivatedRoute);
  patientObservationData: any;
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  references: Map<string, any> = new Map();
  categoryFiltering = new FormControl('vital-signs');
  statuStyles = baseStatusStyles
  patientObservationTableFilter: Map<string, any[]> = new Map([[
    'category', ['vital-signs', 'imaging', 'laboratory', 'survey', 'procedure', 'social-history', 'nutrition', 'family-history', 'device']
  ], [
    'name', ['heart-rate', 'blood-pressure', 'temperature', 'weight', 'height', 'oxygen-saturation', 'respiratory-rate', 'glucose', 'cholesterol', 'hemoglobin', 'creatinine', 'bmi', 'pain', 'symptom', 'allergy']
  ], [
    // TODO: Add more filters
    'status', ['final', 'amended', 'preliminary', 'registered', 'unknown']
  ]]);

  patientObservationTableFilterArray = this.patientObservationTableFilter;
  patientObservationFiltersFormControlObject: any = {};
  encounterService = inject(EncounterServiceService);

  patientName!: Observable<string>;
  patientId!: string;
  patientOpenAndClose = inject(PatientDetailsKeyService);
  patientObservationDisplayedColumns = ['dateTaken', 'category', 'name', 'status',
    'result', 'practitioner',
  ]
  // ['basedOn', 'category', 'code', 'subject', 'performer', 'referenceRange', 'value[x]', 'status', 'effective[x]', 'component', 'issued'];
  // ['category', 'code', 'value', 'unit', 'status'];
  http = inject(HttpClient);
  // Inject auth and track role
  authService = inject(AuthService);
  userRole: string | null = null;

  ngOnInit() {
    this.patientId = this.route.parent?.snapshot.params['id'] || '';
    console.log(this.patientId);
    // this.patientName = this.http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
    //   return allArray.find((element: any) => {
    //     return element.identifier[0].value === this.route.parent?.snapshot.params['id']
    //   })
    // }), map((patient: any) => {
    //   return patient.name[0].given.join(' ') + ' ' + patient.name[0].family;
    // }));

    console.log(this.patientName);
    for (const [key, value] of this.patientObservationTableFilter) {
      this.patientObservationFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.patientObservationFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }


    this.state.PatientResources.observations.subscribe((resolvedDataObject) => {
      // console.log(resolvedDataObject['patientObservations']);
      // this.patientObservationData = resolvedDataObject['patientObservations']['observations'];
      // this.references = new Map(resolvedDataObject['patientObservations']['references']);
      // console.log(this.references);
      // console.log(this.patientObservationData);
      this.patientObservationData = resolvedDataObject.map((obsWrapper) => {
        //psecial blood pressure case  component..code.value



        return obsWrapper.actualResource
      });
      this.tableDataLevel2.next(this.patientObservationData);
    });
    this.categoryFiltering.valueChanges.pipe(startWith('vital signs')).subscribe((value) => {
      console.log(value);
      this.tableDataLevel2.next(this.patientObservationData.filter((obs: any) => {
        // console.log(value, obs.category[0].coding[0].display)

        if (!obs.category?.[0]?.coding) { console.log('No category found for observation', obs); }
        return value?.trim().toLowerCase() !== 'others' ? (obs.category?.[0]?.coding?.[0]?.code?.trim().toLowerCase() ||
          obs.category?.[0]?.text?.trim().toLowerCase())
          === value?.trim().toLowerCase().replace(' ', '-') : !['vital-signs', 'exam'].includes(obs.category?.[0]?.coding?.[0]?.code?.trim().toLowerCase() ||
            obs.category?.[0]?.text?.trim().toLowerCase())

      })


      );
    });
    this.authService.user.subscribe(u => {
      this.userRole = u?.role ?? null;
    });
  }
  state = inject(StateService)

  setCategoryFilter(value: string) {
    this.categoryFiltering.setValue(value);
  }
  dialog = inject(MatDialog);
  showRow(row: any, title: string = 'Details') {
    console.log(row);

    this.dialog.open(RowDetailsDialogComponent, {
      width: '720px',
      maxHeight: '90vh',
      data: { title, row }
    });
  }


  private isBloodPressure(obs: any): boolean {
    const codeable = obs?.code;
    const codeStr = (codeable?.text || '').toLowerCase();
    const coding = Array.isArray(codeable?.coding) ? codeable.coding : [];
    const hasPanelCode = coding.some((c: any) => c?.code === '85354-9');
    const mentionsBp = codeStr.includes('blood pressure') || coding.some((c: any) => (c?.display || '').toLowerCase().includes('blood pressure'));
    const components = Array.isArray(obs?.component) ? obs.component : [];
    const hasSys = components.some((c: any) => c?.code?.coding?.some((k: any) => k?.code === '8480-6'));
    const hasDia = components.some((c: any) => c?.code?.coding?.some((k: any) => k?.code === '8462-4'));
    return hasPanelCode || mentionsBp || (hasSys && hasDia);
  }

  private bpDisplayFromObs(obs: any): string {
    const components = Array.isArray(obs?.component) ? obs.component : [];
    const getVal = (code: string) => {
      const comp = components.find((c: any) => c?.code?.coding?.some((k: any) => k?.code === code));
      const v = comp?.valueQuantity?.value;
      const unit = comp?.valueQuantity?.unit || comp?.valueQuantity?.code || '';
      return { v, unit };
    };
    const sys = getVal('8480-6'); // Systolic
    const dia = getVal('8462-4'); // Diastolic
    if (sys?.v != null && dia?.v != null) {
      // Normalize mm[Hg] -> mmHg
      const unit = (sys.unit || dia.unit || '').replace('mm[Hg]', 'mmHg') || 'mmHg';
      return `${sys.v}/${dia.v} ${unit}`.trim();
    }
    return '';
  }

  private computeObservationDisplayValue(obs: any): string {
    if (this.isBloodPressure(obs)) {
      const bp = this.bpDisplayFromObs(obs);
      if (bp) return bp;
    }
    // fallback to generic stringifier (covers valueQuantity, valueCodeableConcept, etc.)
    return (new ValueToStringPipe(this.utilityService)).transform(obs) || '';
  }

  // Permission helpers (aligns with capacityObject.observation)
  get canAddObservation(): boolean {
    return this.authService.can('observation', 'add');
  }
  get canExportObservation(): boolean {
    return this.authService.can('observation', 'viewAll');
  }
}
