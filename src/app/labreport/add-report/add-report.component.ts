import { Component, inject } from '@angular/core';
import { ErrorService } from '../../shared/error.service';
import { forkJoin } from 'rxjs';
import { CodeableConceptField, CodeableConceptFieldFromBackEnd, fieldType, FormFields, generalFieldsData, IndividualField, IndividualReferenceField, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { UtilityService } from '../../shared/utility.service';
import { commonImports } from '../../shared/table-interface';
import { MatStepperModule } from '@angular/material/stepper';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { ReferenceDisplayComponent } from "../../shared/reference-display/reference-display.component";
import { CodeableReferenceDisplayComponent } from "../../shared/codeable-reference-display/codeable-reference-display.component";
import { MatDialog } from '@angular/material/dialog';
import { TabledOptionComponent } from '../../tabled-option/tabled-option.component';

@Component({
  selector: 'app-add-report',
  imports: [...commonImports, MatStepperModule, DynamicFormsV2Component, ReferenceDisplayComponent, CodeableReferenceDisplayComponent],
  templateUrl: './add-report.component.html',
  styleUrl: './add-report.component.scss'
})
export class AddReportComponent {

  raiseTd(ev: HTMLElement) {
    const tdReference = ev;
    const tds = document.getElementsByClassName('each-reference');
    Array.from(tds).forEach((f: any) => {
      f.style.zIndex = '1';
    });
    ev.style.zIndex = '2';
  }
  formFieldService = inject(FormFieldsSelectDataService);
  errorService = inject(ErrorService);
  labReportForm?: Map<string, {
    [key: string]: any,
    formFields: FormFields[];
  }>

  rawObservation?: any;
  rawSpecimen?: any;
  observation?: any;
  specimen?: any;


  //  category: this.baseFunctionToRetrieveValueset,
  //     code: this.baseFunctionToRetrieveValueset,
  //     performer: this.baseFunctionToTurnPractitionerIntoReference,
  //     resultInterpreter:

  ngOnInit() {
    forkJoin({

      category: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'category'),

      code: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'code'),
      performer: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'performer'),
      resultsInterpreter: this.formFieldService.getFormFieldSelectData('diagnosticReport', "resultsInterpreter"),
      specimen: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'specimen'),
      observation: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'observation'),
      rawObservation: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'rawObservation'),
      rawSpecimen: this.formFieldService.getFormFieldSelectData('diagnosticReport', 'rawSpecimen')
    }).subscribe({
      next: (g: any) => {
        this.rawObservation = g.rawObservation;
        this.rawSpecimen = g.rawSpecimen;



        this.labReportForm = new Map([


          ['status', {
            formFields: [
              <SingleCodeField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'status',
                  fieldName: "Status",
                  fieldType: 'SingleCodeField',
                  inputType: 'text',
                  isArray: false,
                  isGroup: false,

                },
                data: 'registered | partial | preliminary | modified | final | amended | corrected | appended | cancelled | entered-in-error | unknown'.split(" | "),
              },
            ]
          }],





          [
            'category', {
              formFields: [
                <CodeableConceptField>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'category',
                    fieldName: "Lab Report Category",
                    fieldType: 'CodeableConceptField',
                    fieldHint: "Choose from suggested category or enter a new one",
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                  },
                  data: g.category,
                },
              ]
            }
          ],





          [
            'code',
            {
              formFields: [
                <CodeableConceptFieldFromBackEnd>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'code',
                    fieldName: "Lab Report Name",
                    fieldType: 'CodeableConceptFieldFromBackEnd',
                    fieldHint: "Choose from suggested names or enter your own",
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                  },
                  data: g.code,
                },
              ]
            }
          ],





          [
            'performer', {
              formFields: [
                <IndividualReferenceField>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'performer',
                    fieldName: "Performer",
                    fieldHint: "Who prepared this report",
                    fieldType: 'IndividualReferenceField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                  },
                  data: g.performer,
                },
              ]
            }
          ],





          [
            'resultsInterpreter', {
              formFields: [
                <IndividualReferenceField>{
                  generalProperties: <generalFieldsData>{
                    auth: {
                      read: 'all',
                      write: 'doctor, nurse'
                    },
                    fieldApiName: 'resultsInterpreter',
                    fieldName: "Result Interpreter",
                    fieldType: 'IndividualReferenceField',
                    inputType: 'text',
                    isArray: false,
                    isGroup: false,

                  },
                  data: g.resultsInterpreter,
                },
              ]
            }
          ],





          ['conclusion', {
            formFields: [
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'conclusion',
                  fieldName: "Lab Report",
                  fieldHint: "Actual Report",

                  fieldType: 'IndividualField',
                  inputType: 'textarea',
                  isArray: false,
                  isGroup: false,

                },
                data: '',
              },
            ]
          }],





          ['presentedForm', {
            formFields: [
              <IndividualField>{
                generalProperties: <generalFieldsData>{
                  auth: {
                    read: 'all',
                    write: 'doctor, nurse'
                  },
                  fieldApiName: 'attachment',
                  fieldName: "Attach Report Documents and Files",

                  fieldType: 'IndividualField',
                  inputType: 'photo_upload',
                  isArray: false,
                  isGroup: false,

                },
                data: '',
              },
            ]
          }],


        ])
        this.toPassLabForm = this.utilityService.convertFormFields(this.labReportForm);

      },
      error: (e: any) => {
        console.log(e);
        this.errorService.openandCloseError("An error ocurred while fetching data t be used in drop downs");
      }
    })
  }
  dialog = inject(MatDialog)

  addObservationReference() {
    this.dialog.open(TabledOptionComponent, {
      maxWidth: '900px',
      maxHeight: '93vh',
      data: {

        headerFilter: new Map<string, string[]>([

          ['status', ['active', 'completed', 'entered-in-error']],
          ['category', ['vital-signs', 'imaging', 'laboratory', 'procedure']],
        ]),
        columnMetaData: new Map([['code', {
          dataType: "CodeableConceptField",
          columnName: "Name"
        }],
        ['issued', {
          inputType: "datetime-local",

          columnName: "Date Issued"
        }],
        ['status', {
          dataType: "SingleCodeField",
          displayStyle: "chips",
          columnName: "Status"
        }],
        ['category', {
          dataType: "CodeableConceptField",

          columnName: "Category"
        }],
        ['valueString', {
          dataType: "IndividualField",
          displayStyle: "normal",
          columnName: "Value"
        }]


        ]) as Map<string, {
          dataType?: fieldType,
          displayStyle?: 'normal' | 'chips' | any,
          inputType?: any,
          columnName?: string
        }>,

        rawTableData: this.rawObservation,
        columns: ['issued', 'code', 'category', 'status', 'valueString'],
        isToBeSelected: true,
      }

    })
  }

  utilityService = inject(UtilityService);
  toPassLabForm?: FormFields[]
}
