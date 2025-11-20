


import { CommonModule } from '@angular/common';
import { Component, inject, Optional, Inject, ViewChild, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { forkJoin, map, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { ResourceDataReviewComponent } from '../../shared/resource-data-review/resource-data-review.component'; // added
import { backendEndPointToken } from '../../app.config';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-add-lab-requests',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, DynamicFormsV2Component, ReactiveFormsModule, MatIconModule,
    MatButtonModule, ResourceDataReviewComponent /* added */
  ],
  templateUrl: '../../lab-requests/add-lab-requests/add-lab-requests.component.html',
  styleUrls: ['../../lab-requests/add-lab-requests/add-lab-requests.component.scss']
})
export class AddSpecimenComponent {
  //constructor with optional mat dialog
  http = inject(HttpClient);
  private fb = inject(FormBuilder);
  public _patientId?: string;
  public _serviceRequestId?: string;
  @Input() set patientId(value: string | undefined) {
    this._patientId = value;
  }
  @Input() set serviceRequestId(value: string | undefined) {
    this._serviceRequestId = value;
  }

  // Root form with a form array that mirrors fields in this.formFields
  requestForm: FormGroup = this.fb.group({
    items: this.fb.array([])
  });

  get items(): FormArray {
    return this.requestForm.get('items') as FormArray;
  }

  // Builds one form group whose controls match this.formFields by fieldApiName
  private buildItemGroup(overrideValues?: Record<string, any>): FormGroup {
    const controls: Record<string, FormControl> = {};
    (this.formFields || []).forEach(f => {
      const apiName = f.generalProperties.fieldApiName;
      let initial: any;
      if (overrideValues && Object.prototype.hasOwnProperty.call(overrideValues, apiName)) {
        initial = overrideValues[apiName]; // highest precedence
      } else if ('value' in f.generalProperties) {
        initial = (f as any).generalProperties.value;
      } else {
        initial = null;
      }
      controls[apiName] = new FormControl(initial);
    });
    return this.fb.group(controls);
  }

  // Sync single field edits from ResourceDataReviewComponent
  onFieldEdited(index: number, evt: { fieldApiName: string; newValue: any; isArray?: boolean; arrayIndex?: number }) {
    const group = this.items.at(index) as FormGroup;
    if (!group) return;
    group.patchValue({ [evt.fieldApiName]: evt.newValue });
  }

  // Sync full resource object updates
  onResourceUpdated(index: number, updated: any) {
    const group = this.items.at(index) as FormGroup;
    if (!group) return;
    group.patchValue(updated);
  }

  dialog = inject(MatDialog)

  constructor(@Optional() public dialogRef: MatDialogRef<AddSpecimenComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(backendEndPointToken) public backendEndPoint: string
  ) {
    // alert(JSON.stringify(data));\
    if(this.data && this.data.patientId ){
      this.patientId = this.data.patientId;
    }
    if(this.data && this.data.serviceRequestId ){
      this.serviceRequestId = this.data.serviceRequestId;
    } 
  }
  submittedValues: any;




  isChosenOption = false;
  isMultiple = new FormControl(null);
  formMetaData?: formMetaData;
  formFields?: FormFields[];
  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService);
  medicineForms: { formFields: FormFields[], formMetaData: formMetaData }[] = [

  ]

  ngOnInit() {
      this.formMetaData = <formMetaData>{
          // formName: 'Service Request (Lab Tests, e.t.c.)',
          // formDescription: "Use this form to order a lab test or any other medical services from your or other department",
          // submitText: 'Submit Request',

          formName: "Use this form to enter a specimen record",
          formDescription: "Use this form to record a specimen for a specific lab test",
          submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
            ? 'Add' : 'Submit'} Specimen Record`,

        };
    this.isMultiple.valueChanges.subscribe((e: boolean | null) => {
      if (e !== null) {
        this.isChosenOption = true;
      }
        this.formMetaData = <formMetaData>{
          // formName: 'Service Request (Lab Tests, e.t.c.)',
          // formDescription: "Use this form to order a lab test or any other medical services from your or other department",
          // submitText: 'Submit Request',


          formName: "Use this form to enter a specimen record",
          formDescription: "Use this form to record a specimen for a specific lab test",
          submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
            ? 'Add' : 'Submit'} Specimen Record`,
        }
    })


console.log(`${this.backendEndPoint}/ServiceRequest`)


       forkJoin({
         status: this.formFieldsDataService.getFormFieldSelectData('specimen', 'status'),
         type: this.formFieldsDataService.getFormFieldSelectData('specimen', 'type'),
         condition: this.formFieldsDataService.getFormFieldSelectData('specimen', 'condition'),
         bodySite: this.formFieldsDataService.getFormFieldSelectData('specimen', 'bodySite'),
         subject: this.formFieldsDataService.getFormFieldSelectData('specimen', 'subject'),
         request: this.formFieldsDataService.getFormFieldSelectData('specimen', 'request'),
          patientSpecificRequest: this._patientId?this.http.get(`${this.backendEndPoint}/ServiceRequest`).pipe(
          // Filter to only those for the specific patient
             map((srBundle: any) => {
              srBundle.entry = srBundle.entry.filter((entry: any) => {
                const sr: any = entry.resource;
                return sr.subject && sr.subject.reference === `Patient/${this._patientId}`;
              });
              return srBundle;
              console.log(srBundle);
             const toReturn = this.formFieldsDataService.serviceRequestBundleToReferenceData(srBundle)
          console.log(toReturn);
          return toReturn;
            }),
          
         ) : (of([])),
         // code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
         // performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
         // priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
       }).subscribe({
         next: (g: any) => {
   
   
          //  const dRef = this.dialog.open(DynamicFormsV2Component, {
            //  maxHeight: '90vh',
            //  maxWidth: '650px',
            //  autoFocus: false,
            //  data: {
            this.formMetaData = {
                 formName: 'Specimen Record ',
                 formDescription: "Use this form to record specimens for a specific lab test",
                 submitText: 'Submit Request',
               },
               this.formFields = [
                 {
                   generalProperties: {
   
                     fieldApiName: 'status',
                     fieldName: 'Status of Specimen',
                     fieldLabel: 'Status of Specimen',
                     value: 'Availabe',
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
   
                     fieldType: 'SingleCodeField',
                     isArray: false,
                     isGroup: false
                   },
                   data: "available | unavailable | unsatisfactory | entered-in-error".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
   
                 }, {
                   generalProperties: {
   
                     fieldApiName: 'type',
                     fieldName: 'Specimen Type',
                     fieldLabel: 'Specimen Type',
                     
                     fieldPlaceholder: "BLOOD, URINE, TISSUE etc",
                     moreHint: "The kind of specimen collected",
   
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
   
                     fieldType: 'CodeableConceptField',
                     isArray: false,
                     isGroup: false
                   },
                   data: g.type
   
                 },
                 //subject
                 {
                   generalProperties: {
                     fieldApiName: 'subject',
                     fieldName: 'Who Specimen is from',
                     fieldLabel: 'Who Specimen is from',
                     value:this.patientId?"Patient/"+this.patientId:"",
                     isHidden:this.patientId?true:false,
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
                     fieldType: 'IndividualReferenceField',
                     isArray: false,
                     isGroup: false
                   },
                   data: g.subject
                 },
                 {
   generalProperties: {
                     fieldApiName: 'request',
                     fieldName: 'Referenced Lab Test Request ',
                     fieldLabel: 'Referenced Lab Test Request ',
                     moreHint: "Lab request for which this specimen is intended",
                     value:this.serviceRequestId?"ServiceRequest/"+this.serviceRequestId:"",
                     isHidden:this.serviceRequestId?true:false,
   
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
                     fieldType: 'IndividualReferenceField',
                     isArray: false,
                     isGroup: false
                   },
                   data: this.patientId?g.patientSpecificRequest:g.request
                 },
                <IndividualField> {
                   generalProperties: {
   
                     fieldApiName: 'receivedTime',
                     fieldName: 'Received Time',
                     fieldLabel: 'Received Time',
                    fieldType: 'IndividualField',

                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
   
                     inputType: 'datetime-local',
                     isArray: false,
                     isGroup: false
                   },
   
   
                 },
                 //collection.collectedDateTime
   
                 //collection.collector
   
                 {
                   generalProperties: {
   
                     fieldApiName: 'condition',
                     fieldName: 'Specimen Condition',
                     fieldLabel: 'Specimen Condition',
   
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
   
   
                     fieldType: 'CodeableConceptField',
                     isArray: false,
                     isGroup: false
                   },
                   data: g.condition
   
   
                 },
                 {
                   generalProperties: {
   
                     fieldApiName: 'bodySite',
                     fieldName: 'Body Collection Site',
                     fieldLabel: 'Body Collection Site',
   
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
   
   
                     fieldType: 'CodeableConceptFieldFromBackEnd',
                     isArray: false,
                     isGroup: false
                   },
                   data: g.bodySite
   
   
                 },
                 <IndividualField>{
                   generalProperties: {
   
                     fieldApiName: 'note',
                     fieldName: 'Additional Notes',
                     fieldLabel: 'Additional Notes',
                     fieldType: 'IndividualField',
                     auth: {
                       read: 'all',
                       write: 'doctor, nurse'
                     },
                     inputType: 'textarea',
                     isArray: false,
                     isGroup: false
                   },
         
                 }
               ]
             
          
         },
         error: (err: any) => {
           this.errorService.openandCloseError("An error ocurred while fetching specimen data");
         }
       });
   


  }
  addMoreMedicineRequest() {

    if (this.formMetaData && this.formFields) {
      // this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];
      // Add another group mirroring current formFields
      this.items.push(this.buildItemGroup());
    }
  }

@ViewChild('cref') dynamicFormComponent!: DynamicFormsV2Component;
  processValues(values: any) {
    if (!values) return;
//type, status, subject and service requested are required
    if(
!values.type || !values.status || !values.subject || !values.request
    ){
      this.errorService.openandCloseError('Type, Status, Subject, and Service Requested fields are required.');
    
      return;
    }


    if (!this.isMultiple.value || this.isMultiple.value == 'Single') {
      if (this.dialogRef) {
        this.dialogRef.close({ values: values });
      }
    }
    //vallidationbefore `pushing
    
    this.items.push(this.buildItemGroup(values));
  }

  submitAllRequests() {
    const allValues = this.items.value;
    if (this.dialogRef) {
      this.dialogRef.close({ values: allValues });
    }
  }
}
