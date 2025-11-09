import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, forkJoin, map, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { commonImports } from '../shared/table-interface';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { Bundle, ChargeItemDefinition, InventoryItem, Medication, MedicationRequest, Resource } from 'fhir/r5';
import { CodeableRef2Pipe } from '../shared/codeable-ref2.pipe';
import { References2Pipe } from '../shared/references2.pipe';
import { LinkInReferencesService } from '../shared/link-in-references.service';
import { fetchFromReferencePipe } from '../shared/Fetch.pipe';
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { baseStatusStyles } from '../shared/statusUIIcons';
import { DetailBaseComponent } from '../shared/detail-base/detail-base.component';
import { DummyMedicationRequestDetailsComponent } from '../dummy-medication-request-details/dummy-medication-request-details.component';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { AuthService, capacityObject } from '../shared/auth/auth.service';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AddAllergyComponent } from './add-allergy/add-allergy.component';
import { PriceFormatPipe } from "../shared/price-format.pipe";


type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-allergy',
  imports: [...commonImports,
    CommonModule,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent, PriceFormatPipe],
  templateUrl: './allergy.component.html',
  styleUrl: './allergy.component.scss'
})
export class AllergyComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: any[];
  tableDataSource = new MatTableDataSource();
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
    forkJoin(
      {
        medicine: this.http.get<Bundle<any>>("https://server.fire.ly/r5/AllergyIntolerance?_format=json&category=medication,food&criticality=low,high&_count=8"),

      }
    ).pipe(
      map((e: any) => {
        return {
          ...e, medicine: {
            ...e.medicine, entry: e.medicine.entry.filter((f: any) => {
              return f.resource.hasOwnProperty('verificationStatus');
            }).slice(0, 7)
          }
        }
      })
    )

      .subscribe((allData) => {
        this.immutableLevelTableData = (allData['medicine']).entry!.map((e: any, index: number) => {
          for (const [key, value] of Object.entries(e.resource)) {
            //console.log(value.reference);
            if (this.isLinkObj.hasOwnProperty(key)) {
              this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
            } else {
              this.isLinkObj[key] = new Map();
              this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
            }
            console.log(this.isLinkObj[key]);

          }
          return e.resource
        });

        this.tableDataLevel2.next(this.immutableLevelTableData);
      })
  }
  sortedWithRequisition: { [key: string]: MedicationRequest[] } = {};
  sortedWithRequisitionKeys: string[] = [];
  //for determining actions available to the user
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
      ['Status', ['confirmed', 'presumed', 'unconfirmed', 'refuted', 'entered-in-error']],
      ['criticality', ['low', 'high', 'unable-to-assess']],
      ['category', ['food', 'medication', 'environment', 'biologic']]
    ])

    this.tableColumns = [
      'code',
      'criticality',
      'category',
      'verificationStatus',
      // 'ingredientItems',



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
  dialog: MatDialog = inject(MatDialog);
  errorService: ErrorService = inject(ErrorService);
  showRow(row: any): void {
    console.log(row);
  }

  alltds(td: HTMLTableCellElement): void {
    //  alert(td!.parentElement!.innerHTML);
    const tdArr = Array.from(document.getElementsByTagName("td")) as HTMLElement[]
    tdArr.forEach((e => { e!.parentElement!.style.zIndex = "99999" }));
    (td as HTMLElement).parentElement!.style.zIndex = "999999999999999999";
    (td as HTMLElement).parentElement!.style!.overflow = "visible"
  }




  viewDetails(element: any) {
    this.dialog.open(DummyMedicationRequestDetailsComponent,

      {
        maxHeight: '93vh',


      })
  }

  formFieldsDataService = inject(FormFieldsSelectDataService);



  addAllergy() {
    this.dialog.open(AddAllergyComponent, {
      maxWidth: '650px',
      maxHeight: '93vh',

    })
  }
}