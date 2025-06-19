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
import { AppointmentDetailsComponent } from './appointment-details/appointment-details.component';
@Component({
  selector: 'app-appointment',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive, CommonModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss'
})
export class AppointmentComponent {
  route = inject(ActivatedRoute);
  appointmentData: any;
  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  references: Map<string, any> = new Map();



  appointmentTableFilter: Map<string, any[]> = new Map([[
    'Service Type', [
      "consult",
      "follow-up",
      "new-patient",
      "office-visit",
      "lab",
      "x-ray",
      "mri",
      "ultrasound",
      "vaccine",
      "physical"
    ],

  ],
  ['status', [
    "proposed",
    "pending",
    "booked",
    "arrived",
    "fulfilled",
    "cancelled",
    "noshow",
    "entered-in-error",
    "checked-in",
    "waitlist"
  ]],
  [
    'Type', [

      "follow-up",
      "new-patient",
      "consultation",
      "annual-physical",
      "routine-checkup",
      "procedure",
      "screening",
      "therapy-session",
      "vaccination",
      "emergency-visit"

    ]

  ]
  ])

  appointmentTableFilterArray = this.appointmentTableFilter;
  appointmentFiltersFormControlObject: any = {};
  // patientName!: Observable<string>;
  // patientId!: string;
  appointmentDisplayedColumns = [
    'subject', 'date', 'duration', 'status', 'serviceType', 'appointmentType',
    //'reason', 'priority', 'contact', 'specialty',
  ]


  http = inject(HttpClient);
  referenceObject: any = {}

  constructor(private router: Router) {
  }
  ngOnInit() {

    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }

    for (const [key, value] of this.appointmentTableFilter) {
      this.appointmentFiltersFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.appointmentFiltersFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }

    this.route.data.pipe(
      tap((data) => {
        console.log(data)

        data['appointment'].filter((e: any) => {
          if (!e.requestedPeriod) {
            return false
          } else {
            return true;
          }
        }).forEach((element: any) => {
          this.referenceObject[element.participant[0].actor.display] = this.http.get(`https://hapi.fhir.org/baseR4/${element.participant[0].actor.reference}`).pipe(
            map((e: any) => {
              console.log(e.telecom[0])
              return e.telecom[0].value
            })
          );

          console.log(this.referenceObject);

        })

      })

    ).subscribe((allData) => {

      this.appointmentData = allData['appointment'].filter((e: any) => {
        if (!e.requestedPeriod) {
          return false
        } else {
          return true;
        }
      })
      //  this.references = new Map(allData['patMed']['references']);
      //  console.log(this.references);
      console.log(this.appointmentData);
      this.tableDataLevel2.next(this.appointmentData);

    });
  }

  dialog = inject(MatDialog)

  showRow(row: any) {
    console.log(row);
    this.dialog.open(AppointmentDetailsComponent, {
      maxWidth: '1280px',

      maxHeight: '90vh'
    })
  }


}
