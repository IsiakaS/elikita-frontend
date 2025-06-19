import { Component, inject, Inject, Input, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  formMetaData,
  CodeField, CodeableConceptField, IndividualField, IndividualReferenceField, GroupField,
  codingDataType, ReferenceDataType, ReferenceFieldArray,
  SingleCodeField,
  codeableConceptDataType,
  CodeableConceptFieldFromBackEnd,
} from '../dynamic-forms.interface2';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input';
import { debounce, debounceTime, map, Observable, of, startWith } from 'rxjs';
import { AsyncPipe, JsonPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { formFields } from '../dynamic-forms.interface';
import { MatButtonModule } from '@angular/material/button';
import { SplitHashPipe } from '../split-hash.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-dynamic-forms-v2',
  imports: [MatCardModule, ReactiveFormsModule,
    SplitHashPipe, MatDatepickerModule,
    MatFormFieldModule, MatSelectModule, MatAutocompleteModule, MatInputModule, AsyncPipe,
    TitleCasePipe, MatIconModule, JsonPipe
    , MatButtonModule],
  host: {

    style: "border: 2px solid var(--mat-sys-outline)"
  },
  templateUrl: './dynamic-forms-v2.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './dynamic-forms-v2.component.scss'
})
export class DynamicFormsV2Component {
  // Define the formMetaData and formFields as inputs 
  @Input() formMetaData!: formMetaData;
  searchableObject: any = {}
  @Input() formFields!: FormFields[];
  fb = inject(FormBuilder);
  fieldAutoCompleteObject: { [key: string]: Observable<any> | undefined } = {};
  aForm!: FormGroup;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any, @Optional() private dialogRef: MatDialogRef<DynamicFormsV2Component>) {
    if (data) {
      this.formMetaData = data.formMetaData;
      this.formFields = data.formFields;
      console.log("data", data);
    }

  }

  getGroupFieldKeys(field: FormFields): string[] {
    return Object.keys((field as GroupField).groupFields);
  }

  getGroupField(field: FormFields): GroupField {
    return field as GroupField
  }

  ngOnInit() {
    // Initialization logic if needed
    console.log('Form Metadata:', this.formMetaData);
    console.log('Form Fields:', this.formFields);
    this.aForm = this.fb.group({});
    if (this.formFields && this.formMetaData) {
      this.formFields.forEach(field => {
        this.addFieldToForm(this.aForm, field as FormFields);
      });
    }

  }

  addFieldToForm(fG: FormGroup, field: FormFields) {
    if (field.generalProperties.isGroup && field.hasOwnProperty('groupFields')
      && !field.generalProperties.isArray
    ) {

      let control = this.fb.group({});

      for (const key in (field as GroupField).groupFields) {
        field = field as GroupField
        if (field.groupFields.hasOwnProperty(key)) {
          const element = field.groupFields[key];
          this.addFieldToForm(control, element as FormFields);
        }

      }
      fG.addControl(field.generalProperties.fieldApiName, control)


    } else if (field.generalProperties.isArray &&
      field.generalProperties.isGroup && field.hasOwnProperty('groupFields')
    ) {

      let control: FormGroup = this.fb.group({});
      for (const key in (field as GroupField).groupFields) {
        field = field as GroupField
        if (field.groupFields.hasOwnProperty(key)) {
          const element = field.groupFields[key];
          //  control.addControl(element.generalProperties.fieldApiName, element)
          this.addFieldToForm(control, element as FormFields);
        }

      }

      let superControl = this.fb.array([control])

      fG.addControl(field.generalProperties.fieldApiName, superControl)
      console.log(fG.value);

    }
    // else if (field.generalProperties.isArray &&
    //   (!field.generalProperties.isGroup || !field.hasOwnProperty('groupFields'))
    // ) {

    //  let control = this.fb.control("");

    //   for (const key in (field as GroupField).groupFields) {
    //     field = field as GroupField
    //     if (field.groupFields.hasOwnProperty(key)) {
    //       const element = field.groupFields[key];
    //       this.addFieldToForm(control, element as FormFields);
    //     }

    //   }
    //   fG.addControl(field.generalProperties.fieldApiName, control)

    // }
    else {

      let control = this.fb.control('');
      let searchableObject: any[] = [];
      // if (Array.isArray(field.data)) {
      //   searchableObject = field.data;



      if (field.generalProperties.fieldType == "IndividualReferenceField"
        || field.generalProperties.fieldType == "SingleCodeField"
        || field.generalProperties.fieldType == 'CodeableConceptField' || field.generalProperties.fieldType == "CodeField"
        || field.generalProperties.fieldType == 'CodeableConceptFieldFromBackEnd'
      ) {

        switch (field.generalProperties.fieldType) {
          case "IndividualReferenceField":
            searchableObject = (field as IndividualReferenceField).data || [];
            break;
          case "CodeableConceptField":
            //   alert(field.generalProperties.fieldType);

            searchableObject = ((field as CodeableConceptField).data as codeableConceptDataType)?.coding || (field as CodeableConceptField).data || [];
            console.log("searchable object", searchableObject)
            break;
          case "CodeField":
            searchableObject = (field as CodeField).data || [];
            break;
          case "SingleCodeField":
            searchableObject = (field as SingleCodeField).data || [];
            break;
          case "CodeableConceptFieldFromBackEnd":
            searchableObject = (field as CodeableConceptFieldFromBackEnd).data
            break;
          default:
            searchableObject = [];
            break;
        }
        console.log(searchableObject);


      }

      if (field.generalProperties.value) {
        control.setValue(field.generalProperties.value);
      }
      if (field.generalProperties.validations) {
        field.generalProperties.validations.forEach((validation: any) => {
          if (validation.type === 'default') {
            if (validation.isFunction) {
              control.setValidators((Validators as any)[validation.name](...validation.functionArgs || []));
            } else {
              control.setValidators((Validators as any)[validation.name]);
            }
          }
        })
      }
      if (field.generalProperties.isArray) {
        fG.addControl(field.generalProperties.fieldApiName, this.fb.array([control]));
      } else {
        fG.addControl(field.generalProperties.fieldApiName, control);
      }

      this.searchableObject[field.generalProperties.fieldApiName] = searchableObject

      console.log(this.searchableObject, "this.searcheableobject")
      if (field.generalProperties.fieldType == "CodeableConceptFieldFromBackEnd") {
        this.fieldAutoCompleteObject[field.generalProperties.fieldApiName] = of([])
      } else {
        this.fieldAutoCompleteObject[field.generalProperties.fieldApiName] = control.valueChanges.pipe(startWith(""), map((f: any) => {
          console.log(f,);
          f = f.toLowerCase();
          // alert(f);
          return searchableObject.filter((g: any) => {
            if (typeof (g) == "object") {
              const keys = Object.keys(g);

              return keys.some((key) => {
                return g[key].toLowerCase().includes(f);
              })
            } else {


              return g.toLowerCase().includes(f)
            }
          })
        }))
      }

    }
    //  console.log((this.fieldAutoCompleteObject));

  }
  http = inject(HttpClient);
  searchCodeableConceptFromBackEnd(fieldApiName: string, value: string) {
    if (value.trim() !== "") {
      const url = this.searchableObject[fieldApiName];
      this.fieldAutoCompleteObject[fieldApiName] = this.http.get(`${url}&filter=${value.trim()}`).pipe(
        map((data: any) => {
          return data.expansion.contains.map((item: any) => {
            // return {
            //   code: item.code,
            //   display: item.display,
            //   system: item.system
            // };
            ///alert(`${item.code}$#$${item.display}$#$${item.system}`);
            return `${item.code}$#$${item.display}$#$${item.system}`;
          }
          );
        })
      )
    }
  }
  displayCodeDisplay(codeDisplay: string): string {
    return codeDisplay;
  }

  displayConceptFieldDisplay(conceptField: string): string {
    return conceptField.split('$#$')[1] || conceptField;
  }
  getAFormArrayControl(fieldApiName: string): FormArray {
    // console.log(fieldApiName, this.aForm.value);
    console.log((this.aForm.get(fieldApiName) as FormArray).controls.length)
    return this.aForm.get(fieldApiName) as FormArray;
  }
  addToAFormArray(fieldApiName: string) {
    let control;
    let fieldData = this.formFields.find((f: FormFields) => f.generalProperties.fieldApiName == fieldApiName);
    if (fieldData?.generalProperties.isGroup && fieldData?.hasOwnProperty('groupFields')

    ) {
      // alert("i am group")
      control = this.fb.group({});
      for (const key in (fieldData as GroupField).groupFields) {
        fieldData = fieldData as GroupField;
        if (fieldData.groupFields.hasOwnProperty(key)) {
          const element = fieldData.groupFields[key];
          this.addFieldToForm(control, element as FormFields);



        }




      }

      this.getAFormArrayControl(fieldApiName).push(control);
    } else {
      control = this.fb.control('');


      //const control = this.fb.control('');


      this.getAFormArrayControl(fieldApiName).push(control);
      const currentControlLength = this.getAFormArrayControl(fieldApiName).controls.length;
      console.log(currentControlLength);
      if (currentControlLength > 1) {
        this.fieldAutoCompleteObject[`${fieldApiName}-${currentControlLength - 1}`] = control.valueChanges.pipe(startWith(""), map((f: any) => {
          console.log(f);
          f = f.toLowerCase();

          let searchableObject;

          let field = fieldData as FormFields;

          if (field.generalProperties.fieldType == "IndividualReferenceField" || field.generalProperties.fieldType == 'CodeableConceptField' || field.generalProperties.fieldType == "CodeField") {

            switch (field.generalProperties.fieldType) {
              case "IndividualReferenceField":
                searchableObject = (field as IndividualReferenceField).data || [];
                break;
              case "CodeableConceptField":
                //   alert(field.generalProperties.fieldType);
                searchableObject = ((field as CodeableConceptField).data as codeableConceptDataType).coding || [];
                console.log("searchable object", searchableObject)
                break;
              case "CodeField":
                searchableObject = (field as CodeField).data || [];
                break;
              default:
                searchableObject = [];
                break;
            }



          }

          return searchableObject?.filter((g: any) => {
            if (typeof (g) == "object") {
              const keys = Object.keys(g);

              return keys.some((key) => {
                return g[key].toLowerCase().includes(f);
              })
            } else {
              return g.toLowerCase().includes(f)
            }
          })
        }))

      }
      console.log(this.fieldAutoCompleteObject)

    }

  }
  deleteFromAFormArray(fieldApiName: string, index: number) {
    const controlArray = this.getAFormArrayControl(fieldApiName);
    if (controlArray.length > 1) {
      controlArray.removeAt(index);
    } else {
      controlArray.setValue(['']);
    }
  }

  closeAndReturn() {
    this.dialogRef.close({
      values: this.aForm.value,
      formMetaData: this.formMetaData,
      formFields: this.formFields
    });
  }

}



