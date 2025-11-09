import { Component, EventEmitter, inject, Inject, Input, Optional, Output } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { formFields, formMetaData } from '../shared/dynamic-forms.interface';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input';
import { map, Observable, startWith } from 'rxjs';
import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dynamic-forms',
  imports: [MatCardModule, ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatAutocompleteModule, MatInputModule, AsyncPipe,
    TitleCasePipe, MatIconModule
  ],
  templateUrl: './dynamic-forms.component.html',
  styleUrl: './dynamic-forms.component.scss'
})
export class DynamicFormsComponent {
  @Input() formMetaData!: formMetaData;
  @Input() formFields!: formFields[];
  @Output() formSubmitted = new EventEmitter<any>();
  fb = inject(FormBuilder);
  fieldAutoCompleteObject: { [key: string]: Observable<any> | undefined } = {};
  aForm!: FormGroup;

  constructor(@Optional() @Inject(MAT_DIALOG_DATA) public data: any) {
    if (data) {
      this.formMetaData = data.formMetaData;
      this.formFields = data.formFields;
    }

  }

  ngOnInit() {
    // Initialization logic if needed
    console.log('Form Metadata:', this.formMetaData);
    console.log('Form Fields:', this.formFields);
    this.aForm = this.fb.group({});
    this.formFields.forEach(field => {
      let control = this.fb.control('');
      let searchableObject: any[] = [];
      if (field.dataType == "Reference" || field.dataType == 'CodeableConcept' || field.dataType == "code") {

        switch (field.dataType) {
          case "Reference":
            searchableObject = field.Reference || [];
            break;
          case "CodeableConcept":
            searchableObject = field.codingConcept || [];

            break;
          case "code":
            searchableObject = field.code || [];
            break;
          default:
            searchableObject = [];
            break;
        }



      }

      if (field.value) {
        control.setValue(field.value);
      }
      if (field.validations) {
        field.validations.forEach((validation) => {
          if (validation.type === 'default') {
            if (validation.isFunction) {
              control.setValidators((Validators as any)[validation.name](...validation.functionArgs || []));
            } else {
              control.setValidators((Validators as any)[validation.name]);
            }
          }
        })
      }
      if (field.BackboneElement_Array) {
        if (field.includeUse) { } else {
          control = new FormArray([this.fb.control("")]) as unknown as FormControl
        }

      }
      this.aForm.addControl(field.fieldApiName, control);
      this.fieldAutoCompleteObject[field.fieldApiName] = this.aForm.get(field.fieldApiName)?.valueChanges.pipe(startWith(""), map((f: any) => {
        console.log(f);
        f = f.toLowerCase();

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
    });

  }
  displayCodeDisplay(codeDisplay: string): string {
    return codeDisplay;
  }

  getAFormArrayControl(fieldApiName: string): FormArray {
    return this.aForm.get(fieldApiName) as FormArray;
  }
  addToAFormArray(fieldApiName: string) {
    const control = this.fb.control('');
    this.getAFormArrayControl(fieldApiName).push(control);
  }
  deleteFromAFormArray(fieldApiName: string, index: number) {
    const controlArray = this.getAFormArrayControl(fieldApiName);
    if (controlArray.length > 1) {
      controlArray.removeAt(index);
    } else {
      controlArray.setValue(['']);
    }
  }

  submitForm() {
    if (this.aForm.valid) {
      this.formSubmitted.emit(this.aForm.value);
      console.log('Form submitted:', this.aForm.value);
    }
  }

}
