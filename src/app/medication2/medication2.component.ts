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
import { AddMedicationComponent } from './add-medication/add-medication.component';
import { PriceFormatPipe } from "../shared/price-format.pipe";


type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-medication2',
  imports: [...commonImports,
    CommonModule,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent, PriceFormatPipe],
  templateUrl: './medication2.component.html',
  styleUrl: './medication2.component.scss'
})
export class MedicationComponent2 implements tablePropInt {
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
        medicine: this.http.get<Bundle<any>>("https://hapi.fhir.org/baseR5/Medication?_format=json&_count=100"),
        chargeItemDef: this.http.get<Bundle<ChargeItemDefinition>>("https://hapi.fhir.org/baseR5/ChargeItemDefinition?_format=json&_count=20"),
        InventoryItem: this.http.get<Bundle<InventoryItem>>("https://server.fire.ly/r5/InventoryItem?_format=json&_count=20")

      }
    ).pipe(
      map((e: { medicine: Bundle<any>, chargeItemDef: Bundle<ChargeItemDefinition>, InventoryItem: Bundle<InventoryItem> }) => {
        if (e.medicine.entry && e.chargeItemDef.entry) {
          e.medicine.entry = e.medicine.entry.filter((g: any) => {
            return g.resource.hasOwnProperty('code') && g.resource.hasOwnProperty('status')
            // &&
            // g.resource.hasOwnProperty('batch') && 
            // g.resource.hasOwnProperty('ingredient') &&
            // g.resource.batch.hasOwnProperty('expirationDate') &&
            // g.resource.hasOwnProperty('doseForm')
          }).map((f: any, index: number) => {
            // if( e.chargeItemDef.entry && e.chargeItemDef.entry[index]?.resource?.hasOwnProperty('unitPrice')) {
            const actualAmount = e.chargeItemDef.entry?.[index]?.resource?.propertyGroup?.[0]?.priceComponent?.[0]?.amount?.value || '6,000.00';
            const currency = e.chargeItemDef.entry?.[index]?.resource?.propertyGroup?.[0]?.priceComponent?.[0]?.amount?.currency || 'NGN';
            const unitPrice = currency + ' ' + actualAmount;

            // do for inventory too - quantity in Stock
            //net content + base Unit
            let netContent: number | string = e.InventoryItem.entry?.[index]?.resource?.netContent?.value || 0;
            const baseUnit = e.InventoryItem.entry?.[index]?.resource?.netContent?.unit || 'mg';

            let inStockStatus = netContent === 0 ? "out of stock" : netContent + ' ' + baseUnit;


            return { ...f, resource: { ...f.resource, unitPrice, inStockStatus } };

          }
            // else{

            // }
          );
        }
        return e;
      })
    )

      .subscribe((allData) => {
        this.immutableLevelTableData = (allData['medicine']).entry!.map((e, index) => {
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
        const sortedAccRequisition: { [key: string]: MedicationRequest[] } = {}
        // this.immutableLevelTableData?.forEach((e: MedicationRequest) => {

        // if (e.hasOwnProperty('groupIdentifier') && e.groupIdentifier?.hasOwnProperty('value')) {
        //   if (!sortedAccRequisition.hasOwnProperty(e.groupIdentifier!.value!)) {
        //     sortedAccRequisition[e.groupIdentifier!.value!] = [];
        //   }
        //   sortedAccRequisition[e.groupIdentifier!.value!].push(e);
        // } else {
        //   sortedAccRequisition['N/A'] = sortedAccRequisition['N/A'] || [];
        //   sortedAccRequisition['N/A'].push(e);
        // }
        // this.sortedWithRequisition = sortedAccRequisition;
        // })
        // console.log(sortedAccRequisition);
        // this.sortedWithRequisitionKeys = Object.keys(sortedAccRequisition);
        // console.log(this.sortedWithRequisitionKeys);
        // Object.values(sortedAccRequisition).forEach((e: MedicationRequest[]) => {
        //   this.immutableLevelTableData = [...this.immutableLevelTableData || [], ...e];
        // });
        // this.references = new Map(allData['patMed']['references']);
        // console.log(this.references);
        // console.log(this.immutableLevelTableData);
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
    this.tableFilter = new Map([[
      'status', ['active', 'on-hold', 'ended', 'stopped', 'completed', 'cancelled', 'draft']
    ]
    ])

    this.tableColumns = [
      'code',
      'status',
      'doseForm',
      // 'ingredientItems',
      'expirationDate',
      'inStockStatus',
      'unitPrice',


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



  addMedicine() {
    this.dialog.open(AddMedicationComponent, {
      maxWidth: '650px',
      maxHeight: '93vh',

    })
  }
}