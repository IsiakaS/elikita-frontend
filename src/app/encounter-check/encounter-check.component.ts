import { Component, Inject, inject, Optional } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { formMetaData } from '../shared/dynamic-forms.interface2';
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
  selector: 'app-encounter-check',
  imports: [...commonImports,
    AddVitalsComponent, MatSelectModule, JsonPipe, MatDatepickerModule,
    MatStepperModule, MatSlideToggleModule, DynamicFormsV2Component,
    CommonModule, MatTooltipModule, SplitHashPipe, FormsModule, MatAutocompleteModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './encounter-check.component.html',
  styleUrl: './encounter-check.component.scss'
})
export class EncounterCheckComponent {
  fb = inject(FormBuilder);
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data) {
      console.log(data);
    }
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

  symptomsFormMetaData: formMetaData = {
    formName: 'Patient Complaints',
    formDescription: "Add one or many complaints as presented by the patient",
    submitText: 'Add',
    showSubmitButton: true,
    closeDialogOnSubmit: false,

  }

  encounterCheckList = [
    'I washed my hands',
    'I greeted the patient by name',
    'I verified the patient’s identity',
    'I have asked the patient to sit/lie down comfortably',
    'I observed the patient\'s gait',
    'I asked about any pain',
    'Female chaperone present (if applicable)',
    'I checked the patient\'s visit history'
  ]
  encounterVitals = {

  }
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

  checkListFormMeta: formMetaData = {
    formName: 'Encounter Check List',
    formDescription: 'Check and fill in the items that you have completed',
    submitText: 'Submit',
    showSubmitButton: false


  }
  checkListFormFields: FormFields[] = [
    <SingleCodeField>{
      generalProperties: {

        fieldApiName: 'appearance',
        fieldName: 'Patient Appearance',
        fieldLabel: 'Patient Appearance',

        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },


        fieldType: 'CodeField',
        isArray: false,
        isGroup: false
      },
      data: ['Well', 'Unwell', 'Pale', 'Flushed', 'Icteric',
        'Lethargic', 'Active', 'Agitated', 'Calm', 'Compliant', 'Combative'
      ]

    },
    //gait
    <SingleCodeField>{
      generalProperties: {
        fieldApiName: 'gait',
        fieldName: 'Gait',
        fieldLabel: 'Gait',
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
        fieldType: 'CodeField',
        isArray: false,
        isGroup: false
      },
      data: ['Walks Normally', 'Walks with Support', 'Walks with Limp', 'Unable to Walk']
    },
    //temperature o celcius
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'temperature',
        fieldName: 'Temperature',
        fieldLabel: 'Temperature (°C)',
        fieldType: 'IndividualField',
        inputType: 'number',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
    //blood pressure mmhg
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'bloodPressure',
        fieldName: 'Blood Pressure',
        fieldLabel: 'Blood Pressure (mmHg)',
        fieldType: 'IndividualField',
        inputType: 'text',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
    //pulse rate (bpm)
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'pulseRate',
        fieldName: 'Pulse Rate',
        fieldLabel: 'Pulse Rate (bpm)',
        fieldType: 'IndividualField',
        inputType: 'number',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
    // Respiratory rate (bpm)
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'respiratoryRate',
        fieldName: 'Respiratory Rate',
        fieldLabel: 'Respiratory Rate (bpm)',
        fieldType: 'IndividualField',
        inputType: 'number',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
    // oxygen saturation (SpO2)
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'oxygenSaturation',
        fieldName: 'Oxygen Saturation',
        fieldLabel: 'Oxygen Saturation (SpO2)',
        fieldType: 'IndividualField',
        inputType: 'number',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
    // height in cm

    // body mass index (BMI)
    // <IndividualField>{
    //   generalProperties: {
    //     fieldApiName: 'bmi',
    //     fieldName: 'Body Mass Index',
    //     fieldLabel: 'Body Mass Index (BMI)',
    //     fieldType: 'IndividualField',
    //     inputType: 'number',
    //     isArray: false,
    //     isGroup: false,
    //     auth: {
    //       read: 'all',
    //       write: 'doctor, nurse'
    //     },
    //   },
    //   data: null
    // }

  ]

  bmiFormMetaData: formMetaData = {
    formName: 'Body Mass Index (BMI) Form',
    formDescription: 'Fill in the height and weight to calculate BMI',
    submitText: 'Generate BMI',
    showSubmitButton: true,
    closeDialogOnSubmit: false
  }

  bmiFormFields: FormFields[] = [
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'height',
        fieldName: 'Height',
        fieldLabel: 'Height (cm)',
        fieldType: 'IndividualField',
        inputType: 'number',
        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
        prefixIcon: 'height',

      },
      data: null

    },
    // weight in kg
    <IndividualField>{
      generalProperties: {
        fieldApiName: 'weight',
        fieldName: 'Weight',
        fieldLabel: 'Weight (kg)',
        fieldType: 'IndividualField',
        inputType: 'number',
        prefixIcon: 'monitor_weight',

        isArray: false,
        isGroup: false,
        auth: {
          read: 'all',
          write: 'doctor, nurse'
        },
      },
      data: null
    },
  ]
  bmiFormSubmittedError: string | null = null;
  bmiFormSubmitted: any = (formData: any) => {
    this.bmiFormSubmittedError = null; // Reset error message
    console.log('BMI Form Submitted with data:', formData);
    this.patientBMI = undefined;
    this.patientBMICategory = undefined; // Reset BMI category
    const height = formData.height;
    const weight = formData.weight;
    if (height && weight) {
      const heightInMeters = height / 100; // Convert cm to meters
      const bmi = weight / (heightInMeters * heightInMeters);
      console.log('Calculated BMI:', bmi);
      this.patientBMI = parseFloat(bmi.toFixed(2)); // Round to 2 decimal places
      this.patientBMICategory = this.getBmiCategory(this.patientBMI);

    } else {
      console.error('Height and Weight are required to calculate BMI.');
      this.bmiFormSubmittedError = 'Height and Weight are required to calculate BMI.';
    }
  }

  bmiBands = [
    {
      bmiRange: [null, 16.0],
      category: "Severely underweight",
      color: "#8e24aa",
      icon: "report_problem"
    },
    {
      bmiRange: [16.0, 16.9],
      category: "Moderately underweight",
      color: "#9c27b0",
      icon: "error"
    },
    {
      bmiRange: [17.0, 18.4],
      category: "Mildly underweight",
      color: "#ce93d8",
      icon: "info_outline"
    },
    {
      bmiRange: [18.5, 24.9],
      category: "Normal (healthy weight)",
      color: "#4caf50",
      icon: "check_circle"
    },
    {
      bmiRange: [25.0, 29.9],
      category: "Overweight",
      color: "#ffca28",
      icon: "fastfood"
    },
    {
      bmiRange: [30.0, 34.9],
      category: "Obesity Class I (Moderate)",
      color: "#ff9800",
      icon: "warning"
    },
    {
      bmiRange: [35.0, 39.9],
      category: "Obesity Class II (Severe)",
      color: "#f44336",
      icon: "highlight_off"
    },
    {
      bmiRange: [40.0, null],
      category: "Obesity Class III (Very severe)",
      color: "#b71c1c",
      icon: "local_hospital"
    }
  ];
  getBmiCategory(bmi: number): { category: string, color: string, icon: string } | null {
    for (const band of this.bmiBands) {
      if ((band.bmiRange[0] === null || bmi >= band.bmiRange[0]) &&
        (band.bmiRange[1] === null || bmi < band.bmiRange[1])) {
        return { category: band.category, color: band.color, icon: band.icon };
      }
    }
    return null; // No matching category found
  }

  patientBMI?: number;
  encounterService = inject(EncounterServiceService);
  patientBMICategory?: { category: string, color: string, icon: string } | null;

  setEncounter() {
    this.encounterService.setEncounterState(this.encounterService.getPatientId(), 'in-progress');

  }
}
