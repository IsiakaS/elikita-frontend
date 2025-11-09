import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import { TitleCasePipe } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { RecordHolderService } from '../patients-record/record-holder.service';
import { AgePipe } from '../age.pipe';
import { BreadcrumbService } from '../shared/breadcrumb.service';


@Component({
  selector: 'app-patients',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatMenuModule, AgePipe,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './patients.component.html',
  styleUrl: './patients.component.scss'
})
export class PatientsComponent {
  route = inject(ActivatedRoute);
  patientsRegistrationData: any;
  patientsTableFilter = new Map([[
    'gender', ['Male', 'Female', 'Others']
  ]])

  patientsTableFilterArray = this.patientsTableFilter;

  tableDataSource = new MatTableDataSource();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([])
  patientsFiltersFormControlObject: any = {};
  patientsTableDisplayedColumns = ['name', 'phone',
    'gender', 'age',
    'address'
  ]

  breadCrumbService = inject(BreadcrumbService);

  constructor() {

  }
  ngOnInit() {

    //this.breadCrumbService.buildBreadcrumb(this.route.pathFromRoot);
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2;
    }
    console.log(Object.entries(this.patientsTableFilter));
    this.route.data.subscribe((resolvedDataObject) => {
      this.patientsRegistrationData = resolvedDataObject['patientsRegistrationData'];

      console.log(this.patientsRegistrationData);
      this.tableDataLevel2.next(this.patientsRegistrationData.slice(0, 10).map((element: any) => {
        const eachElementKeys = Object.keys(element);
        for (const key of eachElementKeys) {
          if (typeof (element[key]) == 'object'

            && element[key].length) {
            element[key] = element[key][0];
          }
        }
        return element;
      }));
    })

    for (const patientsFilter of this.patientsTableFilterArray) {
      this.patientsFiltersFormControlObject[patientsFilter[0]] = new FormGroup({
        'select': new FormControl()
      }
      )
    }
  }
  private router = inject(Router);
  private patientRecordHolder = inject(RecordHolderService);
  showRow(row: any) {
    if (this.route.routeConfig?.path?.split('/').includes("admitted-patients")) {
      this.router.navigate([row.identifier.value], { relativeTo: this.route });
    } else {
      this.router.navigate([row.identifier.value], { relativeTo: this.route });
    }
  }

}
