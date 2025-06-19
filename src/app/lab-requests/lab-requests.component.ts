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
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { TableHeaderComponent } from '../table-header/table-header.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
@Component({
  selector: 'app-lab-requests',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive, CommonModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule, MatMenuModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './lab-requests.component.html',
  styleUrl: './lab-requests.component.scss'
})
export class LabRequestsComponent {
  labRequestsData: any;
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  references: Map<string, any> = new Map();

  // status  - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-status&_format=json

  // intent - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-intent&_format=json

  // priority - https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/request-priority&_format=json

  // code  - filter - http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/procedure-code&_FORMAT=JSON&filter=blood%20sugar

  // orderDetail.parameter.code - (form your own)

  // orderDetail.parameter.valueString - textarea

  // subject

  // authoredOn

  // requester

  //performer-type - http://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/participant-role&_FORMAT=JSON

  labRequestsTableFilter: Map<string, any[]> = new Map([[
    'priority', ['ASAP', 'Urgent', 'Routine']
  ],
  [
    'status', ['active', 'completed', 'cancelled', 'entered-in-error', 'unknown']
  ],


  ])

  labRequestsTableFilterArray = this.labRequestsTableFilter;
  labRequestsFiltersFormControlObject: any = {};
  // patientName!: Observable<string>;
  // patientId!: string;
  labRequestsDisplayedColumns = [
    'authoredOn', 'status', 'priority', 'code', 'subject', 'action'
    // 'subject', 'date', 'duration', 'status', 'serviceType', 'appointmentType',
    // //'reason', 'priority', 'contact', 'specialty',
  ]


  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  encounterService = inject(EncounterServiceService);
  referenceObject: any = {}

  constructor(private router: Router) {
  }
  ngOnInit() {

    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }

    for (const [key, value] of this.labRequestsTableFilter) {
      this.labRequestsFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.labRequestsFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    this.route.data.pipe(
      tap((data) => {
        console.log(data)

        data['labRequests'].filter((e: any) => {
          if (!e.requestedPeriod) {
            return false
          } else {
            return true;
          }
        }).forEach((element: any) => {


        })

      }),
      map((data) => {
        const toReturnData = {
          ...data, labRequests: data['labRequests'].filter((e: any) => {
            console.log(Object.keys(e), e.hasOwnProperty("code"));
            return e.hasOwnProperty("code")
          })
        }
        console.log(toReturnData);
        return toReturnData;
      })


    ).subscribe((allData) => {
      console.log(allData)
      this.labRequestsData = allData['labRequests'].slice(0, 5);
      //  this.references = new Map(allData['patMed']['references']);
      //  console.log(this.references);
      console.log(this.labRequestsData);
      this.tableDataLevel2.next(this.labRequestsData);

    });
  }

  dialog = inject(MatDialog)

  showRow(row: any) {
    console.log(row);
    // this.dialog.open(AppointmentDetailsComponent, {
    //   maxWidth: '450px',
    //   maxHeight: '90vh'
    // })
    //  }


  }


}
