import { CommonModule } from '@angular/common';
import { Component, inject, Optional, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, codeableConceptDataType, ReferenceDataType, codingDataType, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { ErrorService } from '../../shared/error.service';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ResourceDataReviewComponent } from '../../shared/resource-data-review/resource-data-review.component'; // added
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-add-lab-requests',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, DynamicFormsV2Component, ReactiveFormsModule, MatIconModule,
    MatButtonModule, ResourceDataReviewComponent /* added */
  ],
  templateUrl: './add-lab-requests.component.html',
  styleUrl: './add-lab-requests.component.scss'
})
export class AddLabRequestsComponent {
  //constructor with optional mat dialog
  http = inject(HttpClient);
  private fb = inject(FormBuilder);

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

  constructor(@Optional() public dialogRef: MatDialogRef<AddLabRequestsComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // alert(JSON.stringify(data));
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
    this.isMultiple.valueChanges.subscribe((e: boolean | null) => {
      if (e !== null) {
        this.isChosenOption = true;
      }
    })





    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'status'),
      intent: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'intent'),
      code: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'code'),
      performerType: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'performerType'),
      priority: this.formFieldsDataService.getFormFieldSelectData('serviceRequest', 'priority'),
    }).subscribe({
      next: (g: any) => {
        console.log(g.medication);



        this.formMetaData = <formMetaData>{
          // formName: 'Service Request (Lab Tests, e.t.c.)',
          // formDescription: "Use this form to order a lab test or any other medical services from your or other department",
          // submitText: 'Submit Request',

          formName: this.data && this.data.typeOfService ? `${this.data.typeOfService} Service Request` : 'Service Request (Lab Tests, e.t.c.)',
          formDescription: "Use this form to order a " + (this.data.typeOfService ? this.data.typeOfService : "lab test or any other") + " medical services from your department or others",
          submitText: ` ${this.isMultiple.value && this.isMultipleVa
            ? 'Add' : 'Submit'} ${this.data && this.data.typeOfService ? this.data.typeOfService : ""} Request`,

        }

        this.formFields = [
          {

            generalProperties: {

              fieldApiName: 'status',
              fieldName: 'Status of Request',
              fieldLabel: 'Status of Request',
              value: 'active',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: "draft | active | on-hold | revoked | completed | entered-in-error | unknown".split(' | ')

          },

          {

            generalProperties: {

              fieldApiName: 'intent',
              fieldName: 'Intent of the Request',
              fieldLabel: 'Intent of the Request',
              value: 'order',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: "proposal | plan | directive | order | original-order | reflex-order | filler-order | instance-order | option".split(' | ')

          },
          {

            generalProperties: {

              fieldApiName: 'code',
              fieldName: 'Service Requested',
              fieldLabel: 'Service Requested',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              allowedOthers: true,
              fieldType: 'CodeableConceptFieldFromBackEnd',
              isArray: false,
              isGroup: false
            },
            data: g.code
          },
          {

            generalProperties: {

              fieldApiName: 'performerType',
              fieldName: 'Pratitioner Required',
              fieldLabel: 'Practitioner Required',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.performerType
          },
          {

            generalProperties: {

              fieldApiName: 'priority',
              fieldName: 'Priority',
              fieldLabel: 'Priority',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: "routine | urgent | asap | stat".split(' | ')
          },
          {

            generalProperties: {

              fieldApiName: 'orderDetailParameterValueString',
              fieldName: 'Additional Details',
              fieldLabel: 'Additional Details',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              inputType: 'textarea',
              isArray: false,
              isGroup: false
            },
            data: g.priority
          },



        ]
        this.medicineForms.push({ formMetaData: this.formMetaData, formFields: [...this.formFields] });

        // Build the initial item in the FormArray once fields are available
        // this.items.push(this.buildItemGroup());
      },
      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');
      }
    })


  }
  addMoreMedicineRequest() {

    if (this.formMetaData && this.formFields) {
      // this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];
      // Add another group mirroring current formFields
      this.items.push(this.buildItemGroup());
    }
  }

  processValues(values: any) {
    if (!values) return;
    if (!this.isMultiple.value) {
      if (this.dialogRef) {
        this.dialogRef.close({ values: values });
      }
    }
    this.items.push(this.buildItemGroup(values));
  }
}
