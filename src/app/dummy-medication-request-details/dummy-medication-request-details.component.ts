//port { HttpClient } from '@angular/common/http';
import { Component, Inject, inject, Input, Optional } from '@angular/core';
import { Bundle, CodeableReference, Dosage, Medication, MedicationRequest, Reference } from 'fhir/r5';
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
import { BehaviorSubject, forkJoin, map, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { medicationIntentStyles } from '../shared/intentIconStyles';
import { ReferencePipe } from '../shared/pipes/CodeableReference.pipe';
import { CodeableReferencePipe } from '../shared/codeable-reference.pipe';
import { FhirReferenceLabelPipe } from '../shared/pipes/Reference.pipe';
import { CodeableConceptLabelPipe } from '../shared/pipes/CodeableConcept.pipe';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-dummy-medication-request-details',
  imports:
    [MatCardModule, MatButtonModule,
      MatFormField, MatDividerModule, DatePipe, RouterLink,
      RouterLinkActive, CommonModule,
      MatExpansionModule, MatCheckboxModule, TitleCasePipe,
      MatTableModule, AsyncPipe,
      MatChipsModule,
      MatInputModule, ReferencePipe, CodeableConceptLabelPipe,
      MatMenuModule, CodeableReferencePipe, FhirReferenceLabelPipe,
      MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './dummy-medication-request-details.component.html',
  styleUrl: './dummy-medication-request-details.component.scss'
})
export class DummyMedicationRequestDetailsComponent {
  @Input() inputData!: any
  http = inject(HttpClient);
  allMedications!: MedicationRequest[];
  statuStyles: any;
  intentStyles: any;
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {

  }
  ngOnInit() {
    this.statuStyles = baseStatusStyles
    this.intentStyles = medicationIntentStyles
    this.http.get<Bundle>(
      // "https:hapi.fhir.org/baseR4/MedicationRequest?_format=json",
      "https://server.fire.ly/r5/MedicationRequest?_format=json"
    ).pipe(map((dataBundle: Bundle) => {
      console.log(dataBundle);
      if (dataBundle.entry && dataBundle.entry.length) {
        return dataBundle.entry?.map((eachMedicationResource) => {
          console.log((eachMedicationResource.resource as MedicationRequest).medication)
          return eachMedicationResource.resource as MedicationRequest


        })
      } else {
        return []
      }
    }))
      .subscribe({
        next: (medicationResourcesArray: MedicationRequest[]) => {
          this.allMedications = medicationResourcesArray
          if (this.inputData || this.data) {
            this.allMedications[0] = this.inputData || this.data;
            this.allMedications[4] = this.inputData || this.data;
          }
        },
        error: (e: any) => {
          console.log(e)
        }
      })
  }

  sortAccordingToSequence(dosageArray: any[]): Dosage[] {
    return dosageArray.sort((a: Dosage, b: Dosage) => {
      if (a.sequence && b.sequence) {
        return a.sequence - b.sequence
      } else {
        return 0
      }
    })
  }

  // renderOtherFields(data: any, startKey: string, exclude: string[]) {
  //   let otherDetailWrapperStartTag = `<div class="other-details">`;
  //   let otherDetailWrapperEndTag = `</div>`
  //   if (startKey !== null && data[startKey]) {
  //     const otherFields = Object.keys(data[startKey]).filter((key) => !exclude.includes(key));
  //     for (const field of otherFields) {
  //       console.log(field);
  //       let fieldGroupWrapper = `<div class="field-group">`;
  //       let fieldGroupWrapperEnd = `</div>`
  //       let individualDetailWrapperStart = ""
  //       while (typeof data[startKey][field] == "object") {
  //         individualDetailWrapperStart = fieldGroupWrapper + `<div class="field-group-title">${field}</div><div class="individual-detail">`
  //         let individualDetailWrapperEnd = `</div>`
  //         for (const key of Object.keys(data[startKey][field])) {

  //         }

  //       }
  //       let finalGroup = `
  //       <div class="field-group">
  //                                       <div class="field-value" [innerHTML]="instruction.text">

  //                                       </div>
  //                                       <div class="field-title">
  //                                           Dosage Insructions In Text
  //                                       </div>
  //                                   </div>`

  //       for (let i = 0; i < data[startKey][field].length; i++) {
  //         field
  //       }
  //       let individualDetailWrapperEnd = `</div>`
  //     }
  //   }

  // }

  fieldKeys(data: any, exclude: any[]) {
    return Object.keys(data).filter((e) => {
      if (exclude.includes(e)) {
        return false
      } else {
        return true
      }
    });

  }

  renderOtherFields(data: any, key: string = '', parentWrapper: any = null): any {
    console.log(parentWrapper);
    const elements: string[] = [];

    const isPrimitive = (val: any) =>
      val === null || ['string', 'number', 'boolean'].includes(typeof val);

    //  for (const key in data) {
    if (!data.hasOwnProperty(key)) {
      return '';
    };

    //const fullKey = startKey ? `${startKey}.${key}` : key;
    const value = data[key];

    if (isPrimitive(value)) {
      console.log('primitive', value);
      const el = document.createElement('div');
      el.innerHTML = `
      ${['system', 'code', 'display'].includes(key.split('.')[key.split('.').length - 1]) ? "" :
          ` ${key.split('.')[key.split('.').length - 1]} - `
        }${value}`;
      //       el.innerHTML =     ` <div class="field-group">
      //                                         <div class="field-value">
      // ${value}
      //                                         </div>
      //                                         <div class="field-title">
      //                                            ${key.split('.')[key.split('.').length - 1]}  
      //                                         </div>
      //                                     </div>`;
      console.log(el.innerHTML);

      // <strong>: </strong> ${value}`;

      if (!parentWrapper) {
        console.log(el.innerHTML)
        if (['system', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
          return "";
        }
        return el.innerHTML
      } else {
        if (['system', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
          return parentWrapper.innerHTML;
        }
        console.log(parentWrapper.innerHTML);
        if ((parentWrapper as HTMLElement).children.length) {
          (parentWrapper as HTMLElement).children[(parentWrapper as HTMLElement).children.length - 1].appendChild(el);
        } else {
          parentWrapper.appendChild(el);
        }
        return parentWrapper.innerHTML
      }


      //elements.push(el.innerHTML);

    } else {
      if (value instanceof Array) {
        // alert("Array");
        if (!parentWrapper) {
          parentWrapper = document.createElement('div');
          parentWrapper.classList.add('detail-group');
        }
        for (const k of Object.keys(value[0])) {
          this.renderOtherFields(value[0], k, parentWrapper);
        }
        //  this.renderOtherFields(value, '0', parentWrapper);
      } else {
        console.log('object', value)
        if (parentWrapper) {
          let childWrapper = document.createElement('div');
          childWrapper.classList.add('detail-group');
          childWrapper.innerHTML = `<div class="detail-group-title"> ${key.split('.')[key.split('.').length - 1]}  </div>`;
          if (['system', 'Coding', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
            parentWrapper.appendChild(childWrapper);
          }

          console.log(parentWrapper);
        } else {
          parentWrapper = document.createElement('div');
          parentWrapper.classList.add('detail-group');
          if (['system', 'Coding', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
            parentWrapper.innerHTML = `<div class="detail-group-title"> ${key.split('.')[key.split('.').length - 1]}  </div>`;
          }

        }
        for (const k of Object.keys(value)) {
          this.renderOtherFields(value, k, parentWrapper);
        }
      }
      //this.renderOtherFields(value, `$key, parentWrapper);
    }
    // } else {
    //   console.log('val', typeof (value));
    // }
    // }
    //console.log(hugeWrapper);
    // for (const e of elements) {
    //   document.querySelector(".other-details")!.innerHTML += e;
    // }
    console.log(parentWrapper);
    return parentWrapper.innerHTML
    // ? parentWrapper.innerHTML : '';

  }
  dialog = inject(MatDialog);
  formFieldsDataService = inject(FormFieldsSelectDataService);
  dispense(medication: MedicationRequest) {

    // const medicine = (medication.medication as CodeableReference).concept ? (medication.medication as CodeableReference).concept?.coding![0]?.code + "$#$" +
    //   (medication.medication as CodeableReference).concept?.coding![0]?.display : "";
    let chosenMedicine: string | Reference | undefined = (medication.medication as CodeableReference).concept ? (medication.medication as CodeableReference).concept!.coding![0]!.display :
      (medication.medication as CodeableReference).reference ? (medication.medication as CodeableReference).reference : ""
      ;

    let chosenSubject = (medication.subject as Reference);
    console.log(chosenMedicine, chosenSubject);
    debugger;
    // console.log(this.allMedications, , medicine);
    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('medication_dispense', 'status'),
      subject: this.formFieldsDataService.getFormFieldSelectData('medication_dispense', 'subject'),
      receiver: this.formFieldsDataService.getFormFieldSelectData('medication_dispense', 'receiver'),
      medication: this.formFieldsDataService.getFormFieldSelectData('medication_dispense', 'medication')
      // bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
      // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).pipe(tap((e: any) => {
      if (e.subject) {
        chosenSubject = chosenSubject.reference ? e.subject.find((s: any) => {
          console.log(s, chosenSubject);
          return s.split("$#$")[0] == chosenSubject.reference
        })?.display : e.subject
      }
      if (e.medication) {
        chosenMedicine = (chosenMedicine as any).reference ? e.medication.find((s: any) => {
          console.log(s, chosenMedicine);
          return s.split("$#$")[0] == chosenMedicine
        })?.display : chosenMedicine
      }
    })).subscribe({
      next: (g: any) => {
        this.dialog.open(DynamicFormsV2Component, {
          maxWidth: '900px',
          maxHeight: "90vh",

          data: {

            formMetaData: <formMetaData>{
              formName: 'Medication Dispense',
              formDescription: "Use this form to record a medication dispense.",
              submitText: 'Confirm Dispense',
            },
            formFields: <FormFields[]>[
              {

                generalProperties: {

                  fieldApiName: 'recorded',
                  fieldName: 'When this dispense is recorded',
                  fieldLabel: 'When this dispense is recorded',

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

                  fieldApiName: 'medication',
                  fieldName: 'Medication Requested',
                  fieldLabel: 'Medication Requested',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldType: "CodeableConceptField",
                  value: chosenMedicine,
                  isArray: false,
                  isGroup: false
                },

                data: g.medication


              },

              {

                generalProperties: {

                  fieldApiName: 'quantity',
                  fieldName: 'Quantity Requested',
                  fieldLabel: 'Quantity Requested',
                  fieldPlaceholder: "2 packets",

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  isArray: false,
                  isGroup: false
                },




              },

              {

                generalProperties: {

                  fieldApiName: 'whenHandedOver',
                  fieldName: 'When the Medication was Handed Over',
                  fieldLabel: 'When the Medication was Handed Over',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: "datetime-local",
                  isArray: false,
                  isGroup: false
                },


              },
              {

                generalProperties: {

                  fieldApiName: 'subject',
                  fieldName: 'Who is this Medication For',
                  fieldLabel: 'Who is the Medication For',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: chosenSubject,

                  isArray: true,
                  isGroup: false,
                  fieldType: 'CodeableConceptField',
                },
                data: g.subject,


              },
              {

                generalProperties: {

                  fieldApiName: 'receiver',
                  fieldName: 'Who received the medicine',
                  fieldLabel: 'Who received the medicine',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  inputType: "datetimelocal",
                  isArray: true,
                  isGroup: false,
                  fieldType: 'CodeableConceptField',
                },
                data: g.receiver,


              },
              <GroupField>{

                generalProperties: {

                  fieldApiName: 'substitution',
                  fieldName: 'Substitution Info',
                  fieldLabel: 'Substitution Info',
                  fieldType: "CodeField",


                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  isArray: false,
                  isGroup: true
                },

                groupFields: {

                  'isSubstituted': <SingleCodeField>{
                    generalProperties: {

                      fieldApiName: 'substitution_wasSubstituted',
                      fieldName: 'is Medicine Subsituted',
                      fieldLabel: 'is Medicine Subsituted',

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                      fieldType: "SingleCodeField",

                      inputType: "boolean",
                      isArray: false,
                      isGroup: false
                    },

                    data: ['Yes', 'No']


                  },
                  'substitution_reason': <IndividualField>{
                    generalProperties: {

                      fieldApiName: 'substitution_reason',
                      fieldName: 'Reason for Subsitution',
                      fieldLabel: 'Reason for Substitution',

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },


                      inputType: "textarea",
                      isArray: false,
                      isGroup: false
                    },

                  }

                },

                keys: ['isSubstituted', 'substitution.reason']


              },



              {

                generalProperties: {

                  fieldApiName: 'note',
                  fieldName: 'Note About the Dispense',
                  fieldLabel: 'Note About the Dispense',

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

  errorService = inject(ErrorService);


}
