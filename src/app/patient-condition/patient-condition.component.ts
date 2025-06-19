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
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule],
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
  patientConditionDisplayedColumns = ['recordedDate', 'code', 'verificationStatus', 'clinicalStatus', 'category',
    'severity', 'onsetDateTime', 'abatementDateTime',
    'asserter'
  ]

  http = inject(HttpClient);
  patientOpenAndClose = inject(PatientDetailsKeyService);
  constructor(private router: Router) {
  }
  ngOnInit() {
    this.patientId = this.route.parent?.snapshot.params['id'] || '';
    console.log(this.patientId);
    this.patientName = this.http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
      return allArray.find((element: any) => {
        return element.identifier[0].value === this.route.parent?.snapshot.params['id']
      })
    }), map((patient: any) => {
      return patient.name[0].given.join(' ') + ' ' + patient.name[0].family;
    }));

    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }

    for (const [key, value] of this.patientObservationTableFilter) {
      this.patientObservationFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.patientObservationFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    this.route.data.subscribe((allData) => {
      this.patientConditionData = allData['patCond']['observations'];
      this.references = new Map(allData['patCond']['references']);
      console.log(this.references);
      console.log(this.patientConditionData);
      this.tableDataLevel2.next(this.patientConditionData);

    });
  }

  showRow(row: any) {
    console.log(row);
  }
}
