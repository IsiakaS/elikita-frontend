import { Component, inject } from '@angular/core';
import { commonImports, tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { UtilityService } from '../shared/utility.service';
import { Bundle, HealthcareService } from 'fhir/r5';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { References2Pipe } from '../shared/references2.pipe';
import { HospitalService } from '../hospital-details/hospital.service';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';

@Component({
  selector: 'app-services',
  imports: [...commonImports,
    CommonModule,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss'
})
export class ServicesComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: HealthcareService[];
  tableDataSource = new MatTableDataSource<HealthcareService>();
  tableDataLevel2: BehaviorSubject<any> = new BehaviorSubject([]);
  references!: Map<string, any>;
  tableFilter!: Map<string, any[]>;
  tableFilterFormControlObject: { [key: string]: FormGroup<any>; } | any = {};
  patientName!: Observable<string | null>;
  patientId!: string | null;
  tableColumns!: string[];
  http: HttpClient = inject(HttpClient);
  // utilityService = inject(UtilityService)
  patientOpenAndClose: PatientDetailsKeyService = inject(PatientDetailsKeyService);
  getPatientName(): void {
    if (!this.getPatientId()) return;
    this.patientName = this.utilityService.getPatientName(this.getPatientId)
  }

  getPatientId(): string | null {
    return this.patientId = this.route.parent?.snapshot.params['id'] || this.utilityService.getPatientIdFromRoute();
  }
  connectTableDataSource(): void {
    this.tableDataSource.connect = () => {
      return this.tableDataLevel2
    }
  }
  isLinkObj: { [key: string]: Map<any, any> } = {}
  subscribeToResolver(): void {
    this.http.get<Bundle<HealthcareService>>('https://server.fire.ly/r5/HealthcareService?_format=json').subscribe((e: Bundle<HealthcareService>) => {
      // this.route.data.subscribe((allData) => {
      this.immutableLevelTableData = (e as Bundle).entry!.map((e, index) => {
        for (const [key, value] of Object.entries(e.resource as HealthcareService)) {
          console.log(value.reference);
          if (this.isLinkObj.hasOwnProperty(key)) {
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          } else {
            this.isLinkObj[key] = new Map();
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          }
          console.log(this.isLinkObj[key]);

        }

        return e.resource as HealthcareService & { [key: string]: any };
      });

      console.log(this.immutableLevelTableData);
      this.tableDataLevel2.next(this.immutableLevelTableData);
    });


  }
  auth = inject(AuthService);
  user: any = null;
  encounterService = inject(EncounterServiceService);
  capacityObject = capacityObject;
  ngOnInit() {
    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['medicationRequest']['request'].push('testing');

      }

    })
    this.tableFilter = new Map([

    ]);

    this.tableColumns = [
      'name',
      'type',
      'category',
      'contact',

      'actions'


    ]
    this.getPatientId();

    this.getPatientName();
    this.connectTableDataSource();
    this.subscribeToResolver();

    for (const [key, value] of this.tableFilter) {
      this.tableFilterFormControlObject[key] = new FormGroup({});
      for (const filterValue of value) {
        this.tableFilterFormControlObject[key].addControl(filterValue, new FormControl(false));
      }
    }
  }

  dialog!: MatDialog;
  errorService!: ErrorService;
  showRow(row: any): void {
    throw new Error('Method not implemented.');
  }
  hospital = inject(HospitalService)

}
