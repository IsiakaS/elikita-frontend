import { Component, inject, Inject, Input, OnChanges, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { codeableConceptDataType, FormFields, formMetaData, GroupField, IndividualField, SingleCodeField } from '../../shared/dynamic-forms.interface2';
import { DynamicFormsV2Component } from "../../shared/dynamic-forms-v2/dynamic-forms-v2.component";
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddVitalsComponent } from "../add-vitals/add-vitals.component";
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { Observation } from 'fhir/r5';
import { SplitHashPipe } from "../../shared/split-hash.pipe";
import { AsyncPipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { commonImports } from '../../shared/table-interface';
import { EncounterServiceService } from '../../patient-wrapper/encounter-service.service';
import { FormFieldsSelectDataService } from '../../shared/form-fields-select-data.service';
import { StateService } from '../../shared/state.service';
import { backendEndPointToken } from '../../app.config';
import { ErrorService } from '../../shared/error.service';
import { AuthService } from '../../shared/auth/auth.service';
import { FhirResourceService } from '../../shared/fhir-resource.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../../shared/success-message/success-message.component';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-add-observation',
  imports: [DynamicFormsV2Component, JsonPipe,
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
    examArray: this.fb.array([]),

  });
  get examArray() {
    return this.physicalExamForm.get('examArray') as FormArray;
  }

  addToExamArray() {
    // alert("adding");
    this.examArray.push(this.fb.group({
      'name': ['', [Validators.required]],
      'value': ['', [Validators.required]]
    }));
  }

  displayConceptFieldDisplay(conceptField: any): string {
    return conceptField?.display || String(conceptField);
  }
  currentExamSearchValue = new FormControl("");
  observationNameChosen = new FormControl("");
  dialog = inject(MatDialog);


  http = inject(HttpClient);
  sv(event: any) {
    console.log(event.source._value);

    if (event.selected) {
      // alert(JSON.stringify(event.source._value))s
      this.observationNameChosen.setValue(event.source._value)
    }
    if (!event.selected) {
      const index = this.examArray.controls.findIndex(ctrl => ctrl.get(['name'])?.value === event.source._value);
      if (index !== -1) {
        this.examArray.removeAt(index);
      }

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


    //PUT our website name as default system for the elements in the two array above

    const defaultSystem = this.backendEndPoint;

    this.samplePhysicalExaminationObservations = this.samplePhysicalExaminationObservations.map(item => ({
      ...item,
      system: defaultSystem
    }));
    this.sampleLaboratoryObservations = this.sampleLaboratoryObservations.map(item => ({
      ...item,
      system: defaultSystem
    }));



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

    this.observationNameChosen.valueChanges.subscribe((value: any) => {

      const dref = this.dialog.open(ExamValueFormComponent, {
        maxHeight: '90vh',
        maxWidth: '650px',
        data: {
          name: value,
          placeholder: this.samplePhysicalExaminationObservations.find((item: any) => {
            // console.log(value?.split('$#$')[1]);
            //  ( && value?.split('$#$').length > 0 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase()))
            return item.display.trim().toLowerCase() === (value?.display?.trim().toLowerCase() || "");
            // (value?.split('$#$').length && value?.split('$#$').length > 1 ? value?.split('$#$')[1].trim().toLowerCase() : value?.trim().toLowerCase())
            // }
            // return true
          }
          )?.placeholder || 'Enter value'
        }
      })
      dref.afterClosed().subscribe(result => {
        if (result) {
          // console.log(this.examArray.controls[0].get(['value']), this.examArray.controls[0].get(['value'])?.value);
          // if (this.examArray.controls[0].get(['value'])?.value) {

          this.addToExamArray();
          this.examArray.controls[this.examArray.controls.length - 1]?.get(['name'])?.setValue(value);
          this.examArray.controls[this.examArray.controls.length - 1]?.get(['value'])?.setValue(result);
          // } else {
          //   this.examArray.controls[0]?.get(['value'])?.setValue(result);
          //   this.examArray.controls[0]?.get(['name'])?.setValue(value);
          //   for (const ff of this.examArray.controls) {
          //     console.log(ff.get(['value'])?.value);
          //     console.log(ff.get(['name'])?.value);
          //   }
          //   this.physicalExamForm.get('examArray')?.updateValueAndValidity();
          // }
          console.log(this.physicalExamForm.value);
        }
      });
    })
  }
  searchCodeableConceptFromBackEnd(fieldApiName: string, value: string) {
    if (value.trim() !== "") {
      const url = "https://tx.fhir.org/r4/ValueSet/$expand?url=http://hl7.org/fhir/ValueSet/observation-codes&_format=json";
      this.observationCodeSelectData = this.http.get(`${url}&filter=${value.trim()}`).pipe(
        map((data: any) => {
          return data.expansion?.contains?.length > 0 ? [

            ...data.expansion.contains
            // .map((item: any) => {
            //   return `${item.code}$#$${item.display}$#$${item.system}`;
            // }
            // )
            , {
              code: value,
              display: value,
              placeholder: value,
              system: `${this.backendEndPoint}`

            }] : [{
              code: value,
              display: value,
              placeholder: value,
              system: `${this.backendEndPoint}`

            }];
        }),
        catchError(() => {
          this.errorService.openandCloseError("Error fetching options from backend. You can leave the one you entered or try again.");
          return of([{
            code: value,
            display: value,
            placeholder: "Enter A Value",
            system: `${this.backendEndPoint}`
          }])
        })
      )
    }
  }
  errorService = inject(ErrorService);

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

  ngOnChanges() {
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
      "display": "Exam"
    },
    // {
    //   "code": "laboratory",
    //   "display": "Laboratory"
    // },
    {
      "code": "others",
      "display": "Others"
    },
    // {
    //   "code": "survey",
    //   "display": "Survey"
    // },

    // {
    //   "code": "therapy",
    //   "display": "Therapy"
    // },
    // {
    //   "code": "activity",
    //   "display": "Activity"
    // },
    // {
    //   "code": "social-history",
    //   "display": "Social History"
    // }
  ]



  formMetaData =
    <formMetaData>{
      formName: 'Observations / Tests Results',
      formDescription: "Record your Observations or Test Results here",
      submitText: 'Submit',
    };
  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(backendEndPointToken) public backendEndPoint: string
  ) {
    // alert(Object.keys(data || {}).join(','));
    if (data && data.observationCategoryValue) {
      this.observationCategory.setValue(data.observationCategoryValue);
      this.observationCategoryValue = data.observationCategoryValue;
    }
    if (data && data.hasOwnProperty('isAnyCategory')) {
      this.isAnyCategory = data.isAnyCategory;
      // alert(this.isAnyCategory);
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
    if (data && !data.chosenFields && !data.isAnyCategory &&

      (this.observationCategory.value !== 'vital-signs' &&
        this.observationCategory.value !== 'laboratory'
        && this.observationCategory.value !== 'exam')
    ) {
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
  sn = inject(MatSnackBar);
  setObsCat(event: any) {
    if (event && event.value) {
      this.observationCategory.setValue(event.value)
      this.isAnyCategory = false;
    }
    if (this.observationCategory.value !== 'laboratory'
      && this.observationCategory.value !== 'exam'
      && this.observationCategory.value !== 'vital-signs'


    ) {
      this.ecServ.addObservation('100001', null, this.dref, this.observationCategory.value);
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

  logger: {
    [key: string]: any
  } = {}
  frs = inject(FhirResourceService);
  postToBackend(event: any) {
    // Validate patient and encounter (encounter optional unless required by your flow)
    const patientId = this.stateService.PatientResources.currentPatient.value.actualResource?.id;
    if (!patientId) {
      this.errorService.openandCloseError('No current patient selected.');
      return;
    }

    // Basic validation: require name/code and status
    const nameOk = !!event?.name;

    const statusOk = !!event?.status;
    const valueObj = event?.value || {};
    if (!nameOk || !statusOk) {
      this.errorService.openandCloseError('Please provide Observation name and status.');
      return;
    }

    // Build Observation resource from form payload
    const observation = this.buildObservationFromForm(event);

    // POST to backend; prefer full representation back
    this.http.post(`${this.backendEndPoint}/Observation`, observation, {
      headers: { 'Content-Type': 'application/fhir+json', 'Accept': 'application/fhir+json', 'Prefer': 'return=representation' }
    }).subscribe({
      next: (resp: any) => {
        const saved = resp?.resourceType === 'OperationOutcome' ? observation : (resp || observation);
        // Persist in state as saved if id present, else unsaved
        this.stateService.persistLocalResource(saved, saved?.id ? 'saved' : 'unsaved');

        // success snackbar
        this.sn.openFromComponent(SuccessMessageComponent, {
          data: 'Observation saved successfully!',
          duration: 3000,
        });
        this.dref?.close(saved);
      },
      error: (err) => {
        console.error('Failed to post observation:', err);
        // Persist locally as unsaved
        this.stateService.persistLocalResource(observation, 'unsaved');
        this.errorService.openandCloseError('Failed to post observation. Stored locally.');
      }
    });
  }

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

  // Helper to parse "code$#$display$#$system"
  private parseExamConcept(raw: string): { code: string; display: string; system: string } {
    if (!raw) return { code: '', display: '', system: '' };
    const parts = raw.split('$#$');
    return {
      code: parts[0] || raw,
      display: parts[1] || parts[0] || raw,
      system: parts[2] || 'http://snomed.info/sct'
    };
  }
  stateService = inject(StateService);
  auth = inject(AuthService);
  onSubmitPhysicalExamForm() {
    if (this.physicalExamForm.invalid || this.examArray.length === 0) return;
    const encounterRef = this.stateService.getCurrentEncounterReference();
    const patientRef = this.stateService.getPatientReference();
    const performer = this.stateService.getPractitionerReference(this.auth.user?.getValue()?.['userId']);

    const observations = this.examArray.controls.map(ctrl => {
      const rawName = ctrl.get('name')?.value || '';
      const rawValue = ctrl.get('value')?.value;
      const { code, display, system } = rawName;
      const numeric = rawValue !== null && rawValue !== '' && !isNaN(Number(rawValue));
      const obs: any = {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'exam',
            display: 'Exam'
          }]
        }],
        code: {
          coding: [{ system, code, display }],
          text: display
        },
        effectiveDateTime: new Date().toISOString()
      };
      if (encounterRef) obs.encounter = encounterRef;
      if (patientRef) obs.subject = patientRef;
      if (performer) obs.performer = [performer];

      if (numeric) {
        obs.valueQuantity = {
          value: Number(rawValue),
          unit: '',
          system: 'http://unitsofmeasure.org',
          code: ''
        };
      } else {
        obs.valueString = String(rawValue);
      }
      return obs;
    });

    // Build transaction bundle
    const txBundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: observations.map(o => ({
        resource: o,
        request: { method: 'POST', url: 'Observation' }
      }))
    };

    // POST bundle to server; prefer full resource representations in response
    this.http.post(`${this.backendEndPoint}`, txBundle, {
      headers: { Prefer: 'return=representation' }
    }).subscribe({
      next: (resp: any) => {
        // Normalize response to ensure entry[].resource exists.
        const respEntries = Array.isArray(resp?.entry) ? resp.entry : [];
        const normalized = {
          resourceType: 'Bundle',
          type: 'transaction',
          entry: respEntries.length
            ? respEntries.map((e: any, i: number) => {
              let resource = e.resource;
              if (!resource) {
                // Try to derive id from response.location like "Observation/{id}/_history/1"
                const loc: string = e?.response?.location || '';
                const match = loc.match(/Observation\/([^\/\s]+)/);
                const id = match && match[1] ? match[1] : undefined;
                resource = id ? { ...observations[i], id } : observations[i];
              }
              return { resource };
            })
            : observations.map(o => ({ resource: o })) // fallback (unsaved) if server didn't return entries
        };
        this.stateService.processBundleTransaction(normalized as any);

        // Reset form
        this.physicalExamForm.reset();
        while (this.examArray.length) this.examArray.removeAt(0);
      },
      error: (err) => {
        console.error('Failed to save Observations (transaction):', err);
        this.errorService.openandCloseError('Failed to save observations. Please try again.');
      }
    });
  }

  removeExam(index: number) {
    if (index > -1 && index < this.examArray.length) {
      this.examArray.removeAt(index);
    }
  }

  // MatDialogRef to close this dialog programmatically
  dref = inject(MatDialogRef<AddObservationComponent>, { optional: true });

  close() {
    this.dref?.close();
  }

  // Convert "code$#$display$#$system" or plain string/object to CodeableConcept
  private toCodeableConcept(input: any): any | null {
    if (!input) return null;
    if (typeof input === 'string') {
      const s = input.trim();
      if (!s) return null;
      if (s.includes('$#$')) {
        const [code = '', display = '', system = ''] = s.split('$#$');
        return {
          coding: [{ code: code.trim(), display: display.trim(), system: system.trim() }],
          text: display || code
        };
      }
      return { text: s };
    }
    if (Array.isArray(input)) {
      const coding = input.flatMap((v: any) => {
        if (typeof v === 'string' && v.includes('$#$')) {
          const [code = '', display = '', system = ''] = v.split('$#$');
          return [{ code: code.trim(), display: display.trim(), system: system.trim() }];
        }
        if (v && typeof v === 'object' && (v.code || v.display)) {
          return [{ code: v.code || '', display: v.display || v.text || '', system: v.system || '' }];
        }
        return [];
      });
      return coding.length ? { coding, text: coding[0].display || coding[0].code } : null;
    }
    if (typeof input === 'object') {
      if (Array.isArray(input.coding)) return input;
      if (input.code || input.display) {
        return { coding: [{ code: input.code || '', display: input.display || input.text || '', system: input.system || '' }], text: input.display || input.code };
      }
    }
    return null;
  }

  // Build Observation resource from form event payload
  private buildObservationFromForm(evt: any): any {
    const nowIso = new Date().toISOString();
    const status = (evt?.status || 'preliminary').toString().trim().toLowerCase();
    const categoryCC = this.toCodeableConcept(evt?.category);
    const codeCC = this.toCodeableConcept(evt?.name);

    const obs: any = {
      resourceType: 'Observation',
      status,
      effectiveDateTime: nowIso
    };

    if (categoryCC) obs.category = [categoryCC];
    if (codeCC) obs.code = codeCC;

    // Map value group -> valueQuantity or valueString
    const v = evt?.value || {};
    const rType = (v?.result_type || '').toString().trim();
    const rVal = v?.result_value;
    const rUnit = v?.result_unit;

    const hasNumber = rVal !== undefined && rVal !== null && rVal !== '' && !isNaN(Number(rVal));
    if (rType === 'Number' && hasNumber) {
      obs.valueQuantity = {
        value: Number(rVal),
        unit: rUnit || undefined,
        system: 'http://unitsofmeasure.org',
        code: rUnit || undefined
      };
    } else if (rVal !== undefined && rVal !== null && String(rVal).trim() !== '') {
      obs.valueString = String(rVal).trim();
    }

    // Optional valueAttachment from 'attachment' control (first item)
    const att = evt?.attachment;
    const first = Array.isArray(att) ? att[0] : att;
    if (first && (first.data || first.url)) {
      obs.valueAttachment = {
        contentType: first.type || first.contentType || 'application/octet-stream',
        data: first.data, // base64
        url: first.url,
        title: first.name || first.title
      };
    }

    // Subject, encounter, performer from state/auth
    const patientRef = this.stateService.getPatientReference();
    const encounterRef = this.stateService.getCurrentEncounterReference();
    const performerRef = this.stateService.getPractitionerReference(this.auth.user?.getValue()?.['userId']);

    if (patientRef) obs.subject = patientRef;
    if (encounterRef) obs.encounter = encounterRef;
    if (performerRef) obs.performer = [performerRef];

    return obs;
  }

  // Open a reusable dialog to show object details as key/value
  openRowDetails(row: any, title: string = 'Details') {
    this.dialog.open(RowDetailsDialogComponent, {
      width: '720px',
      maxHeight: '90vh',
      data: { title, row }
    });
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

      this.examName = data.name.display ?? data.name;
      // .split("$#$").length > 1 ? data.name.split("$#$")[1] : data.name;
    }

  }

  addAndClose(value: string) {
    this.dRef.close(value);
  }

}

@Component({
  selector: 'app-row-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data?.title || 'Details' }}</h2>
    <div mat-dialog-content>
      <table class="kv">
        <tbody>
          <tr *ngFor="let kv of entries">
            <th>{{ kv.key }}</th>
            <td>
              <ng-container [ngSwitch]="kv.type">
                <span *ngSwitchCase="'primitive'">{{ kv.value }}</span>
                <pre *ngSwitchDefault>{{ kv.value | json }}</pre>
              </ng-container>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </div>
  `,
  styles: [`
    .kv { width: 100%; border-collapse: collapse; }
    .kv th { text-align: left; padding: 6px 8px; color: var(--mat-sys-on-surface-variant); width: 30%; vertical-align: top; }
    .kv td { padding: 6px 8px; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  `]
})
export class RowDetailsDialogComponent {
  entries: Array<{ key: string; value: any; type: 'primitive' | 'object' }> = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title?: string; row: any }) {
    const obj = data?.row || {};
    this.entries = Object.keys(obj).map(k => {
      const v = obj[k];
      const isPrimitive = v === null || ['string', 'number', 'boolean'].includes(typeof v);
      return { key: k, value: isPrimitive ? v : v, type: isPrimitive ? 'primitive' : 'object' };
    });
  }
}