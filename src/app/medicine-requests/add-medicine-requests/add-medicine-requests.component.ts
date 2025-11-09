import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { forkJoin } from 'rxjs';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../../shared/dynamic-forms.interface2';
import { ErrorService } from '../../shared/error.service';
import { FormControl } from '@angular/forms';
import { commonImports } from '../../shared/table-interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';



type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-add-medicine-requests',
  imports: [...commonImports, CommonModule, MatSelectModule, DynamicFormsV2Component],
  templateUrl: './add-medicine-requests.component.html',
  styleUrl: './add-medicine-requests.component.scss'
})
export class AddMedicineRequestsComponent {
  errorService = inject(ErrorService)
  dialog = inject(MatDialog);
  formFieldsDataService = inject(FormFieldsSelectDataService)

  isChosenOption = false;
  isMultiple = new FormControl(null);
  formMetaData?: formMetaData;
  formFields?: FormFields[];

  medicineForms: { formFields: FormFields[], formMetaData: formMetaData }[] = [

  ]



  ngOnInit() {
    this.isMultiple.valueChanges.subscribe((e: boolean | null) => {
      if (e !== null) {
        this.isChosenOption = true;
      }
    })
    forkJoin({
      medication: this.formFieldsDataService.getFormFieldSelectData('medication', 'medication'),
      status: this.formFieldsDataService.getFormFieldSelectData('medication', 'status'),
      intent: this.formFieldsDataService.getFormFieldSelectData('medication', 'intent'),
      performerType: this.formFieldsDataService.getFormFieldSelectData('medication', 'performerType'),
      reason: this.formFieldsDataService.getFormFieldSelectData('medication', 'reason'),
    }).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        // const dRef = this.dialog.open(DynamicFormsV2Component, {
        //   maxHeight: 'calc(90vh - 40px)',
        //   maxWidth: '860px',
        //   autoFocus: false,
        //   data: {

        this.formMetaData = <formMetaData>{
          formName: 'Medication Request / Prescription',
          formDescription: "Use this form to record a medication request or prescription for the patient.",
          submitText: 'Submit Prescription',
        };
        this.formFields = <FormFields[]>[
          {

            generalProperties: {

              fieldApiName: 'status',
              fieldName: 'Status of Medication',
              fieldLabel: 'Status of Medication',
              value: 'active',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: g.status

          },
          {

            generalProperties: {

              fieldApiName: 'intent',
              fieldName: 'Intent of Medication',
              fieldLabel: 'Intent of Medication',
              value: 'order',
              moreHint: "Do you intend that this medication should be ordered right away or is just a proposal",
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: g.intent

          },
          {
            generalProperties: {

              fieldApiName: 'medication',
              fieldName: 'Medication / Drug',
              fieldLabel: 'Medication / Drug',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },


              moreHint: "Search and choose a medication from the list",


              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.medication

          },
          {
            generalProperties: {

              fieldApiName: 'performerType',
              fieldName: 'Medication Administered By',
              fieldLabel: 'Medication Administered By',
              moreHint: "Who should administer the medication to the patient",
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

              fieldApiName: 'reason',
              fieldName: 'Reason for Medication',
              fieldLabel: 'Reason for Medication',


              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldType: 'CodeableConceptFieldFromBackEnd',




              isArray: false,
              isGroup: false
            },
            data: g.reason

          },
          {
            generalProperties: {

              fieldApiName: 'dosageInstruction',
              fieldName: 'Dosage Instruction',
              fieldLabel: 'Dosage Instruction',

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              inputType: "textarea",



              isArray: false,
              isGroup: false
            },
            data: g.performerType

          },


        ]

        this.medicineForms.push({ formMetaData: this.formMetaData, formFields: [...this.formFields] });

      },




      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');




      }
    }
    )
  }
  addMoreMedicineRequest() {
    if (this.formMetaData && this.formFields) {
      this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];
    }
  }

}

