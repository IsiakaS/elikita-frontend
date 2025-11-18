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
import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { HttpClient } from '@angular/common/http';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AuthService } from '../shared/auth/auth.service';
import { StateService } from '../shared/state.service';
import { ErrorService } from '../shared/error.service';
import { CodeableConcept2Pipe } from "../shared/codeable-concept2.pipe";
import { NaPipe } from "../shared/na.pipe";
import { ReferenceDisplayDirective } from '../shared/reference-display.directive';
import { ChipsDirective } from '../chips.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';




// condition: {
//   keyProperties: [
//     "clinicalStatus",
//     "verificationStatus",
//     "category",
//     "severity",
//     "code",
//     "subject",
//     "encounter",
//     "onsetDateTime",       // or onset[x]
//     "abatementDateTime",   // or abatement[x]
//     "recordedDate",
//     "asserter",
//     "note"
//   ],
//     generalName: "Diagnoses"
// },
@Component({
  selector: 'app-patient-condition',
  imports: [MatCardModule, MatButtonModule, EmptyStateComponent,
    MatFormField, MatDividerModule, DatePipe, RouterLink, ChipsDirective,
    RouterLinkActive, ReferenceDisplayDirective,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule, CodeableConcept2Pipe, NaPipe],
  templateUrl: './patient-condition.component.html',
  styleUrl: './patient-condition.component.scss'
})
export class PatientConditionComponent {
  route = inject(ActivatedRoute);
  patientConditionData: any;
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  references: Map<string, any> = new Map();

  patientObservationTableFilter: Map<string, any[]> = new Map([[
    'clinicalStatus', ['active', 'recurrence', 'inactive', 'remission', 'resolved']
  ], [
    'verificationStatus', ['unconfirmed', 'provisional', 'differential', 'confirmed', 'refuted', 'entered-in-error']
  ], [
    'category', ['problem-list-item', 'encounter-diagnosis', 'health-concern', 'adverse-event', 'comorbidity', 'diagnosis']
  ], [
    'severity', ['mild', 'moderate', 'severe', 'fatal']
  ], [
    'name', ['diabetes', 'hypertension', 'asthma', 'cancer', 'heart-disease', 'stroke', 'arthritis', 'depression', 'anxiety', 'obesity']
  ],])

  patientObservationTableFilterArray = this.patientObservationTableFilter;
  patientObservationFiltersFormControlObject: any = {};
  patientName!: Observable<string>;
  patientId!: string;
  patientConditionDisplayedColumns = ['recordedDate', 'code', 'verificationStatus', 'clinicalStatus',
    'severity',
    'asserter'
  ]
  authService = inject(AuthService);
  http = inject(HttpClient);
  patientOpenAndClose = inject(PatientDetailsKeyService);
  encounterService = inject(EncounterServiceService);
  constructor(private router: Router) {
  }
  canAddDiagnosis = this.authService.user.pipe(map(user => {
    return this.authService.can('condition', 'add');
  }));
  canExportDiagnosis = this.authService.user.pipe(map(user => {
    return this.authService.can('condition', 'viewAll');
  }));


  ngOnInit() {
    this.patientId = this.route.parent?.snapshot.params['id'] || '';
    console.log(this.patientId);

    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }

    for (const [key, value] of this.patientObservationTableFilter) {
      this.patientObservationFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.patientObservationFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    // this.route.data.subscribe((allData) => {
    this.patientConditionData = this.stateService.PatientResources.condition.subscribe({
      next:
        (data: any) => {
          this.tableDataLevel2.next(data.map((condWrapper: any) => {
            return condWrapper.actualResource
          }).filter((cond: any) => {
            return cond.asserter?.reference?.startsWith('Practitioner/') &&
              cond.verificationStatus?.coding?.[0]?.code !== 'provisional' &&
              cond.verificationStatus?.text !== 'provisional';
          }));
          // alert(JSON.stringify(this.tableDataLevel2.value));

        }

      ,
      error: (err) => {
        console.log(err);
        this.errorService.openandCloseError("Failed to load patient condition data");
      }

    }
    );

    // allData['patCond']['observations'];
    // this.references = new Map(allData['patCond']['references']);
    // console.log(this.references);
    // console.log(this.patientConditionData);


    // });
  }
  stateService = inject(StateService);
  errorService = inject(ErrorService);

  showRow(row: any) {
    console.log(row);
  }
}
