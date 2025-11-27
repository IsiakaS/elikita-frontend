import { Component, Inject, inject, Optional } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../../shared/dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../../shared/dynamic-forms.interface2';
import { ErrorService } from '../../shared/error.service';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { commonImports } from '../../shared/table-interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { backendEndPointToken } from '../../app.config';
import { HttpClient } from '@angular/common/http';
import { ResourceDataReviewComponent } from '../../shared/resource-data-review/resource-data-review.component';
import { StateService } from '../../shared/state.service';
import { LoaderComponent } from '../../loader/loader.component';



type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-add-medicine-requests',
  imports: [...commonImports, CommonModule,
    ResourceDataReviewComponent,
    MatSelectModule, DynamicFormsV2Component],
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

  constructor(
    public loadingRef: MatDialogRef<LoaderComponent>,
    @Optional() public dialogRef: MatDialogRef<AddMedicineRequestsComponent>,
    @Inject(backendEndPointToken) public backendEndPoint: string) { }
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

  removeRequest(index: number) {
    this.items.removeAt(index);
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
  stateService = inject(StateService);
  // loadingRef = MatDialogRef<LoaderComponent>
  // constructor() {}
  // loadingRef2 = this.dialog.open(LoaderComponent);

  ngOnInit() {

    this.formMetaData = <formMetaData>{
      formName: 'Medication Request / Prescription',
      formDescription: "Use this form to record a medication request or prescription for the patient.",
      submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
        ? 'Add' : 'Submit'}  Medication Request`,

    };


    this.isMultiple.valueChanges.subscribe((e: boolean | null) => {
      if (e !== null) {
        this.isChosenOption = true;
      }
      this.formMetaData = <formMetaData>{
        formName: 'Medication Request / Prescription',
        formDescription: "Use this form to record a medication request or prescription for the patient.",
        submitText: ` ${this.isMultiple.value && this.isMultiple.value == 'Multiple'
          ? 'Add' : 'Submit'}  Medication Request`,

      };
    })
    forkJoin({
      medication: this.formFieldsDataService.getFormFieldSelectData('medication', 'medication').pipe(
        timeout(5000),
        catchError(err => {
          // this.loadingRef2.close();
          console.error('Error fetching medication data:', err);
          return of(['Others']);
        })
      ),
      status: this.formFieldsDataService.getFormFieldSelectData('medication', 'status'),
      intent: this.formFieldsDataService.getFormFieldSelectData('medication', 'intent'),
      performerType: this.formFieldsDataService.getFormFieldSelectData('medication', 'performerType'),
      reason: this.formFieldsDataService.getFormFieldSelectData('medication', 'reason'),
      CondInStock: this.http.get<any>(`${this.backendEndPoint}/Condition?patient=${this.stateService.currentEncounter.getValue()?.patientId}&_count=200`),
      MedInStock: this.http.get<any>(`${this.backendEndPoint}/Medication?_count=1000`)

    }).subscribe({
      next: (g: any) => {
        console.log(g.medication);

        // const dRef = this.dialog.open(DynamicFormsV2Component, {
        //   maxHeight: 'calc(90vh - 40px)',
        //   maxWidth: '860px',
        //   autoFocus: false,
        //   data: {


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

              fieldApiName: 'priority',
              fieldName: 'Priority ',
              fieldLabel: 'Priority ',

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              fieldType: 'SingleCodeField',
              isArray: false,
              isGroup: false
            },
            data: "routine | urgent | asap | stat".split(" | ")

          },
          {
            generalProperties: {

              fieldApiName: 'medicationCodeableConcept',
              fieldName: 'Medicine Not In Stock',
              fieldLabel: 'Medicine Not In Stock',

              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },

              allowedOthers: true,
              moreHint: "Search and choose a medication not in Pharmacy stock",
              fieldHint: "If the medicine is not in Pharmacy stock, select here",


              fieldType: 'CodeableConceptFieldFromBackEnd',
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
              allowedOthers: true,

              fieldType: 'CodeableConceptField',
              isArray: false,
              isGroup: false
            },
            data: g.performerType

          },
          {
            generalProperties: {

              fieldApiName: 'reasonCode',
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

        if (g.CondInStock && g.CondInStock.entry && g.CondInStock.entry.length > 0
          && g.CondInStock.entry.some((e: any) => e.resource.asserter?.reference !== `Patient/${this.stateService.currentEncounter.getValue()?.patientId}
          && (e.resource.code?.text || e.resource.code?.coding?.[0]?.display) &&
          e.encounter?.reference === Encounter/${this.stateService.currentEncounter.getValue()?.['id']}
          `)

        ) {
          // if (res.entry && res.entry.length > 0) {
          this.formFields?.splice(4, 0, {

            generalProperties: {
              fieldApiName: 'reasonReference',
              fieldName: 'Medication Reason from Patient Conditions',
              fieldLabel: 'Medication Reason from Patient Conditions',
              moreHint: "Select reason for the medication from patient's existing conditions",
              fieldHint: "If the reason for medication is from patient's existing conditions, select here",
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldType: 'IndividualReferenceField',
              isArray: true,
              isGroup: false
            },
            data: g.CondInStock.entry.filter((e: any) => e.resource.asserter?.reference !== `Patient/${this.stateService.currentEncounter.getValue()?.patientId}`)
              .map((e: any) => { return { reference: e.resource.id, display: e.resource.code?.text || e.resource.code?.coding?.[0]?.display || "unknown diagnosis" } })
          });


        }

        if (g.MedInStock && g.MedInStock.entry && g.MedInStock.entry.length > 0) {
          // if (res.entry && res.entry.length > 0) {
          {
            console.log('MedInStock', g.MedInStock);
            // if (res.entry && res.entry.length > 0) {
            this.formFields?.splice(3, 0, {

              generalProperties: {
                fieldApiName: 'medicationReference',
                fieldName: 'Medication from Stock',
                fieldLabel: 'Medication from Stock',
                moreHint: "Select medication from Pharmacy stock",
                fieldHint: "If the medicine is available in Pharmacy stock, select here",
                auth: {
                  read: 'all',
                  write: 'doctor, nurse'
                },
                fieldType: 'IndividualReferenceField',
                isArray: false,
                isGroup: false
              },
              data: g.MedInStock.entry.map((e: any) => { return { reference: 'Medication/' + e.resource.id, display: e.resource.code?.text || e.resource.code?.coding?.[0]?.display } })
            });


          }

        }




      },

      // this.medicineForms.push({ formMetaData: this.formMetaData, formFields: [...this.formFields] });





      error: (err: any) => {
        console.error('Error fetching medication data:', err);
        this.errorService.openandCloseError('Error fetching medication data. Please try again later.');




      }
    }
    )

    // //check if the org has medicine in stock and add medicineref foeld
    // this.http.get<any>(`${this.backendEndPoint}/Medication`).subscribe({
    //   next: (res:any) => {
    //     if (res.entry && res.entry.length > 0) {
    //       this.formFields?.push({

    //         generalProperties: {
    //           fieldApiName: 'medicationReference',
    //           fieldName: 'Medication from Stock',
    //           fieldLabel: 'Medication from Stock',
    //           moreHint: "Select medication from facility stock",
    //           auth: {
    //             read: 'all',
    //             write: 'doctor, nurse'
    //           },
    //           fieldType: 'IndividualReferenceField',
    //           isArray: false,
    //           isGroup: false
    //         },
    //         data: res.entry.map((e: any) => { return { reference: e.resource.id, display: e.resource.code?.text || e.resource.code?.coding?.[0]?.display}})
    //       });


    //     }}})

    //     //check if th org has a condition for this patient and add reason reference field
    // this.http.get<any>(`${this.backendEndPoint}/Condition`).subscribe({
    //   next: (res:any) => {
    //     if (res.entry && res.entry.length > 0) {
    //       this.formFields?.push({
    //         generalProperties: {
    //           fieldApiName: 'reasonReference',
    //           fieldName: 'Medication Reason from Patient Conditions',
    //           fieldLabel: 'Medication Reason from Patient Conditions',
    //           moreHint: "Select reason for the medication from patient's existing conditions",
    //           auth: {
    //             read: 'all',
    //             write: 'doctor, nurse'
    //           },
    //           fieldType: 'IndividualReferenceField',
    //           isArray: true,
    //           isGroup: false
    //         },
    //         data: res.entry.map((e: any) => { return { reference: `Condition/${e.resource.id}`, display: e.resource.code?.text || e.resource.code?.coding?.[0]?.display}})
    //       });
    //     }}})


  }
  addMoreMedicineRequest() {
    if (this.formMetaData && this.formFields) {
      this.medicineForms = [...this.medicineForms, { formMetaData: this.formMetaData, formFields: [...this.formFields] }];
    }
  }

  processValues(values: any) {
    if (!values) return;

    if (!(values.medicationReference || values.medicationCodeableConcept) ||
      values.intent == '' || !values.intent ||
      values.status == '' || !values.status

    ) {
      this.errorService.openandCloseError('Status, Intent and Medication fields are required.');

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

