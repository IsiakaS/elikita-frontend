import { Component, inject, Inject, Input, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { codeableConceptDataType, FormFields, formMetaData, GroupField, IndividualField, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { AddVitalsComponent } from "../add-vitals/add-vitals.component";
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, of } from 'rxjs';
import { Observation } from 'fhir/r5';
import { SplitHashPipe } from "../../shared/split-hash.pipe";
import { AsyncPipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { commonImports } from '../../shared/table-interface';
import { EncounterServiceService } from '../../patient-wrapper/encounter-service.service';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';

@Component({
  selector: 'app-add-observation',
  imports: [DynamicFormsV2Component,
    MatInputModule, MatFormFieldModule, MatAutocompleteModule,
    AsyncPipe, TitleCasePipe, MatIconModule, MatButtonModule, ReactiveFormsModule,
    MatChipsModule, MatCardModule, AddVitalsComponent, SplitHashPipe],
  templateUrl: './add-observation.component.html',
  styleUrl: './add-observation.component.scss'
})
export class AddObservationComponent {
  observationCodeSelectData: Observable<any[]> = of([]);
  fb = inject(FormBuilder);

  physicalExamForm = this.fb.group({
    // Define your form controls here
    examArray: this.fb.array([this.fb.group({
      'name': [''],
      'value': ['']
    })]),

  });
  get examArray() {
    return this.physicalExamForm.get('examArray') as FormArray;
  }

  addToExamArray() {
    this.examArray.push(this.fb.group({
      'name': [''],
      'value': ['']
    }));
  }

  displayConceptFieldDisplay(conceptField: string): string {
    return conceptField.split('$#$')[1] || conceptField;
  }
  currentExamSearchValue = new FormControl("");
  observationNameChosen = new FormControl("");
  dialog = inject(MatDialog);


  http = inject(HttpClient);
  sv(event: any) {
    console.log(event.source._value);
    if (event.selected) {
      this.observationNameChosen.setValue(event.source._value)
    }
  }
  labsName = new FormControl("");
  setLabsName(event: any) {
    // console.log(event.source._value);
    if (event.value) {
      this.labsName.setValue(event.value)
    }
  }
  ngOnInit() {
    this.labsName.valueChanges.subscribe(value => {
      console.log(value);
      this.addLab(value || '', this.sampleLaboratoryObservations.find((item: any) => {
        console.log(value?.split('$#$')[1]);
        //  ( && value?.split('$#$').length > 0 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase()))
        return item.display.trim().toLowerCase() ===
          (value?.split('$#$').length && value?.split('$#$').length > 1 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase())
      }
      )?.unit || '')
    });

    this.observationNameChosen.valueChanges.subscribe(value => {

      const dref = this.dialog.open(ExamValueFormComponent, {
        maxHeight: '90vh',
        maxWidth: '650px',
        data: {
          name: value,
          placeholder: this.samplePhysicalExaminationObservations.find((item: any) => {
            console.log(value?.split('$#$')[1]);
            //  ( && value?.split('$#$').length > 0 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase()))
            return item.display.trim().toLowerCase() ===
              (value?.split('$#$').length && value?.split('$#$').length > 1 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase())
          }
          )?.placeholder || 'Enter value'
        }
      })
      dref.afterClosed().subscribe(result => {
        if (result) {
          console.log(this.examArray.controls[0].get(['value']), this.examArray.controls[0].get(['value'])?.value);
          if (this.examArray.controls[0].get(['value'])?.value) {

            this.addToExamArray();
            this.examArray.controls[this.examArray.controls.length - 1]?.get(['name'])?.setValue(value);
            this.examArray.controls[this.examArray.controls.length - 1]?.get(['value'])?.setValue(result);
          } else {
            this.examArray.controls[0]?.get(['value'])?.setValue(result);
            this.examArray.controls[0]?.get(['name'])?.setValue(value);
            for (const ff of this.examArray.controls) {
              console.log(ff.get(['value'])?.value);
              console.log(ff.get(['name'])?.value);
            }
            this.physicalExamForm.get('examArray')?.updateValueAndValidity();
          }
          console.log(this.physicalExamForm.value);
        }
      });
    })
  }
  searchCodeableConceptFromBackEnd(fieldApiName: string, value: string) {
    if (value.trim() !== "") {
      const url = "https://hapi.fhir.org/baseR4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/observation-codes&_format=json";
      this.observationCodeSelectData = this.http.get(`${url}&filter=${value.trim()}`).pipe(
        map((data: any) => {
          return data.expansion.contains.length > 0 ? [

            ...data.expansion.contains.map((item: any) => {
              // return {
              //   code: item.code,
              //   display: item.display,
              //   system: item.system
              // };
              ///alert(`${item.code}$#$${item.display}$#$${item.system}`);
              return `${item.code}$#$${item.display}$#$${item.system}`;
            }
            ), `${value}$#$${value}$#$${value}`] : [`${value}$#$${value}$#$${value}`];
        })
      )
    }
  }

  samplePhysicalExaminationObservations: any[] =
    [
      {
        "code": "301898006",
        "display": "Heart sounds",
        "placeholder": "Normal / Murmur / Irregular"
      },
      {
        "code": "249366005",
        "display": "Lung sounds",
        "placeholder": "Clear / Wheeze / Crackles"
      },
      {
        "code": "163033001",
        "display": "Abdominal tenderness",
        "placeholder": "Present / Absent / Localized"
      },
      {
        "code": "301354004",
        "display": "Edema",
        "placeholder": "None / Mild / Moderate / Severe"
      }

    ]
  sampleLaboratoryObservations = [
    {
      "code": "718-7",
      "display": "Hemoglobin [Mass/volume] in Blood",
      "unit": "g/dL"
    },
    {
      "code": "4548-4",
      "display": "Hemoglobin A1c/Hemoglobin.total in Blood",
      "unit": "%"
    },
    {
      "code": "2345-7",
      "display": "Glucose [Mass/volume] in Serum or Plasma",
      "unit": "mg/dL"
    },
    {
      "code": "2160-0",
      "display": "Creatinine [Mass/volume] in Serum or Plasma",
      "unit": "mg/dL"
    },
    {
      "code": "2951-2",
      "display": "Sodium [Moles/volume] in Serum or Plasma",
      "unit": "mmol/L"
    }
  ];

  @Input() isAnyCategory = true;
  @Input() observationCategoryValue = "";

  observationCategory = new FormControl("");


  formFields: any;
  toPassIntoDynamicForms: any;

  ngOnChange() {
    if (this.observationCategoryValue) {
      this.observationCategory.setValue(this.observationCategoryValue);
    }
  }

  generalObsCategory = [
    {
      "code": "vital-signs",
      "display": "Vital Signs"
    },
    {
      "code": "exam",
      "display": "Phsical Examination"
    },
    // {
    //   "code": "laboratory",
    //   "display": "Laboratory"
    // },
    {
      "code": "imaging",
      "display": "Imaging"
    },
    {
      "code": "survey",
      "display": "Survey"
    },

    {
      "code": "therapy",
      "display": "Therapy"
    },
    {
      "code": "activity",
      "display": "Activity"
    },
    {
      "code": "social-history",
      "display": "Social History"
    }
  ]



  formMetaData =
    <formMetaData>{
      formName: 'Observations / Tests Results',
      formDescription: "Record your Observations or Test Results here",
      submitText: 'Submit',
    };
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data && data.observationCategoryValue) {
      this.observationCategory.setValue(data.observationCategoryValue);
      this.observationCategoryValue = data.observationCategoryValue;
    }
    if (data && data.isAnyCategory) {
      this.isAnyCategory = data.isAnyCategory;
    }

    if (data && data.formFields) {
      // alert("hey");
      this.formFields = data.formfields;

    }
    console.log(data);
    //  data: {
    //         formFields: [[
    //           'category', {
    //             formfields:
    //               <FormFields[]>[
    if (data && !data.chosenFields && !data.observationCategoryValue && !data.hasOwnProperty('isAnyCategory')) {
      this.toPassIntoDynamicForms = [];
      this.data.observationformFields.forEach((element: [string, {
        [key: string]: any[]
      }]) => {
        if (element[0] == 'category') {
          if (element[1]['data'] && element[1]['data'].length == 1 && element[1]['data'][0].code === 'vital-signs') {
            this.observationCategory.setValue("vital-signs")
          } else if (element[1]['data'] && element[1]['data'].length == 1 && element[1]['data'][0].code === 'exam') {
            this.observationCategory.setValue("exam")
          } else if (element[1]['data'] && element[1]['data'].length == 1 && element[1]['data'][0].code === 'laboratory') {
            this.observationCategory.setValue("laboratory")
          }
        }
        console.log(element, element[1], element[1]['formFields'])
        this.toPassIntoDynamicForms = [...this.toPassIntoDynamicForms, ...element[1]['formFields']]
      });

      console.log(this.toPassIntoDynamicForms);
    }
  }

  setObsCat(event: any) {
    if (event && event.value) {
      this.observationCategory.setValue(event.value)
    }
    if (this.observationCategory.value !== 'laboratory'
      && this.observationCategory.value !== 'exam'
      && this.observationCategory.value !== 'vital-signs'


    ) {
      this.ecServ.addObservation('100001');
    }
  }
  ecServ = inject(EncounterServiceService);

  formFieldsDataService = inject(FormFieldsSelectDataService);
  labFormFields?: any[];
  labFormMetaData: formMetaData = {
    formName: 'Add Laboratory Result',
    formDescription: "Add a new laboratory result",
    submitText: 'Submit Result',
    showSubmitButton: true,
    closeDialogOnSubmit: false,

  };
  addLab(display: string, unit: string) {
    this.labFormMetaData.formName = `Add Laboratory Result For  ${display}`;
    forkJoin({
      practitioner: this.formFieldsDataService.getFormFieldSelectData('observation', 'practitioner'),

    }).subscribe((g: any) => {
      console.log(g);

      this.labFormFields = <FormFields[]>[



        <GroupField>{


          groupFields: {

            'result_value': <IndividualField>{
              generalProperties: {

                fieldApiName: 'result_value',
                fieldName: 'Result Value',
                fieldLabel: 'Result Value',
                inputType: 'number',

                fieldType: 'IndividualField',
                isArray: false,
                isGroup: false
              },


            },



            'result_unit': <IndividualField>{

              generalProperties: {

                fieldApiName: 'result_unit',
                fieldName: 'Unit',
                fieldLabel: 'Unit',
                fieldHint: 'Pick from suggested units or enter your own',

                fieldType: 'SingleCodeField',
                isArray: false,
                isGroup: false,
                value: unit,

              },
              data: this.ecServ.observation_units

            },


          },
          keys: [
            ''
          ],
          generalProperties: {

            fieldApiName: 'value',
            fieldName: 'Test Results',
            fieldLabel: 'Test Results',
            fieldType: 'SingleCodeField',
            isArray: false,
            isGroup: true
          },


        },


        <IndividualField>{
          generalProperties: {

            fieldApiName: 'attachment',
            fieldName: 'Add an Attachment',
            fieldLabel: 'Add an Attachment',
            fieldType: 'IndividualField',
            isArray: false,
            isGroup: false,
            inputType: 'photo_upload'
          },
          data: ''
        },




      ]

    })

  }







}


@Component({
  selector: 'app-value-form',
  templateUrl: './exam-value-form.html',
  imports: [...commonImports, JsonPipe],
  styleUrls: ['./add-observation.component.scss']
})
export class ExamValueFormComponent {
  examName?: 'string';
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dRef: MatDialogRef<ExamValueFormComponent>) {
    this.data = data;
    console.log(this.data);
    if (data && data.name) {
      this.examName = data.name.split("$#$").length > 1 ? data.name.split("$#$")[1] : data.name;
    }

  }

  addAndClose(value: string) {
    this.dRef.close(value);
  }


























}