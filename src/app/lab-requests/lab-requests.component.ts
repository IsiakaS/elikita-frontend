import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, UrlSegment } from '@angular/router';
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
import { Bundle, BundleEntry, ServiceRequest } from 'fhir/r5';
import { References2Pipe } from "../shared/references2.pipe";
import { fetchFromReferencePipe } from "../shared/Fetch.pipe";
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { CodeableRef2Pipe } from "../shared/codeable-ref2.pipe";
import { CodeableConcept2Pipe } from "../shared/codeable-concept2.pipe";
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { UtilityService } from '../shared/utility.service';
import { SpecimenComponent } from '../specimen/specimen.component';
import { SpecimenDetailsComponent } from '../specimen/specimen-details/specimen-details.component';
import { LabrequestDetailsComponent } from '../labrequest-details/labrequest-details.component';
import { LabreportComponent } from '../labreport/labreport.component';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';
@Component({
  selector: 'app-lab-requests',
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, DetailBaseComponent,
    MatFormField, MatDividerModule, DatePipe, RouterLink,
    RouterLinkActive, CommonModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule, AsyncPipe,
    MatChipsModule, MatMenuModule,
    MatInputModule,
    MatMenuModule, AgePipe, TableHeaderComponent,
    MatTableModule, MatIconModule, ReactiveFormsModule, References2Pipe, fetchFromReferencePipe, CodeableRef2Pipe, CodeableConcept2Pipe],
  templateUrl: './lab-requests.component.html',
  styleUrls: ['../medicine-requests/medicine-requests.component.scss', './lab-requests.component.scss']
})
export class LabRequestsComponent {
  auth = inject(AuthService);
  labRequestsData: any;
  labRequests?: ServiceRequest[]
  sortedWithRequisition: { [key: string]: ServiceRequest[] } = {};
  sortedWithRequisitionKeys: string[] = [];
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
    'requisition', 'authoredOn', 'status', 'priority', 'code', 'action', 'groupReport'
    // 'subject', 'date', 'duration', 'status', 'serviceType', 'appointmentType',
    // //'reason', 'priority', 'contact', 'specialty', 'subject', 
  ]


  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  encounterService = inject(EncounterServiceService);

  referenceObject: any = {}

  constructor(private router: Router) {
  }
  userRole = this.auth.user?.getValue()?.role || 'non_user';
  utilityService = inject(UtilityService);
  capacityObject = capacityObject;
  user: any = null;
  patientId: string | null = null;
  patientname: string | null = null;
  ngOnInit() {
    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['labRequest']['request'].push('testing');

      }

    })


    this.patientId = this.utilityService.getPatientIdFromRoute();




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
      // tap((data) => {
      //   console.log(data)

      //   data['labRequests'].filter((e: any) => {
      //     if (!e.requestedPeriod) {
      //       return false
      //     } else {
      //       return true;
      //     }
      //   }).forEach((element: any) => {


      //   })

      // }),
      // map((data) => {
      //   const toReturnData = {
      //     ...data, labRequests: data['labRequests'].filter((e: any) => {
      //       console.log(Object.keys(e), e.hasOwnProperty("code"));
      //       return e.hasOwnProperty("code")
      //     })
      //   }
      //   console.log(toReturnData);
      //   return toReturnData;
      // })


    ).subscribe((allData) => {
      console.log(allData)

      this.labRequests = allData['labRequests'] //.slice(0, 5);

        //  this.references = new Map(allData['patMed']['references']);
        //  console.log(this.references);
        .entry?.map((e: BundleEntry, index: any) => {
          for (const [key, value] of Object.entries(e.resource as ServiceRequest)) {
            console.log(value.reference);
            if (this.isLinkObj.hasOwnProperty(key)) {
              this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
            } else {
              this.isLinkObj[key] = new Map();
              this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
            }
            console.log(this.isLinkObj[key]);

          }
          return e.resource as ServiceRequest
        });
      const sortedAccRequisition: { [key: string]: ServiceRequest[] } = {}
      this.labRequests?.forEach((e: ServiceRequest) => {
        if (e.hasOwnProperty('requisition') && e.requisition?.hasOwnProperty('value')) {
          if (!sortedAccRequisition.hasOwnProperty(e.requisition!.value!)) {
            sortedAccRequisition[e.requisition!.value!] = [];
          }
          sortedAccRequisition[e.requisition!.value!].push(e);
        } else {
          sortedAccRequisition['N/A'] = sortedAccRequisition['N/A'] || [];
          sortedAccRequisition['N/A'].push(e);
        }
        this.sortedWithRequisition = sortedAccRequisition;
      })
      console.log(sortedAccRequisition);
      this.sortedWithRequisitionKeys = Object.keys(sortedAccRequisition);
      console.log(this.sortedWithRequisitionKeys);
      Object.values(sortedAccRequisition).forEach((e: ServiceRequest[]) => {
        this.labRequestsData = [...this.labRequestsData || [], ...e];
      });
      // alert("Lab Requests Data Loaded Successfully" + this.labRequestsData?.length);
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

  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }

  isLinkObj: { [key: string]: Map<number, string | null> } = {};
  islink = inject(LinkInReferencesService)

  showSpecimenForThisTest() {
    // alert(this.utilityService.getPatientIdFromRoute() || this.patientId);
    this.dialog.open(SpecimenDetailsComponent, {
      maxWidth: '450px',
      maxHeight: '90vh',
      panelClass: 'visible-overflow',
      data: {
        specimenDetails: null,

      }

    })
  }
  showResultsForThisTest(element: ServiceRequest) {
    // alert("Show Results for this test");
    console.log(element);

  }
  showDetails(element: ServiceRequest) {
    // alert("Show Details for this test");
    console.log(element);
    this.dialog.open(LabrequestDetailsComponent, {
      maxWidth: '450px',
      maxHeight: '90vh',
      panelClass: 'visible-overflow',
      data: {
        serviceRequest: element,
        patientId: this.utilityService.getPatientIdFromRoute() || this.patientId,

      }
    })
  }

  showReport() {
    // alert("Show Report for this test");
    console.log("Show Report for this test");
    this.dialog.open(LabreportComponent, {
      maxWidth: '900px',
      maxHeight: '90vh',

    })
  }
  addLabResults(patientId: string | null = null) {
    this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '1200px',
      autoFocus: false,
      data: {
        isAnyCategory: false,
        observationCategoryValue: "laboratory"
      }
    })
  }
}
