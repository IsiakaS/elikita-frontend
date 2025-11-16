import { Component, Inject, inject, Optional, ViewChild } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { formMetaData } from '../shared/dynamic-forms.interface2';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CodeableConceptField, CodeField, codingDataType, GroupField, IndividualField, IndividualReferenceField, ReferenceFieldArray, SingleCodeField } from '../shared/dynamic-forms.interface2';
import { CommonModule, JsonPipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SplitHashPipe } from '../shared/split-hash.pipe';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
// (already imported above) DynamicFormsV2Component
import { MatSelectModule } from '@angular/material/select';
import { FormArray, FormBuilder, FormGroup, FormsModule, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { map, Observable, of, startWith } from 'rxjs';
import { AuthService } from '../shared/auth/auth.service';
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
  authService = inject(AuthService);
  @ViewChild(AddVitalsComponent) addVitalsComp?: AddVitalsComponent;
  @ViewChild('detailsDF') detailsDF?: DynamicFormsV2Component;
  @ViewChild('notesDF') notesDF?: DynamicFormsV2Component;
  @ViewChild('actorsDF') actorsDF?: DynamicFormsV2Component;
  @ViewChild('reasonDF') reasonDF?: DynamicFormsV2Component; // patient reported symptom entry form
  vitalsLatest: any;
  // Optional dialogRef indicates we're running inside a MatDialog
  dialogRef = inject(MatDialogRef<EncounterCheckComponent>, { optional: true });
  // Use inject() for dialog data to avoid constructor param decorators issues
  data = inject(MAT_DIALOG_DATA, { optional: true }) as any;
  constructor() {
    if (this.data) {
      console.log(this.data);
    }
    // Initialize required vitals from dialog data or defaults
    this.requiredVitals = Array.isArray(this.data?.requiredVitals) && this.data.requiredVitals.length
      ? this.data.requiredVitals
      : ['temperature', 'pulseRate', 'respiratoryRate', 'bloodPressure', 'oxygenSaturation'];
    this.encounterReasonForm = this.fb.group({
      symptoms: this.fb.array([]

      )

    })
  }
  // Checklist values tracking
  checkListControls: FormArray<FormControl<boolean>> = this.fb.array<FormControl<boolean>>([]);
  firstStepGroup!: FormGroup;
  ngOnInit() {
    // initialize checklist controls to match items length
    this.encounterCheckList.forEach(() => this.checkListControls.push(this.fb.control(false) as FormControl<boolean>));
    // group to drive linear stepper validity
    this.firstStepGroup = this.fb.group({
      checklist: this.checkListControls
    }, { validators: [this.allTrueArrayValidator('checklist')] });
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

    let index = this.symptoms.controls.length - 1;
    // this.symptoms.controls[index].get(['clinicalStatus'])!.valueChanges.subscribe(e => alert(e));
    this.matAutocompletei['clinicalStatus'][index] = this.symptoms.controls[index].get(['clinicalStatus'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        // alert(e + "");
        return this.symptomClinicalStatusSelectData.filter((f: any) => {
          return String(f)?.toLowerCase().includes(String(e)?.toLowerCase());
        })
      })
    );

    this.matAutocompletei['verificationStatus'][index] = this.symptoms.controls[index]!.get(['verificationStatus'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        return this.symptomVerificationStatusSelectData.filter((f: any) => {
          return String(f)?.toLowerCase().includes(String(e)?.toLowerCase());
        })
      })
    );

    this.matAutocompletei['severity'][index] = this.symptoms.controls[index]!.get(['severity'])!.valueChanges.pipe(
      startWith(""),
      map((e: any) => {
        return this.symptomSeveritySelectData.filter((f: any) => {
          return String(f)?.toLowerCase().includes(String(e)?.toLowerCase());
        })
      })
    );


    this.symptoms.controls[this.symptoms.controls.length - 1].patchValue({
      clinicalStatus: e.clinicalStatus,
      verificationStatus: e.verificationStatus,
      onsetDateTime: e.onsetDateTime,
      severity: e.severity,

    });



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
    // 'I greeted the patient by name',
    // 'I verified the patient’s identity',
    // 'I have asked the patient to sit/lie down comfortably',
    // 'I observed the patient\'s gait',
    // 'I asked about any pain',
    // 'Female chaperone present (if applicable)',
    // 'I checked the patient\'s visit history'
  ]
  encounterVitals = {

  }
  // Configurable list of vitals that must be present before proceeding from Patient Details step
  requiredVitals: string[] = [];

  // Return list of missing required vitals based on latest values from AddVitalsComponent
  getMissingRequiredVitals(): string[] {
    const v = this.vitalsLatest || {};
    return (this.requiredVitals || []).filter((k) => {
      const val = v?.[k];
      // consider non-empty string/number and truthy values as filled; allow 0 for numeric
      if (val === 0) return false;
      return val === undefined || val === null || String(val).trim() === '';
    });
  }

  hasRequiredVitals(): boolean {
    return this.getMissingRequiredVitals().length === 0;
  }

  // Determine if user typed a symptom but never clicked the Add button
  private hasUnaddedSymptomDraft(): boolean {
    const reasonForm = this.reasonDF?.aForm?.value || {};
    const rawReason = reasonForm?.reason;
    // If there's a non-empty reason field but nothing captured in patientPresentedSymptoms
    return !!rawReason && String(rawReason).trim() !== '' && (this.patientPresentedSymptoms.length === 0);
  }

  // Ensure at least one symptom with a code/display exists in the symptoms FormArray
  public hasAtLeastOneSymptomSelected(): boolean {
    // Prefer the maintained list if present
    if (this.patientPresentedSymptoms && this.patientPresentedSymptoms.length > 0) return true;
    const fa = this.encounterReasonForm?.get('symptoms');
    if (!fa || typeof (fa as any).controls === 'undefined') return false;
    const arr = (fa as any).controls as any[];
    return arr.some(ctrl => {
      const codeGroup = ctrl?.get ? ctrl.get('code') : null;
      const codeVal = codeGroup?.get('code')?.value || codeGroup?.get('display')?.value;
      return !!(codeVal && String(codeVal).trim() !== '');
    });
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
      this.data!.formFieldsToUse.reason = [...this.data!.formFieldsToUse.reason];

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
      // keep FormArray in sync with displayed list
      if (this.symptoms && this.symptoms.length > symptomIndex) {
        this.symptoms.removeAt(symptomIndex);
      }
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
    // Optionally validate checklist completion
    // if (!this.areAllChecklistTrue()) {
    //   // You can surface a message here if strict completion is required
    // }

    // Guard: enforce required vitals
    // if (!this.hasRequiredVitals()) {
    //   const missing = this.getMissingRequiredVitals();
    //   this.encounterService.errorService.openandCloseError(`Please complete required vitals: ${missing.join(', ')}`);
    //   return;
    // }

    // Guard: ensure vitals format is valid (e.g., blood pressure 120/80)
    // if (this.addVitalsComp?.vitalsFormGroup?.invalid) {
    //   const bpCtrl = this.addVitalsComp?.vitalsFormGroup?.get('bloodPressure');
    //   const hasBpFormatError = !!bpCtrl?.errors?.['bloodPressureFormat'];
    //   const msg = hasBpFormatError
    //     ? 'Blood Pressure must be in the format systolic/diastolic (e.g., 120/80).'
    //     : 'Please correct the vitals form before proceeding.';
    //   this.encounterService.errorService.openandCloseError(msg);
    //   return;
    // }

    // Guard: enforce encounter details required fields via dynamic form validity
    if (this.detailsDF?.aForm?.invalid) {
      this.encounterService.errorService.openandCloseError('Please complete Encounter Type and Urgency.');
      return;
    }

    // Guard: ensure user clicked "Add" for entered symptom
    if (this.hasUnaddedSymptomDraft()) {
      this.encounterService.errorService.openandCloseError('You entered a symptom but did not press the Add button. Please press "Add" to include it or clear the field.');
      // return;
    }

    // Guard: ensure at least one symptom is present
    if (!this.hasAtLeastOneSymptomSelected()) {
      this.encounterService.errorService.openandCloseError('Please add at least one patient symptom before submitting.');
      return;
    }

    // Close dialog and signal to caller that encounter was initiated
    const details = this.detailsDF?.aForm?.value || {};
    // alert(JSON.stringify(details) || details || 'no details')
    const notes = this.notesDF?.aForm?.value || {};
    const actors = this.actorsDF?.aForm?.value || {};
    // Ensure the logged-in user is included as a participant (format: { ref, display })
    try {
      const authUser: any = this.authService?.user?.getValue?.();
      const userId: string | undefined = authUser?.['userId'] || authUser?.['id'];
      const userDisplay: string | undefined = authUser?.['display'] || authUser?.['fullName'] || authUser?.['name'] || authUser?.['email'];
      const userRef = userId ? `Practitioner/${userId}` : undefined;
      alert(userRef);
      if (userRef) {

        const participantsRaw = (actors as any)?.participant;
        // alert(participantsRaw);
        let participants: any[] = Array.isArray(participantsRaw)
          ? participantsRaw
          : (participantsRaw ? [participantsRaw] : []);

        const alreadyPresent = participants.some((q: any) => {
          let p = q.individual
          const ref = (p && (p.ref || p.reference)) || (typeof p === 'string' ? p.split('$#$')[0] : undefined);
          // ignore fragment
          // alert(ref);
          return ref === userRef;
        });

        if (!alreadyPresent) {
          participants.push({ reference: userRef, display: userDisplay });

        }
        const participantsKey = ['reference', 'display'];
        participants = participants.map((p: any) => {
          const toObj = (v: any) => {
            if (!v) return {};
            if (typeof v === 'string') {
              const [reference, display] = String(v).split('$#$');
              return { reference, display };
            }
            return {
              reference: v.reference ?? v.ref ?? (typeof v === 'string' ? String(v).split('$#$')[0] : undefined),
              display: v.display ?? v.name ?? v.text ?? (typeof v === 'string' ? String(v).split('$#$')[1] : undefined),
            };
          };
          const src = p?.individual !== undefined ? p.individual : p;
          return { individual: toObj(src) };
        });
        (actors as any).participant = participants;
      }
    } catch { /* non-blocking */ }




    this.dialogRef?.close({
      encounterInitiated: true,
      checklist: this.checkListControls.getRawValue(),
      vitals: this.vitalsLatest,
      details,
      notes,
      actors,
      symptomsForm: this.encounterReasonForm.getRawValue(),
      presentedSymptoms: this.patientPresentedSymptoms
    });

  }

  // Compute: are all checklist items toggled on?
  areAllChecklistTrue(): boolean {
    return this.checkListControls?.controls?.every((c: any) => !!c.value) ?? false;
  }

  // Validator: ensure all items in the given FormArray are true
  private allTrueArrayValidator(arrayKey: string): ValidatorFn {
    return (group: AbstractControl) => {
      const arr = (group.get(arrayKey) as FormArray<FormControl<boolean>>);
      if (!arr) return null;
      const allTrue = arr.controls.every(c => !!c.value);
      return allTrue ? null : { notAllTrue: true };
    };
  }

  // Determine if there are unsaved changes
  private hasUnsavedChanges(): boolean {
    const anyChecklist = (this.checkListControls?.value || []).some((v: boolean) => !!v);
    const anySymptoms = (this.patientPresentedSymptoms || []).length > 0;
    const formDirty = this.encounterReasonForm?.dirty;
    return Boolean(anyChecklist || anySymptoms || formDirty);
  }

  // Ask user to confirm before closing dialog
  closeWithConfirm() {
    const proceed = confirm('Unsubmitted values would not be saved if you close this dialog. Do you want to close?');
    if (proceed) {
      this.dialogRef?.close({ encounterInitiated: false, checklist: this.checkListControls.getRawValue() });
    }
  }
}
