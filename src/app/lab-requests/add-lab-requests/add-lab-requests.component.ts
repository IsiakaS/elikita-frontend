import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-add-lab-requests',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule, DynamicFormsV2Component, ReactiveFormsModule, MatIconModule,
    MatButtonModule
  ],
  templateUrl: './add-lab-requests.component.html',
  styleUrl: './add-lab-requests.component.scss'
})
export class AddLabRequestsComponent {
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
          formName: 'Service Request (Lab Tests, e.t.c.)',
          formDescription: "Use this form to order a lab test or any other medical services from your or other department",
          submitText: 'Submit Request',
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

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.status

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

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.intent

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
            data: g.priority
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

      },
      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');
      }
    })


  }
  addMoreMedicineRequest() {
    if (this.formMetaData && this.formFields) {
      this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];

    }
  }
}
