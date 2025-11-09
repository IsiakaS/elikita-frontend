import { Component, inject } from '@angular/core';
import { ErrorService } from '../shared/error.service';
import { CodeableConceptField, CodeableConceptFieldFromBackEnd, CodeField, formMetaData, generalFieldsData, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray } from '../shared/dynamic-forms.interface2';
import { forkJoin } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MatTabsModule } from '@angular/material/tabs';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-make-appointments',
  imports: [MatTabsModule, DynamicFormsV2Component, MatChipsModule,
    MatCardModule, MatDatepickerModule, MatButtonModule],
  templateUrl: './make-appointments.component.html',
  styleUrl: './make-appointments.component.scss',
  providers: [provideNativeDateAdapter()]
})
export class MakeAppointmentsComponent {
  dialog = inject(MatDialog)
  formFieldsDataService = inject(FormFieldsSelectDataService)
  errorService = inject(ErrorService);
  designatedRegForm: any;
  designatedFormFields: any;
  selected: any;
  ngOnInit() {
    forkJoin({
      status: this.formFieldsDataService.getFormFieldSelectData('appointment', 'status'),
      participantActor: this.formFieldsDataService.getFormFieldSelectData('appointment', 'participantActor'),
      appointmentType: this.formFieldsDataService.getFormFieldSelectData('appointment', 'appointmentType'),
      serviceType: this.formFieldsDataService.getFormFieldSelectData('appointment', 'serviceType'),
      reason: this.formFieldsDataService.getFormFieldSelectData('appointment', 'reason'),
      slot: this.formFieldsDataService.getFormFieldSelectData('appointment', 'slot'),
    }).subscribe({
      next: (g: any) => {


        this.designatedRegForm = <formMetaData>{
          formName: "Appointment Booking Form ",
          formDescription: "Book an Appoinment with the Hospital",
          submitText: "Next",

        },
          this.designatedFormFields = <FormFields[]>[
            <GroupField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'serviceTypeGroup',
                fieldName: "Type of Service",
                fieldType: 'IndividualField',
                inputType: 'text',
                isArray: true,
                isGroup: true,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              keys: ['serviceType', 'serviceType2'],
              groupFields: {
                'serviceType': <IndividualReferenceField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'serviceType',
                    fieldName: "Type of Service",
                    fieldType: 'IndividualReferenceField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    controllingField: [{
                      isAControlField: true,
                      dependentFieldVisibilityTriggerValue: 'Others',
                      controlledFieldDependencyId: 'serviceTypeGroup.serviceType2'

                    }],

                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: g.serviceType
                },

                'serviceType2': <IndividualField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'serviceType2',
                    fieldLabel: "Enter a type of healthcare service",
                    fieldName: "Other Type of Service",
                    fieldType: 'IndividualField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    dependence_id: "serviceTypeGroup.serviceType2",
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                },


              }
            },
            <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'description',
                fieldName: "Subject",
                fieldLabel: "Subject of the appointment",
                fieldType: 'IndividualField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },

            <IndividualField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'note',
                fieldName: "Other details",
                fieldLabel: "More details for booking",
                fieldType: 'IndividualField',
                inputType: 'textarea',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
            },
            <IndividualReferenceField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'participantActor',
                fieldName: "Practitioner",
                fieldLabel: "Select a doctor, nurse or pharmacy",
                fieldType: 'IndividualReferenceField',
                inputType: 'text',
                isArray: false,
                isGroup: false,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              data: g.participantActor

            },

            <GroupField>{
              generalProperties: <generalFieldsData>{
                fieldApiName: 'appointmentTypeGroup',
                fieldName: "Type of Appointment",
                fieldType: 'IndividualField',
                inputType: 'text',
                isArray: false,
                isGroup: true,

                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
              },
              keys: ['appointmentType', 'appointmentType2'],
              groupFields: {
                'appointmentType': <CodeableConceptField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'appointmentType',
                    fieldName: "Type of Appointment",
                    fieldType: 'CodeableConceptField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    controllingField: [{
                      isAControlField: true,
                      dependentFieldVisibilityTriggerValue: 'Others',
                      controlledFieldDependencyId: 'appointmentTypeGroup.appointmentType2'

                    }],
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },
                  data: g.appointmentType
                },
                'appointmentType2': <IndividualField>{
                  generalProperties: <generalFieldsData>{
                    fieldApiName: 'appointmentType2',
                    fieldName: "Other type of Appointment",
                    fieldLabel: "Enter a type of Appointment",
                    fieldType: 'CodeableConceptField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,
                    dependence_id: 'appointmentTypeGroup.appointmentType2',
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                  },

                  data: [
                    `OutPatient Appointment$#$OutPatient$#$https://sampleOrgCode`,
                    `Community Health Program Appointment$#$Community Health$#$https://sampleOrgCode`,
                  ]
                },

              }
            },

            // <CodeableConceptFieldFromBackEnd>{
            //   generalProperties: <generalFieldsData>{
            //     fieldApiName: 'reason',
            //     fieldName: "Reason for Appointment",
            //     fieldType: 'CodeableConceptFieldFromBackEnd',
            //     inputType: 'text',
            //     isArray: false,
            //     isGroup: false,

            //     auth: {
            //       read: 'all',
            //       write: 'doctor, nurse'
            //     },
            //   },

            //   data: g.reason
            // },




          ]


      },

      error: (err) => {
        this.errorService.openandCloseError("An error ocurred while preparing appointment form")
      }




    })
  }
}
