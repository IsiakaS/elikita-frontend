import { booleanAttribute, ChangeDetectorRef, Component, Inject, inject, Input, Optional, Output, EventEmitter } from '@angular/core';
import { Form, FormBuilder, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { FormFields, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { commonImports } from '../../shared/table-interface';
import { EncounterServiceService } from '../../patient-wrapper/encounter-service.service';
import { ErrorService } from '../../shared/error.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, tap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { StateService } from '../../shared/state.service';
import { backendEndPointToken } from '../../app.config';
import { AuthService } from '../../shared/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-add-vitals',
  imports: [...commonImports,
    CommonModule, MatTooltipModule, MatSelectModule,

    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,],
  templateUrl: './add-vitals.component.html',
  styleUrl: './add-vitals.component.scss'
})
export class AddVitalsComponent {
  @Input() vitalsComponents?: any[];
  @Input() isAllComponent?: boolean;
  @Input() showButton: boolean = true;
  @Input() initialValues?: any;

  // Widened default BP range; used when bpRange is null
  private readonly BP_RANGE_DEFAULT = {
    sys: { min: 60, max: 260 },
    dia: { min: 30, max: 180 }
  };

  // Allow overriding BP range; default to null to use BP_RANGE_DEFAULT
  @Input() bpRange: { sys: { min: number; max: number }, dia: { min: number; max: number } } | null = null;

  hospitalVitalFields = [
    ['appearance', {
      formFields: <FormFields[]>[
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
            'Lethargic', 'Active', 'Agitated', 'Calm', 'Compliant', 'Combative']
        }
      ],
    }],
    ['gait', {
      formFields: <FormFields[]>[{
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
      }]
    }
    ],
    ['temperature', {
      formFields: <FormFields[]>[{
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
      }]
    }],
    [
      'bloodPressure', {
        formFields: <FormFields[]>[{
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
        }]
      }],
    ['pulseRate', {
      formFields: <FormFields[]>[{
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
      }
      ]
    }],
    ['respiratoryRate', {
      formFields: <FormFields[]>[{
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
      }]
    }],
    ['oxygenSaturation', {
      formFields: <FormFields[]>[{
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
      }]
    }],
    [
      'height', {
        formFields: <FormFields[]>[{
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
          },
          data: null
        }]
      }
    ],
    ['weight', {
      formFields: <FormFields[]>[{
        generalProperties: {
          fieldApiName: 'weight',
          fieldName: 'Weight',
          fieldLabel: 'Weight (kg)',
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
      }]
    }]
  ];
  @Input() dummySamples: boolean = false;
  @Output() vitalsChanged = new EventEmitter<any>();
  fb = inject(FormBuilder)
  ngAfterViewInit() {
    // some dummy samples
    //fr appearance - ['Well', 'Unwell', 'Pale', 'Flushed', 'Icteric',
    //       'Lethargic', 'Active', 'Agitated', 'Calm', 'Compliant', 'Combative']
    if (this.dummySamples) {
      this.vitalsFormGroup.patchValue({
        'gait': 'Walks Normally',
        height: '170',
        weight: '70',
        appearance: 'Well',
        temperature: '36.6',
        bloodPressure: '120/80',
        pulseRate: '72',
        respiratoryRate: '16',
        oxygenSaturation: '98',
      });
    }
  }
  vitalsFormGroup = this.fb.group({
    'gait': '',
    height: "",
    weight: "",
    appearance: "",
    'temperature': '',
    'bloodPressure': '',
    'pulseRate': '',
    'respiratoryRate': '',
    'oxygenSaturation': '',

    'bmi': ''

  })

  errorService = inject(ErrorService)
  bmiFormSubmitted: any = (height: number, weight: number) => {

    this.patientBMI = undefined;
    this.patientBMICategory = undefined; // Reset BMI category

    if (height && weight) {
      const heightInMeters = height / 100; // Convert cm to meters
      const bmi = weight / (heightInMeters * heightInMeters);
      console.log('Calculated BMI:', bmi);
      this.patientBMI = parseFloat(bmi.toFixed(2)); // Round to 2 decimal places
      this.patientBMICategory = this.getBmiCategory(this.patientBMI);

    } else {
      console.error('Height and Weight are required to calculate BMI.');
      this.errorService.openandCloseError('Height and Weight are required to calculate BMI.');
    }
  }
  bmi: number | null = null;
  bmiBands = [
    // {
    //   bmiRange: [null, 16.0],
    //   category: "Severely underweight",
    //   color: "#8e24aa",
    //   icon: "report_problem"
    // },
    // {
    //   bmiRange: [16.0, 16.9],
    //   category: "Moderately underweight",
    //   color: "#9c27b0",
    //   icon: "error"
    // },
    {
      bmiRange: [null, 18.4],
      category: "Underweight",
      // color: "#ce93d8",
      // icon: "info_outline"
      color: "#8e24aa",
      icon: "report_problem"
    },
    {
      bmiRange: [18.5, 24.9],
      category: "Normal (healthy weight)",
      color: "#4caf50",
      icon: "check_circle"
    },
    {
      bmiRange: [25.0, null],
      category: "Overweight",
      color: "#b71c1c",
      icon: "local_hospital"
      // color: "#ffca28",
      // icon: "fastfood"
    },
    // {
    //   bmiRange: [30.0, 34.9],
    //   category: "Obesity Class I (Moderate)",
    //   color: "#ff9800",
    //   icon: "warning"
    // },
    // {
    //   bmiRange: [35.0, 39.9],
    //   category: "Obesity Class II (Severe)",
    //   color: "#f44336",
    //   icon: "highlight_off"
    // },
    // {
    //   bmiRange: [40.0, null],
    //   category: "Obesity Class III (Very severe)",
    //   color: "#b71c1c",
    //   icon: "local_hospital"
    // }
  ];
  bloodPressureSlash = false;
  cd: ChangeDetectorRef = inject(ChangeDetectorRef);
  isBloodPressureValid(value: string): boolean {
    // Check if the value is in the format "systolic/diastolic"
    const regex = /^\d{1,3}\/\d{1,3}$/;
    // alert("hey");
    console.log("isBloodPressureValid called with value:", value, regex.test(value));
    // this.cd.detectChanges();
    return regex.test(value);

  }
  // Group-level validator to ensure bloodPressure, when provided, matches Systolic/Diastolic (e.g., 120/80)
  private bloodPressureGroupValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const ctrl = group.get?.('bloodPressure');
    const raw = ctrl?.value;
    if (!raw) {
      if (ctrl && ctrl.errors) {
        const { bloodPressureFormat, bloodPressureRange, ...rest } = ctrl.errors;
        ctrl.setErrors(Object.keys(rest).length ? rest : null);
      }
      return null;
    }
    const str = String(raw).trim();
    const formatOk = /^\d{1,3}\/\d{1,3}$/.test(str);
    if (!formatOk) {
      const next = { ...(ctrl?.errors || {}), bloodPressureFormat: true };
      ctrl?.setErrors(next);
      return { bloodPressureFormat: true };
    }
    const [sysStr, diaStr] = str.split('/');
    const sys = Number(sysStr);
    const dia = Number(diaStr);

    // Use configurable or default range
    const range = this.bpRange ?? this.BP_RANGE_DEFAULT;
    const rangeOk = sys >= range.sys.min && sys <= range.sys.max && dia >= range.dia.min && dia <= range.dia.max;

    if (!rangeOk) {
      const next = { ...(ctrl?.errors || {}), bloodPressureRange: true };
      ctrl?.setErrors(next);
      return { bloodPressureRange: true };
    }
    // clear old errors for bp
    if (ctrl && ctrl.errors) {
      const { bloodPressureFormat, bloodPressureRange, ...rest } = ctrl.errors;
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };

  // Require Height and Weight as a pair (if either is provided, both must be present and > 0 numbers)
  private heightWeightPairValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const hCtrl = group.get?.('height') as any;
    const wCtrl = group.get?.('weight') as any;
    const h = hCtrl?.value;
    const w = wCtrl?.value;

    const hasH = h !== null && h !== '';
    const hasW = w !== null && w !== '';

    // helpers
    const addErr = (ctrl: AbstractControl | null | undefined, key: string) => {
      if (!ctrl) return;
      ctrl.setErrors({ ...(ctrl.errors || {}), [key]: true });
    };
    const clearErrKeys = (ctrl: AbstractControl | null | undefined, keys: string[]) => {
      if (!ctrl || !ctrl.errors) return;
      const rest = { ...ctrl.errors };
      for (const k of keys) delete (rest as any)[k];
      ctrl.setErrors(Object.keys(rest).length ? rest : null);
    };

    // start by clearing our specific errors
    clearErrKeys(hCtrl, ['requirePair', 'heightInvalid']);
    clearErrKeys(wCtrl, ['requirePair', 'weightInvalid']);

    let anyError = false;

    // if one provided, require the other
    if (hasH && !hasW) { addErr(wCtrl, 'requirePair'); anyError = true; }
    if (hasW && !hasH) { addErr(hCtrl, 'requirePair'); anyError = true; }

    // numeric and positive checks
    if (hasH && (isNaN(Number(h)) || Number(h) <= 0)) { addErr(hCtrl, 'heightInvalid'); anyError = true; }
    if (hasW && (isNaN(Number(w)) || Number(w) <= 0)) { addErr(wCtrl, 'weightInvalid'); anyError = true; }

    return anyError ? { heightWeightPair: true } : null;
  };

  patientBloodPressureCategory?: { category: string, color: string, icon: string } | null;
  getBloodPressureCategory(value: string): { category: string, color: string, icon: string } | null {
    if (!value || !this.isBloodPressureValid(value)) {
      return null; // Return null if the value is invalid
    }
    const [systolic, diastolic] = value.split('/').map(Number);
    console.log("systolic:", systolic, "diastolic:", diastolic);
    if (systolic < 90 || diastolic < 60) {
      this.patientBloodPressureCategory = { category: 'Low Blood Pressure', color: '#2196F3', icon: 'low_priority' };
      return { category: 'Low Blood Pressure', color: '#2196F3', icon: 'low_priority' };
    }
    if (systolic < 120 && diastolic < 80) {
      this.patientBloodPressureCategory = { category: 'Normal Blood Pressure', color: '#4CAF50', icon: 'check_circle' };
      return { category: 'Normal Blood Pressure', color: '#4CAF50', icon: 'check_circle' };
    }
    if ((systolic >= 120 && systolic < 130) && diastolic < 80) {
      this.patientBloodPressureCategory = { category: 'Elevated Blood Pressure', color: '#FF9800', icon: 'warning' };
      return { category: 'Elevated Blood Pressure', color: '#FF9800', icon: 'warning' };
    } else if ((systolic >= 130 && systolic < 140) || (diastolic >= 80 && diastolic < 90)) {
      this.patientBloodPressureCategory = { category: 'Hypertension Stage 1', color: '#FF5722', icon: 'report_problem' };
      return { category: 'Hypertension Stage 1', color: '#FF5722', icon: 'report_problem' };
    } else {
      this.patientBloodPressureCategory = { category: 'Hypertension Stage 2', color: '#F44336', icon: 'error' };
      return { category: 'Hypertension Stage 2', color: '#F44336', icon: 'error' };
    }
  }
  ngOnInit() {
    // attach validator for blood pressure format + height/weight pair
    this.vitalsFormGroup.setValidators([this.bloodPressureGroupValidator, this.heightWeightPairValidator]);
    this.vitalsFormGroup.updateValueAndValidity({ emitEvent: false });
    // Prefill values when provided
    if (this.initialValues) {
      try {
        this.vitalsFormGroup.patchValue(this.initialValues, { emitEvent: true });
        // attempt to compute BMI if height/weight provided
        const height = Number(this.vitalsFormGroup.get('height')?.value);
        const weight = Number(this.vitalsFormGroup.get('weight')?.value);
        if (height && weight) {
          const hM = height / 100;
          const bmi = weight / (hM * hM);
          (this as any).patientBMI = bmi;
        }
      } catch { /* noop */ }
    }
    // bubble form values upward when they change
    this.vitalsFormGroup.valueChanges.subscribe(v => this.vitalsChanged.emit(v));

    this.vitalsFormGroup.get('bloodPressure')!.valueChanges.subscribe(value => {
      if (value?.toString().includes("/")) {
        this.bloodPressureSlash = true;
      }

      if (value && value.toString().length < 3) {
        this.bloodPressureSlash = false;
      }

      if (value?.toString().length == 3 && !value.includes("/") && !this.bloodPressureSlash) {
        this.vitalsFormGroup.get('bloodPressure')!.setValue(value + '/');
      }

      if (value && this.isBloodPressureValid(value)) {
        //calculate systolic and diastolic values
        this.getBloodPressureCategory(value);

      }
      // if (value && !/^\d{1,3}\/\d{1,3}$/.test(value)) {
      //   this.errorService.openandCloseError('Blood Pressure must be in the format "systolic/diastolic" (e.g., 120/80)');
      //   this.vitalsFormGroup.get('bloodPressure')!.setValue('');  
      // }
    });

    combineLatest([
      this.vitalsFormGroup.get('height')!.valueChanges,
      this.vitalsFormGroup.get('weight')!.valueChanges
    ]).pipe(
      tap(([height, weight]) => {
        if (height && weight) {
          this.bmiFormSubmitted(height, weight);
        } else {
          this.patientBMI = undefined;
          this.patientBMICategory = null; // Reset BMI category
        }
      })
    ).subscribe();

  }
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

  // Use property injection to avoid constructor decorator parsing issues
  dialogData = inject(MAT_DIALOG_DATA, { optional: true }) as any;
  constructor() {
    if (!this.vitalsComponents && this.dialogData && this.dialogData.vitalsComponents) {
      this.vitalsComponents = this.dialogData.vitalsComponents;
    }
  }

  // Build FHIR R4 Observation resources for recorded vitals
  buildFhirObservations(patientId: string, encounterId?: string, performerRef?: string, effectiveDateTime?: string): any[] {
    const v = this.vitalsFormGroup.getRawValue();
    const subject = { reference: `Patient/${patientId}` };
    const effective = effectiveDateTime || new Date().toISOString();
    const categoryVital = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }], text: 'Vital Signs' }];
    const categoryExam = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'exam', display: 'Exam' }], text: 'Exam' }];
    const appearanceMap: Record<string, { code: string; display: string }> = {
      'well': { code: '102876003', display: 'Well' },
      'unwell': { code: '271838008', display: 'Unwell' },
      'pale': { code: '271807003', display: 'Pallor' },
      'flushed': { code: '248196009', display: 'Flushed face' },
      'icteric': { code: '267036007', display: 'Jaundice' },
      'lethargic': { code: '248279007', display: 'Lethargic' },
      'active': { code: '224960004', display: 'Active' },
      'agitated': { code: '271794005', display: 'Agitated' },
      'calm': { code: '272151009', display: 'Calm' },
      'compliant': { code: '105480006', display: 'Cooperative' },
      'combative': { code: '271795006', display: 'Aggressive behaviour' }
    };
    const gaitMap: Record<string, { code: string; display: string }> = {
      'walks normally': { code: '248263006', display: 'Normal gait' },
      'walks with support': { code: '282301002', display: 'Gait difficulty' },
      'walks with limp': { code: '282300003', display: 'Antalgic gait' },
      'unable to walk': { code: '282310008', display: 'Unable to walk' }
    };

    const obs: any[] = [];

    // Temperature (LOINC 8310-5) valueQuantity Cel
    if (v.temperature) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '8310-5', display: 'Body temperature' }], text: 'Body temperature' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.temperature), unit: '°C', system: 'http://unitsofmeasure.org', code: 'Cel' }
      });
    }

    // Heart rate / Pulse (LOINC 8867-4) valueQuantity /min
    if (v.pulseRate) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.pulseRate), unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' }
      });
    }

    // Respiratory rate (LOINC 9279-1) valueQuantity /min
    if (v.respiratoryRate) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '9279-1', display: 'Respiratory rate' }], text: 'Respiratory rate' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.respiratoryRate), unit: '/min', system: 'http://unitsofmeasure.org', code: '/min' }
      });
    }

    // SpO2 (LOINC 59408-5) valueQuantity %
    if (v.oxygenSaturation) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '59408-5', display: 'Oxygen saturation in Arterial blood by Pulse oximetry' }], text: 'SpO2' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.oxygenSaturation), unit: '%', system: 'http://unitsofmeasure.org', code: '%' }
      });
    }

    // Height (LOINC 8302-2) valueQuantity cm
    if (v.height) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '8302-2', display: 'Body height' }], text: 'Height' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.height), unit: 'cm', system: 'http://unitsofmeasure.org', code: 'cm' }
      });
    }

    // Weight (LOINC 29463-7) valueQuantity kg
    if (v.weight) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Weight' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(v.weight), unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' }
      });
    }

    // BMI (LOINC 39156-5) valueQuantity kg/m2
    if (this.patientBMI != null) {
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '39156-5', display: 'Body mass index (BMI) [Ratio]' }], text: 'BMI' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueQuantity: { value: Number(this.patientBMI), unit: 'kg/m2', system: 'http://unitsofmeasure.org', code: 'kg/m2' }
      });
    }

    // Blood Pressure panel (LOINC 85354-9) with components
    if (v.bloodPressure && this.isBloodPressureValid(v.bloodPressure)) {
      const [sys, dia] = (v.bloodPressure as string).split('/').map(n => Number(n));
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryVital,
        code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel with all children optional' }], text: 'Blood Pressure' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        component: [
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
            valueQuantity: { value: sys, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          },
          {
            code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
            valueQuantity: { value: dia, unit: 'mmHg', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
          }
        ]
      });
    }

    // Appearance and Gait as exam category, valueCodeableConcept uses SNOMED CT when known
    if (v.appearance) {
      const raw = String(v.appearance).trim();
      const key = raw.toLowerCase();
      const mapped = appearanceMap[key];
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryExam,
        code: { text: 'Appearance' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueCodeableConcept: mapped
          ? { coding: [{ system: 'http://snomed.info/sct', code: mapped.code, display: mapped.display }], text: mapped.display }
          : { text: raw }
      });
    }
    if (v.gait) {
      const raw = String(v.gait).trim();
      const key = raw.toLowerCase();
      const mapped = gaitMap[key];
      obs.push({
        resourceType: 'Observation',
        status: 'final',
        category: categoryExam,
        code: { text: 'Gait' },
        subject,
        effectiveDateTime: effective,
        ...(encounterId ? { encounter: { reference: `Encounter/${encounterId}` } } : {}),
        ...(performerRef ? { performer: [{ reference: performerRef }] } : {}),
        valueCodeableConcept: mapped
          ? { coding: [{ system: 'http://snomed.info/sct', code: mapped.code, display: mapped.display }], text: mapped.display }
          : { text: raw }
      });
    }

    return obs;
  }

  private http = inject(HttpClient);
  private stateService = inject(StateService);
  private backendBase = inject(backendEndPointToken);

  // At least one field filled & valid
  get isSubmitDisabled(): boolean {
    const v = this.vitalsFormGroup.getRawValue();
    const anyFilled = Object.entries(v).some(([k, val]) =>
      ['gait', 'height', 'weight', 'appearance', 'temperature', 'bloodPressure', 'pulseRate', 'respiratoryRate', 'oxygenSaturation']
        .includes(k) && val !== null && val !== ''
    );
    return !anyFilled || this.vitalsFormGroup.invalid;
  }
  authService = inject(AuthService);
  submitVitals() {
    if (this.isSubmitDisabled) return;
    const patientId = this.stateService.PatientResources.currentPatient.value.actualResource?.id;
    if (!patientId) {
      this.errorService.openandCloseError('No current patient.');
      return;
    }
    const encounterId = this.stateService.currentEncounter.value?.['id'];
    const performerRef = this.stateService.getPractitionerReference(this.authService.user?.getValue()?.['userId']);
    const observations = this.buildFhirObservations(patientId, encounterId, performerRef?.reference || undefined);
    // remove debug alert
    // alert(JSON.stringify(observations));

    if (!observations.length) {
      this.errorService.openandCloseError('No vitals to submit.');
      return;
    }

    // Prepare transaction Bundle with fullUrl and link BMI.derivedFrom -> Height, Weight
    const genUuid = () => {
      // Prefer crypto.randomUUID when available
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : (Math.random().toString(36).slice(2) + Date.now().toString(36));
      return `urn:uuid:${id}`;
    };

    // Find indices by LOINC code
    const findIndexByCode = (code: string) =>
      observations.findIndex(o => (o?.code?.coding || []).some((c: any) => c?.code === code));

    const idxHeight = findIndexByCode('8302-2');
    const idxWeight = findIndexByCode('29463-7');
    const idxBMI = findIndexByCode('39156-5');

    // Build entries with fullUrl
    const entries = observations.map((r: any) => ({
      fullUrl: genUuid(),
      resource: r,
      request: { method: 'POST', url: 'Observation' }
    }));

    // Wire BMI.derivedFrom to the fullUrls of Height and Weight if present
    if (idxBMI > -1 && idxHeight > -1 && idxWeight > -1) {
      const bmiRes = entries[idxBMI].resource as any;
      bmiRes.derivedFrom = [
        { reference: entries[idxHeight].fullUrl },
        { reference: entries[idxWeight].fullUrl }
      ];
    }

    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries
    };
    // alert(JSON.stringify(bundle));

    this.http.post(this.backendBase, bundle, { headers: { Prefer: 'return=representation' } })
      .subscribe({
        next: (resp: any) => {
          const respEntries = Array.isArray(resp?.entry) ? resp.entry : [];
          const normalized = {
            resourceType: 'Bundle',
            type: 'transaction',
            entry: respEntries.length
              ? respEntries.map((e: any, i: number) => {
                let resource = e.resource;
                if (!resource) {
                  const loc: string = e?.response?.location || '';
                  const m = loc.match(/Observation\/([^\/]+)/);
                  const id = m && m[1];
                  resource = id ? { ...entries[i].resource, id } : entries[i].resource;
                }
                return { resource };
              })
              : entries.map(en => ({ resource: en.resource }))
          };
          this.stateService.processBundleTransaction(normalized as any);
          this.vitalsFormGroup.reset();
          this.patientBMI = undefined;
          this.patientBMICategory = null;
          this.patientBloodPressureCategory = null;

          //sucess snackbar
          this._sn.open('Vitals submitted successfully', 'Close', { duration: 3000 });
        },
        error: (err) => {
          console.error(err);
          this.errorService.openandCloseError('Failed to submit vitals. Try again.');
        }
      });
  }
  _sn = inject(MatSnackBar)
  // Effective BP range for UI messages
  get bpRangeEffective() {
    return this.bpRange ?? this.BP_RANGE_DEFAULT;
  }

}


// <SingleCodeField>{
//     generalProperties: {

//       fieldApiName: 'appearance',
//       fieldName: 'Patient Appearance',
//       fieldLabel: 'Patient Appearance',

//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },


//       fieldType: 'CodeField',
//       isArray: false,
//       isGroup: false
//     },
//     data: ['Well', 'Unwell', 'Pale', 'Flushed', 'Icteric',
//       'Lethargic', 'Active', 'Agitated', 'Calm', 'Compliant', 'Combative'
//     ]

//   },
//   //gait
//   <SingleCodeField>{
//     generalProperties: {
//       fieldApiName: 'gait',
//       fieldName: 'Gait',
//       fieldLabel: 'Gait',
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//       fieldType: 'CodeField',
//       isArray: false,
//       isGroup: false
//     },
//     data: ['Walks Normally', 'Walks with Support', 'Walks with Limp', 'Unable to Walk']
//   },
//   //temperature o celcius
//   <IndividualField>{
//     generalProperties: {
//       fieldApiName: 'temperature',
//       fieldName: 'Temperature',
//       fieldLabel: 'Temperature (°C)',
//       fieldType: 'IndividualField',
//       inputType: 'number',
//       isArray: false,
//       isGroup: false,
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//     },
//     data: null
//   },
//   //blood pressure mmhg
//   <IndividualField>{
//     generalProperties: {
//       fieldApiName: 'bloodPressure',
//       fieldName: 'Blood Pressure',
//       fieldLabel: 'Blood Pressure (mmHg)',
//       fieldType: 'IndividualField',
//       inputType: 'text',
//       isArray: false,
//       isGroup: false,
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//     },
//     data: null
//   },
//   //pulse rate (bpm)
//   <IndividualField>{
//     generalProperties: {
//       fieldApiName: 'pulseRate',
//       fieldName: 'Pulse Rate',
//       fieldLabel: 'Pulse Rate (bpm)',
//       fieldType: 'IndividualField',
//       inputType: 'number',
//       isArray: false,
//       isGroup: false,
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//     },
//     data: null
//   },
//   // Respiratory rate (bpm)
//   <IndividualField>{
//     generalProperties: {
//       fieldApiName: 'respiratoryRate',
//       fieldName: 'Respiratory Rate',
//       fieldLabel: 'Respiratory Rate (bpm)',
//       fieldType: 'IndividualField',
//       inputType: 'number',
//       isArray: false,
//       isGroup: false,
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//     },
//     data: null
//   },
//   // oxygen saturation (SpO2)
//   <IndividualField>{
//     generalProperties: {
//       fieldApiName: 'oxygenSaturation',
//       fieldName: 'Oxygen Saturation',
//       fieldLabel: 'Oxygen Saturation (SpO2)',
//       fieldType: 'IndividualField',
//       inputType: 'number',
//       isArray: false,
//       isGroup: false,
//       auth: {
//         read: 'all',
//         write: 'doctor, nurse'
//       },
//     },
//     data: null
//   },