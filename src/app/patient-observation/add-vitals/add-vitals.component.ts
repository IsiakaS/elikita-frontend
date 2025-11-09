import { booleanAttribute, ChangeDetectorRef, Component, Inject, inject, Input, Optional } from '@angular/core';
import { Form, FormBuilder, ReactiveFormsModule } from '@angular/forms';
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

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (!this.vitalsComponents && data && data.vitalsComponents) {
      this.vitalsComponents = data.vitalsComponents;
    }

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