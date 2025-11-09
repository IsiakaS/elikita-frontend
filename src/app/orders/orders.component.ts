import { Component, inject, Inject } from '@angular/core';
import { commonImports, tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { UtilityService } from '../shared/utility.service';
import { Bundle, Claim, HealthcareService } from 'fhir/r5';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule, DecimalPipe, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { References2Pipe } from '../shared/references2.pipe';
import { HospitalService } from '../hospital-details/hospital.service';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';
import { CodeableReferenceDisplayComponent } from '../shared/codeable-reference-display/codeable-reference-display.component';
import { ReferenceDisplayComponent } from '../shared/reference-display/reference-display.component';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { generalFieldsData, IndividualReferenceField, formMetaData } from '../shared/dynamic-forms.interface2';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { EncounterV2Component } from '../encounter-v2/encounter-v2.component';
import { PriceFormatPipe } from "../shared/price-format.pipe";

@Component({
  selector: 'app-orders',
  imports: [...commonImports,
    CommonModule, CodeableReferenceDisplayComponent, DecimalPipe,
    ReferenceDisplayComponent,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent, PriceFormatPipe],
  templateUrl: './orders.component.html',
  styleUrl: '../services/services.component.scss'
})
export class OrdersComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: Claim[];
  tableDataSource = new MatTableDataSource<Claim>();
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
    this.http.get<Bundle<Claim>>('https://server.fire.ly/r4/Claim?_format=json').subscribe((e: Bundle<Claim>) => {
      // this.route.data.subscribe((allData) => {
      this.immutableLevelTableData = (e as Bundle).entry!.map((e, index) => {
        for (const [key, value] of Object.entries(e.resource as Claim)) {
          console.log(value.reference);
          if (this.isLinkObj.hasOwnProperty(key)) {
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          } else {
            this.isLinkObj[key] = new Map();
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          }
          console.log(this.isLinkObj[key]);

        }

        return e.resource as Claim & { [key: string]: any };
      });

      console.log(this.immutableLevelTableData);
      this.tableDataLevel2.next(this.immutableLevelTableData);
    });


  }
  auth = inject(AuthService);
  user: any = null;
  encounterService = inject(EncounterServiceService);
  capacityObject = capacityObject;
  formFieldService = inject(FormFieldsSelectDataService);
  toUseEncounterForm?: any;
  ngOnInit() {

    forkJoin({
      'encounter': this.formFieldService.getFormFieldSelectData('addClaim', 'encounter'),
    }).subscribe((g: any) => {
      this.toUseEncounterForm = <IndividualReferenceField>{
        generalProperties: <generalFieldsData>{
          auth: {
            read: 'all',
            write: 'doctor, nurse'
          },
          fieldApiName: 'encounterRef',
          fieldName: "Encounter",
          fieldType: 'IndividualReferenceField',
          inputType: 'text',
          isArray: false,
          isGroup: false,

        },
        data: g.encounter,
      };
    });


    this.auth.user.subscribe((user) => {
      this.user = user;

      if (this.route.parent?.routeConfig?.path?.includes('testing')) {
        this.encounterService.setEncounterState('100001', 'in-progress');
        this.user = { role: 'testing' }
        this.patientId = '100001';
        capacityObject['medicationRequest']['request'].push('testing');

      }

    })
    //price, type
    this.tableFilter = new Map([
      ['type', ['pharmacy', 'laboratory', 'radiology', 'other']],
      ['price', ['0 - 10,000', '10,000 - 50,000', '50,000 - 100,000', '100,000+']],

    ]);

    this.tableColumns = [

      'type',
      'subtype',
      'patient',
      // 'provider',
      'total',
      // 'paid',

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

  dialog = inject(MatDialog);
  errorService!: ErrorService;
  showRow(row: any): void {
    throw new Error('Method not implemented.');
  }
  hospital = inject(HospitalService)


  addClaim() {

    this.dialog.open(SDialog, {
      maxWidth: '650PX',
      maxHeight: '93vh',
      data: {
        toUseEncounterForm: this.toUseEncounterForm,

      }
    });
  }

}

@Component({
  imports: [DynamicFormsV2Component],
  template: `
<div></div>
`
})
export class SDialog {
  toPassMetaData: formMetaData = {
    formName: 'Choose Encounter',
    formDescription: "Select the encounter to use as a basis for this claim.",
    showSubmitButton: true,
    submitText: "Submit",
    closeDialogOnSubmit: true
  }
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
  }
  dialog = inject(MatDialog);

  ngOnInit() {
    console.log(this.data)
    const rr = this.dialog.open(DynamicFormsV2Component, {
      maxWidth: '650PX',
      maxHeight: '93vh',
      data: {
        formMetaData: this.toPassMetaData,
        formFields: [this.data.toUseEncounterForm],
      },
    })

    rr.afterClosed().subscribe((result) => {
      this.dialog.open(EncounterV2Component, {
        maxWidth: '1200PX',
        maxHeight: '93vh',

      })

    })

  }

}