import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of, sample } from 'rxjs';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, formMetaData, generalFieldsData, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../shared/form-fields-select-data.service';
import { ErrorService } from '../shared/error.service';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  dialog = inject(MatDialog);
  constructor() { }


  addOrganization() {
    forkJoin({
      sample: of('sample')
    }).subscribe((e: any) => {
      this.dialog.open(DynamicFormsV2Component, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        data: {
          formMetaData: <formMetaData>{
            formName: "Hospital Record",
            formDescription: "Record / Edit Internal Hospital Information",
            submitText: "Submit",

          },
          formFields: <FormFields[]>[<IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'type',
              fieldName: "Organization's Category",
              fieldType: 'IndividualField',
              fieldLabel: "Organization Category",
              fieldPlaceholder: "Healthcare Provider,	Insurance Company, Government",

              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

            },



          },

          <IndividualField>{
            generalProperties: {
              fieldApiName: "name",
              fieldName: "Name of Your Organization",
              fieldType: "IndividualField",
              fieldLabel: "Name of Your Organization",
              fieldPlaceholder: "Name of Your Organization",
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              }
            }


          },
          <IndividualField>{
            generalProperties: <generalFieldsData>{

              fieldApiName: "description",
              fieldName: "Description of Your Organization",
              fieldType: "IndividualField",
              fieldLabel: "Description of Your Organization",
              fieldPlaceholder: "Description of Your Organization",
              inputType: 'textarea',
              isArray: false,
              isGroup: false,
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              }
            },


          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'phone_telecom',
              fieldName: 'Phone Number',
              fieldLabel: 'Phone Number',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: false,
              isGroup: true,
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Phone Number ',
                  fieldLabel: 'Phone Number',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },


                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "phone",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "work",
                  isHidden: true,

                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'email_telecom',
              fieldName: 'Email',
              fieldLabel: 'Email',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: false,
              isGroup: true,
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Email ',
                  fieldLabel: 'Email',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "email",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: 'work',

                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'telecom',
              fieldName: 'Other Contacts',
              fieldLabel: 'Other Contacts',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },
            keys: ['value', 'system', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Contact ',
                  fieldLabel: 'Contact',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: 'work',

                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <GroupField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'qualification',
              fieldName: "Qualifications",
              fieldLabel: "Organization's Qualifications",
              isArray: true,
              isGroup: true
            },
            keys: ['code', 'issuer'],
            groupFields: {
              'code': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'qualification',
                  fieldName: "Qualifications",
                  fieldLabel: "Organization's Qualifications",
                  isArray: false,
                  isGroup: false,

                }

              },

              'issuer_name': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'issuer_name',
                  fieldName: "Name of the Issuer of the Qualification",
                  fieldLabel: "Name of the Issuer of the Qualification",
                  isArray: false,
                  isGroup: false,

                }

              },
              'issuer_website_link': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'issuer_website_link',
                  fieldName: "Website link of the Issuer of the Qualification",
                  fieldLabel: "Website link of the Issuer of the Qualification",
                  isArray: false,
                  isGroup: false,

                }

              },


            }
          }


          ]
        }
      })
    })

  }

  addServices() {

    forkJoin({
      sample: of('sample')
    }).subscribe((e: any) => {
      this.dialog.open(DynamicFormsV2Component, {
        maxHeight: '90vh',
        maxWidth: '900px',
        autoFocus: false,
        data: {
          formMetaData: <formMetaData>{
            formName: "Service",
            formDescription: "Add a healthcare service that appointees can request for when booking",
            submitText: "Add Services",

          },
          formFields: <FormFields[]>[<IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'active',
              fieldName: "Active?",
              fieldType: 'IndividualField',
              inputType: 'toggle',
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
              fieldApiName: 'service_category',
              fieldName: "Service Category",
              fieldType: 'IndividualField',
              fieldPlaceholder: "Paediatric, 	Community Health Care, Gynecology e.t.c. ",
              isArray: true,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

            },



          },
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'type',
              fieldName: "Subcategory / Area of Focus",
              fieldType: 'IndividualField',
              inputType: 'text',
              fieldPlaceholder: "	Paediatric Surgery, 	Immunization ",
              isArray: true,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
          // Additional fields can be here - A codeable reference field  -  Location of the service. To have this form, we must 
          //have another form for the Resource Type Location and the reference it from there
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'name',
              fieldName: "Name",
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
              fieldApiName: 'otherDetails',
              fieldName: "Service Description",
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
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'photo',
              fieldName: "Service's Illustration",
              fieldType: 'IndividualField',
              inputType: 'photo_upload',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'phone_telecom',
              fieldName: 'Phone Number',
              fieldLabel: 'Phone Number',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Phone Number ',
                  fieldLabel: 'Phone Number',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: 'work',
                  isHidden: true,
                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "phone",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'email_telecom',
              fieldName: 'Email',
              fieldLabel: 'Email',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true,
            },
            keys: ['value', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Email ',
                  fieldLabel: 'Email',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: "email",
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  value: 'work',
                  isHidden: true,
                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'telecom',
              fieldName: 'Other Contacts',
              fieldLabel: 'Other Contacts',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },
            keys: ['value', 'system', 'use'],
            groupFields: {
              'value': <IndividualField>{
                generalProperties: {
                  fieldApiName: 'value',


                  fieldName: 'Contact ',
                  fieldLabel: 'Contact',

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                }


              },
              'system': <CodeField>{
                generalProperties: {
                  fieldApiName: 'system',
                  fieldName: 'Contact Platform',
                  fieldLabel: 'Contact Platform',
                  fieldType: 'CodeField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },

              },
              'use': <CodeField>{
                generalProperties: {
                  fieldApiName: 'use',
                  fieldName: 'Contact Type',
                  fieldLabel: 'Contact Type',
                  fieldType: 'CodeField',
                  value: 'work',
                  isHidden: true,
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },

              },



            },
          },
          <IndividualField>{
            generalProperties: <generalFieldsData>{
              fieldApiName: 'appointmentRequired',
              fieldName: "Appointment Required?",
              fieldType: 'IndividualField',
              inputType: 'radio',
              isArray: false,
              isGroup: false,

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
            },
            data: ['Yes', 'No']
          },
          <GroupField>{

            generalProperties: {
              fieldApiName: 'availableTime',
              fieldName: 'Available Time ',
              fieldLabel: 'Available Time for This Service',
              fieldType: 'IndividualField',
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              isArray: true,
              isGroup: true
            },
            keys: ['daysOfWeek', 'availableStartTime', 'availableEndTime',],
            groupFields: {
              'daysOfWeek': <SingleCodeField>{
                generalProperties: {
                  fieldApiName: 'daysOfWeek',
                  fieldType: 'SingleCodeField',


                  fieldName: 'Days Of The Week ',
                  fieldLabel: 'Days of The Week',
                  inputType: 'checkbox',


                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false

                },

                data: ['Monday', 'Tue', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

              },
              'availableStartTime': <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'availableStartTime',
                  fieldName: "Start Time ",
                  fieldType: 'IndividualField',
                  inputType: 'time',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
              },
              'availableEndTime': <CodeField>{
                generalProperties: {
                  fieldApiName: 'availableEndTime',
                  fieldName: ' End Time',
                  fieldLabel: 'End Time',
                  fieldType: 'IndividualField',
                  inputType: 'time',


                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: false,
                  isGroup: false
                },

              },



            },
          },


          ]
        }
      })
    })

  }

  formFieldsDataService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService)
  addSlots() {
    forkJoin({
      sample: of('sample'),
      appointmentType: this.formFieldsDataService.getFormFieldSelectData('slot', 'appointmentType'),
      'serviceType': this.formFieldsDataService.getFormFieldSelectData('slot', 'serviceType'),
    }).subscribe({
      next: (g: any) => {
        this.dialog.open(DynamicFormsV2Component, {
          maxHeight: '90vh',
          maxWidth: '900px',
          autoFocus: false,
          data: {
            formMetaData: <formMetaData>{
              formName: "Appointment Slots",
              formDescription: "Add bookable slots for one or more registered healthcare services",
              submitText: "Add Slots",


            },
            formFields: <FormFields[]>[
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
              // a codeableconcept field of "specialty can be placed here "
              // - obtain values from a valueset url (a Preferred binding)

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

              //slot status will auomatically change when 
              // users starts boooking, so, this feld will be hidden
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'status',
                  fieldName: "Status",
                  fieldType: 'SingleCodeField',
                  isHidden: true,
                  isArray: false,
                  isGroup: false,
                  value: 'free',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
                data: ['busy', 'free', 'busy-unavailable', 'busy-tentative', 'entered-in-error']
              },
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  fieldApiName: 'canBeOveBooked',
                  fieldName: "Can Slot Be Overbooked",
                  fieldType: 'IndividualField',
                  inputType: 'toggle',
                  isArray: false,
                  isGroup: false,

                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                },
              },
              <GroupField>{

                generalProperties: {
                  fieldApiName: 'availableTime',
                  fieldName: 'Available Time ',
                  fieldLabel: 'Available Time for This Service',
                  fieldType: 'IndividualField',
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },

                  isArray: true,
                  isGroup: true
                },
                keys: ['daysOfWeek', 'availableStartTime', 'availableEndTime',],
                groupFields: {
                  'daysOfWeek': <SingleCodeField>{
                    generalProperties: {
                      fieldApiName: 'daysOfWeek',

                      fieldType: 'SingleCodeField',
                      fieldName: 'Days Of The Week ',
                      fieldLabel: 'Days of The Week',
                      inputType: 'checkbox',


                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },

                      isArray: false,
                      isGroup: false

                    },

                    data: ['Monday', 'Tue', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

                  },
                  'availableStartTime': <IndividualField>{
                    generalProperties: <generalFieldsData>{
                      fieldApiName: 'availableStartTime',
                      fieldName: "Start Time ",
                      fieldLabel: "Start Time",
                      fieldType: 'IndividualField',
                      inputType: 'time',
                      isArray: false,
                      isGroup: false,

                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },
                    },
                  },
                  'availableEndTime': <CodeField>{
                    generalProperties: {
                      fieldApiName: 'availableEndTime',
                      fieldName: ' End Time',
                      fieldLabel: 'End Time',
                      fieldType: 'IndividualField',
                      inputType: 'time',


                      auth: {
                        read: 'all',
                        write: 'doctor, nurse'
                      },

                      isArray: false,
                      isGroup: false
                    },

                  },



                },
              },
            ]
          }
        })
      },
      error: (err) => {
        this.errorService.openandCloseError("An error ocurred while preparing forms for slots")
      }



    })

  }
}
