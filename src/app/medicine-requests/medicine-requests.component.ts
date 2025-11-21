import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { tablePropInt } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { ErrorService } from '../shared/error.service';
import { commonImports } from '../shared/table-interface';
import { UtilityService } from '../shared/utility.service';
import { MatTableDataSource } from '@angular/material/table';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { CodeableConcept2Pipe } from '../shared/codeable-concept2.pipe';
import { Bundle, Medication, MedicationRequest, Resource } from 'fhir/r5';
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
import { StateService } from '../shared/state.service';
import { EmptyStateComponent } from "../shared/empty-state/empty-state.component";
import { DetailsBuilderObject } from '../detailz-viewz/details-builder.service';
import { DetailzViewzComponent } from '../detailz-viewz/detailz-viewz.component';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-medicine-requests',
  imports: [...commonImports,
    CommonModule,
    JsonPipe, CodeableConcept2Pipe, CodeableRef2Pipe, References2Pipe, fetchFromReferencePipe,
    MatProgressSpinnerModule, DetailBaseComponent, EmptyStateComponent],
  templateUrl: './medicine-requests.component.html',
  styleUrl: './medicine-requests.component.scss'
})
export class MedicineRequestsComponent implements tablePropInt {
  statusStyles = baseStatusStyles;
  islink = inject(LinkInReferencesService);
  utilityService: UtilityService = inject(UtilityService);
  route: ActivatedRoute = inject(ActivatedRoute);
  immutableLevelTableData!: MedicationRequest[];
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
stateService = inject(StateService);
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
    this.stateService.PatientResources.medicationRequests.//asObservable().pipe().subscribe((medReqs) => {
    subscribe((allData: any) => {
      this.immutableLevelTableData = allData.map((e:any, index:number) => {
        e.resource = e.actualResource as MedicationRequest;
        for (const [key, value] of Object.entries(e.resource as MedicationRequest)) {
          console.log(value.reference);
          if (this.isLinkObj.hasOwnProperty(key)) {
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          } else {
            this.isLinkObj[key] = new Map();
            this.isLinkObj[key].set(index, this.islink.returnLinkFromReferences(value));
          }
          console.log(this.isLinkObj[key]);

        }
        return e.resource as MedicationRequest
      });
      const sortedAccRequisition: { [key: string]: MedicationRequest[] } = {}
      this.immutableLevelTableData?.forEach((e: MedicationRequest) => {

        if (e.hasOwnProperty('groupIdentifier') && e.groupIdentifier?.hasOwnProperty('value')) {
          if (!sortedAccRequisition.hasOwnProperty(e.groupIdentifier!.value!)) {
            sortedAccRequisition[e.groupIdentifier!.value!] = [];
          }
          sortedAccRequisition[e.groupIdentifier!.value!].push(e);
        } else {
          sortedAccRequisition['N/A'] = sortedAccRequisition['N/A'] || [];
          sortedAccRequisition['N/A'].push(e);
        }
        this.sortedWithRequisition = sortedAccRequisition;
      })
      console.log(sortedAccRequisition);
      this.sortedWithRequisitionKeys = Object.keys(sortedAccRequisition);
      console.log(this.sortedWithRequisitionKeys);
      this.immutableLevelTableData = [];
      Object.values(sortedAccRequisition).forEach((e: MedicationRequest[]) => {
        this.immutableLevelTableData = [...this.immutableLevelTableData || [], ...e];
      });
      // this.references = new Map(allData['patMed']['references']);
      // console.log(this.references);
      console.log(this.immutableLevelTableData);
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

//retun early ithere is no patient id
if(this.stateService.currentPatientIdFromResolver.getValue() === null){
  this.errorService.openandCloseError("No patient selected. Please select a patient to view medication requests.");
  return;
}

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
      'groupIdentifier',
      'status',
      'subject',
      'medication',
      'action',
      'groupReport',

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
    this.dialog.open(DetailzViewzComponent, {
      maxHeight: '93vh',
      maxWidth: '90vh',
      data: {
        resourceData:row,
        detailsBuilderObject: this.detailsBuilder
      }
    })
  }
  detailsBuilder: DetailsBuilderObject = {
    resourceName: 'Medication Request',
    resourceIcon: 'prescriptions',
    specialHeader: {
      strongSectionKey: 'medicationCodeableConcept',
      iconSectionKeys: ['status', 'intent'],
      contentSectionKeys: ['subject', 'authoredOn']
    },
    groups: [
      {
        groupName: 'Classification',
        groupIcon: 'category',
        groupKeys: ['priority', 'status', 'intent', 'category']
      },
      {
        groupName: 'Participants',
        groupIcon: 'group',
        groupKeys: ['subject', 'requester', 'performer', 'performerType']
      },
      {
        groupName: 'Clinical Details',
        groupIcon: 'science',
        groupKeys: ['medicationCodeableConcept', 'medicationReference', 'dosageInstruction', 'reasonCode']
      },
      {
        groupName: 'Fulfilment',
        groupIcon: 'check_circle',
        groupKeys: ['authoredOn', 'dispenseRequest', 'substitution',]
      }
    ]
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
  administer(medication: MedicationRequest) {
    // 'status': "http://hapi.fhir.org/baseR5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/medication-admin-status&_format=json",
    //   'medication': "/dummy.json",
    //     'subject': "http://hapi.fhir.org/baseR5/Patient?_format=json",
    //       "performer": "http://hapi.fhir.org/baseR5/Practitioner?_format=json",
    //         "request": "h

    // console.log(this.allMedications, , medicine);


    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('medication_administration', 'status'),
      subject: this.formFieldsDataService.getFormFieldSelectData('medication_administration', 'subject'),
      performer: this.formFieldsDataService.getFormFieldSelectData('medication_administration', 'performer'),
      medication: this.formFieldsDataService.getFormFieldSelectData('medication_administration', 'medication')
      // bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
      // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).pipe().subscribe({
      next: (g: any) => {
        this.dialog.open(DynamicFormsV2Component, {
          maxWidth: '900px',
          maxHeight: "90vh",

          data: {

            formMetaData: <formMetaData>{
              formName: 'Medication Administration',
              formDescription: "Use this form to record a medicine administration.",
              submitText: 'Confirm Medicine Administration',
            },
            formFields: <FormFields[]>[

              {

                generalProperties: {

                  fieldApiName: 'occurenceDateTime',
                  fieldName: 'When this administration ocurred',
                  fieldLabel: 'When this administration ocurred',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: new Date().toISOString(),
                  inputType: "datetime-local",
                  isArray: false,
                  isGroup: false
                },


              },
              {

                generalProperties: {

                  fieldApiName: 'recorded',
                  fieldName: 'When this administration is recorded',
                  fieldLabel: 'When this administration is recorded',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: new Date().toISOString(),
                  inputType: "datetime-local",
                  isArray: false,
                  isGroup: false
                },


              },





              {

                generalProperties: {

                  fieldApiName: 'actor',
                  fieldName: 'Practitioners Who Administered the Medicine',
                  fieldLabel: 'Practitioners Who Administered the Medicine',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  isArray: true,
                  isGroup: false,
                  fieldType: 'IndividualReferenceField',
                },
                data: g.performer,


              },



              {

                generalProperties: {

                  fieldApiName: 'note',
                  fieldName: 'Note About the Administration',
                  fieldLabel: 'Note About the Administration',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: "textarea",
                  isArray: false,
                  isGroup: false
                },


              },

              // {

              //   generalProperties: {

              //     fieldApiName: 'Order Details',
              //     fieldName: 'Purchase Information',
              //     fieldLabel: 'Order Information',

              //     auth: {
              //       read: 'all',
              //       write: 'doctor, nurse'
              //     },
              //     fieldType: "ReferenceField",


              //     isArray: false,
              //     isGroup: true,
              //   },

              //   keys: ['medicine_ref', 'quantity_sold'],
              //   groupFields: {
              //     'medicine_ref': {

              //     },
              //     'quantity_sold': {

              //     }

              //   }


              // },
            ]
          }
        })
      },

      error: (err) => {
        this.errorService.openandCloseError("Error ocurred while preparing fields dropdowns for the form")
        console.log(err);
      }
    })
  }



}