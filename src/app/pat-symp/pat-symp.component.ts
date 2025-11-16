import { Component, Inject, inject, Input, Optional } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CodeableConceptFieldFromBackEnd, formMetaData, generalFieldsData } from '../shared/dynamic-forms.interface2';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { CodeableConceptField, CodeField, codingDataType, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SplitHashPipe } from '../shared/split-hash.pipe';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
import { MatSelectModule } from '@angular/material/select';
import { FormArray, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { map, Observable, of, startWith } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-pat-symp',
  imports: [...commonImports,
    AddVitalsComponent, MatSelectModule, JsonPipe, MatDatepickerModule,
    MatStepperModule, MatSlideToggleModule, DynamicFormsV2Component,
    CommonModule, MatTooltipModule, SplitHashPipe, FormsModule, MatAutocompleteModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './pat-symp.component.html',
  styleUrls: ['../encounter-check/encounter-check.component.scss', './pat-symp.component.scss']
})
export class PatSympComponent {
  @Input() forClerkingSheet = false;
  @Input() initialSymptoms?: Array<{
    clinicalStatus?: string,
    verificationStatus?: string,
    severity?: string,
    onsetDateTime?: string,
    symptom?: { code?: string, system?: string, display?: string }
  }>;
  fb = inject(FormBuilder);
  sampleDummyEncounterReasonFormWithValues: any[];
  ngOnInit() {
    if (this.initialSymptoms && this.initialSymptoms.length) {
      for (const s of this.initialSymptoms) {
        const p = {
          clinicalStatus: s.clinicalStatus || '',
          verificationStatus: s.verificationStatus || '',
          onsetDateTime: s.onsetDateTime || '',
          severity: s.severity || '',
          symptom: {
            code: s.symptom?.code || '',
            display: s.symptom?.display || '',
            system: s.symptom?.system || ''
          }
        } as any;
        this.patientPresentedSymptoms.push(p);
        this.addToSymptomsArray(p);
      }
    } else if (this.forClerkingSheet) {
      for (const pSymp of this.sampleDummyEncounterReasonFormWithValues) {
        this.patientPresentedSymptoms.push(pSymp);
        this.addToSymptomsArray(pSymp);
      }
    }
  }

  addSymptomOnDialog() {
    //  <app-dynamic-forms-v2 [formFields]="data!.formFieldsToUse.reason" (formSubmitted)="populateSymptoms($event)"
    //     [formMetaData]="symptomsFormMetaData">

    // </app-dynamic-forms-v2>
    this.symptomsFormMetaData.closeDialogOnSubmit = true;
    const dref = this.dialog.open(DynamicFormsV2Component, {
      data: {
        formFields: this.data!.formFieldsToUse.reason,
        formMetaData: this.symptomsFormMetaData
      }
    });

    dref.afterClosed().subscribe(result => {
      if (result) {
        this.populateSymptoms(result);
      }
    });
  }

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data && data.formFieldsToUse && data.formFieldsToUse.reason) {
      console.log(data);
    } else {
      this.data = {
        formFieldsToUse: {
          reason: <FormFields[]>[<CodeableConceptFieldFromBackEnd>{
            generalProperties: {
              fieldApiName: 'reason',
              fieldName: 'Patient Symptom',
              fieldLabel: 'Patient Symptom',
              fieldType: "CodeableConceptFieldFromBackEnd",
              isArray: false,
              isGroup: false
            },
            data: ['https://tx.fhir.org/r5/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/encounter-reason&_format=json']
          },
          <SingleCodeField>{
            generalProperties: <generalFieldsData>{
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldApiName: 'clinicalStatus',
              fieldName: "Clinical Status",
              fieldType: 'SingleCodeField',
              inputType: 'text',
              fieldLabel: "Whether the symptom is still active",
              fieldPlaceholder: "Whether the symptom is still active",
              value: 'Active',
              isArray: false,
              isGroup: false,

            },
            data: "active | recurrence | relapse | inactive | remission | resolved | unknown".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
          },
          <SingleCodeField>{
            generalProperties: <generalFieldsData>{
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldApiName: 'verificationStatus',
              fieldName: "Verification Status",
              fieldType: 'SingleCodeField',
              inputType: 'text',
              fieldLabel: "Is the Symptom Confirmed",
              fieldPlaceholder: "Is the Symptom Confirmed",
              isArray: false,
              isGroup: false,
              value: 'Confirmed'
            },
            data: "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split('|').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
          },
          //severity
          <SingleCodeField>{
            generalProperties: <generalFieldsData>{
              auth
                : {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldApiName: 'severity',
              fieldName: "Severity",
              fieldType: 'SingleCodeField',
              inputType: 'text',
              isArray: false,
              isGroup: false,
            },
            data: "mild | moderate | severe".split(' | ').map((e: string) => e.trim().slice(0, 1).toUpperCase() + e.trim().slice(1))
          },

















          <IndividualField>{
            generalProperties: <generalFieldsData>{
              auth: {
                read: 'all',
                write: 'doctor, nurse'
              },
              fieldApiName: 'onsetDateTime',
              fieldName: "Onset Date/Time",
              fieldLabel: "When the symptom started",
              fieldPlaceholder: "When the symptom started",
              fieldType: 'IndividualField',
              inputType: 'datetime-local',
              isArray: false,
              isGroup: false,
            },
            data: ""
          }
            // 'encounter_use': <CodeableConceptField>{
            //   generalProperties: {
            //     fieldApiName: 'encounter_reason_use',
            //     fieldName: 'Reason\'s Type',
            //     fieldLabel: 'Reason\'s Type',
            //     fieldType: 'CodeableConceptField',
            //     isArray: false,
            //     isGroup: false
            //   },
            //   data: {
            //     coding: g.reason_use.concept
            //   }
            // }
            // }




            // }

          ]

        }
      }
    }
    this.sampleDummyEncounterReasonFormWithValues = [
      {
        severity: ['mild'],
        clinicalStatus: ['active'],
        verificationStatus: ['confirmed'],
        onsetDateTime: [''],
        symptom: {
          code: ['headache'],
          system: ['headache'],
          display: ['headache']
        }
      },
      {
        severity: ['severe'],
        clinicalStatus: ['active'],
        verificationStatus: ['confirmed'],
        onsetDateTime: [''],
        symptom: {
          code: ['fever'],
          system: ['fever'],
          display: ['fever']
        }
      },
      {
        severity: ['severe'],
        clinicalStatus: ['active'],
        verificationStatus: ['confirmed'],
        onsetDateTime: [''],
        symptom: {
          code: ['cold'],
          system: ['cold'],
          display: ['cold']
        }
      },
      {
        severity: ['severe'],
        clinicalStatus: ['active'],
        verificationStatus: ['confirmed'],
        onsetDateTime: [''],
        symptom: {
          code: [''],
          system: ['stomach ache'],
          display: ['stomach ache']
        }
      },
      {
        severity: ['severe'],
        clinicalStatus: ['active'],
        verificationStatus: ['confirmed'],
        onsetDateTime: [''],
        symptom: {
          code: ['back pain'],
          system: ['back pain'],
          display: ['back pain']
        }
      }

    ]



    this.encounterReasonForm = this.fb.group({
      symptoms: this.fb.array([
        this.fb.group({
          severity: [''],
          clinicalStatus: [''],
          verificationStatus: [''],
          onsetDateTime: [''],
          code: this.fb.group({
            code: [''],
            system: [''],
            display: ['']
          })
        })
      ])

    })
  }
  matAutocompletei = { clinicalStatus: <Observable<any>[]>[], verificationStatus: <Observable<any>[]>[], severity: <Observable<any>[]>[], };

  get symptoms() {
    return this.encounterReasonForm.get(['symptoms']) as FormArray;
  }
  addToSymptomsArray(e: {
    clinicalStatus: string,
    verificationStatus: String,
    severity: string,
    onsetDateTime: string,
    symptom: {
      code: string,
      system: string,
      display: string
    }
    [key: string]: any
  }) {
    console.log(!this.symptoms.controls[0].get('code.display')?.value)
    if (!this.symptoms.controls[0].get('code.display')?.value) { } else {
      this.symptoms.push(this.fb.group({
        severity: [''],
        clinicalStatus: [''],
        onsetDateTime: [''],
        verificationStatus: [''],
        code: this.fb.group({
          code: [''],
          system: [''],
          display: ['']
        })
      }))
    }
    this.symptoms.controls[this.symptoms.controls.length - 1].patchValue({
      clinicalStatus: e.clinicalStatus,
      verificationStatus: e.verificationStatus,
      onsetDateTime: e.onsetDateTime,
      severity: e.severity,

    });

    this.matAutocompletei['clinicalStatus'][this.symptoms.controls.length - 1] = this.symptoms.controls[this.symptoms.controls.length - 1].get(['clinicalStatus'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        return this.symptomClinicalStatusSelectData.filter((f: any) => {
          return this.symptomClinicalStatusSelectData.includes(e);
        })
      })
    )
    this.matAutocompletei['verificationStatus'][this.symptoms.controls.length - 1] = this.symptoms.controls[this.symptoms.controls.length - 1]!.get(['verificationStatus'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        return this.symptomVerificationStatusSelectData.filter((f: any) => {
          return this.symptomVerificationStatusSelectData.includes(e);
        })
      })
    )
    this.matAutocompletei['severity'][this.symptoms.controls.length - 1] = this.symptoms.controls[this.symptoms.controls.length - 1]!.get(['severity'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        return this.symptomSeveritySelectData.filter((f: any) => {
          return this.symptomSeveritySelectData.includes(e);
        })
      })
    )

    this.symptoms.controls[this.symptoms.controls.length - 1]?.get(['clinicalStatus'])?.setValue(e.clinicalStatus)
    this.symptoms.controls[this.symptoms.controls.length - 1].get(['code'])?.patchValue({
      code: e.symptom.code,
      display: e.symptom.display,
      system: e.symptom.system
    })
    this.encounterReasonForm.updateValueAndValidity();
    this.symptoms.updateValueAndValidity();
  }

  removeFromSymptomsArray(index: number) {
    this.symptoms.removeAt(index)
  }
  encounterReasonForm: FormGroup;
  dialog = inject(MatDialog);


  patientPresentedSymptoms: {

    clinicalStatus: string,
    verificationStatus: String,
    severity: string,
    onsetDateTime: string,
    symptom: {
      code: string,
      system: string,
      display: string
    }
    [key: string]: any
  }[] = [];
  populateSymptoms(values: any) {
    if (values.reason) {

      const pSymp: {
        clinicalStatus: string,
        verificationStatus: String,
        severity: string,
        onsetDateTime: string,
        symptom: {
          code: string,
          system: string,
          display: string
        }
      } = <{
        clinicalStatus: string,
        verificationStatus: String,
        severity: string,
        onsetDateTime: string,
        symptom: {
          code: string,
          system: string,
          display: string
        }
      }>{ symptom: {} }
      if (values.reason?.split("$#$")?.length > 1) {
        let reasonArr = values.reason.split("$#$")

        pSymp.symptom.code = reasonArr[0];
        pSymp.symptom.display = reasonArr[1];
        pSymp.symptom.system = reasonArr[2] || '';
      } else {
        pSymp.symptom.code = values.reason,
          pSymp.symptom.display = values.reason,
          pSymp.symptom.system = values.reason
      }

      pSymp.clinicalStatus = values.clinicalStatus ?? ''
      pSymp.verificationStatus = values.verificationStatus ?? ''
      pSymp.onsetDateTime = values.onsetDateTime ?? ''
      pSymp.severity = values.severity ?? ''

      this.patientPresentedSymptoms.push(pSymp);


      this.addToSymptomsArray(pSymp);


    }

  }

  symptomSeveritySelectData = "Active | Recurrence | Relapse | Inactive | Remission | Resolved | unknown".split(" | ");
  symptomClinicalStatusSelectData = "active | recurrence | relapse | inactive | remission | resolved | unknown".split(" | ");
  symptomVerificationStatusSelectData = "unconfirmed | provisional | differential | confirmed | refuted | entered-in-error".split(" | ");


  removeSymptom(symptom: any) {

    const symptomIndex = this.patientPresentedSymptoms.findIndex((e: any) => {
      return Object.values(e.symptom).join("$#$") == symptom;
    })
    if (symptomIndex > -1) {
      this.patientPresentedSymptoms.splice(symptomIndex, 1);
    }
    // if (this.patientPresentedSymptoms.includes(symptom)) {
    //   const index = this.patientPresentedSymptoms.indexOf(symptom);
    //   if (index > -1) {
    //     this.patientPresentedSymptoms.splice(index, 1);
    //   }
    // }
  }

  symptomsFormMetaData: formMetaData = {
    formName: 'Patient Complaints',
    formDescription: "Add one or many complaints as presented by the patient",
    submitText: 'Add',
    showSubmitButton: true,
    closeDialogOnSubmit: false,

  }
}
