import { Component, ElementRef, EventEmitter, inject, Inject, Input, Optional, Output, QueryList, ViewChildren } from '@angular/core';
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
import { AsyncPipe, CommonModule, JsonPipe, TitleCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { formFields } from '../dynamic-forms.interface';
import { MatButtonModule } from '@angular/material/button';
import { SplitHashPipe } from '../split-hash.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio'
import flatpickr from "flatpickr"
import { StretchDirective } from '../../stretch.directive';
import { UploadUiComponent } from '../../upload-ui/upload-ui.component';
import { MatTooltipModule } from '@angular/material/tooltip';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;

@Component({
  selector: 'app-dynamic-forms-v2',
  host: {
    class: "app-dynamic-forms-v2"
  },
  imports: [MatCardModule, ReactiveFormsModule, MatCheckboxModule, MatSlideToggleModule,
    SplitHashPipe, MatDatepickerModule, MatRadioModule, CommonModule,
    MatFormFieldModule, MatSelectModule, MatAutocompleteModule, MatInputModule, AsyncPipe, StretchDirective, UploadUiComponent,
    TitleCasePipe, MatIconModule, JsonPipe, MatTooltipModule
    , MatButtonModule],

  templateUrl: './dynamic-forms-v2.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrl: './dynamic-forms-v2.component.scss'
})
export class DynamicFormsV2Component {
  // Define the formMetaData and formFields as inputs 
  @Input() formMetaData?: formMetaData;
  searchableObject: any = {}
  realHourScroll: any = [];
  @Input() formFields!: FormFields[];
  @Input() resetOnSubmit: boolean = true;
  fb = inject(FormBuilder);
  fieldAutoCompleteObject: { [key: string]: Observable<any> | undefined } = {};
  aForm!: FormGroup;
  minutes: any[] = [];
  @Output() formSubmitted = new EventEmitter<any>();

  // Inject dialog dependencies
  data = inject(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<DynamicFormsV2Component>, { optional: true });

  constructor() {
    if (this.data) {
      console.log(this.data);
      this.formMetaData = this.data.formMetaData;
      this.formFields = this.data.formFields;
      console.log("data", this.data);
    }

  }

  getGroupFieldKeys(field: FormFields): string[] {
    return Object.keys((field as GroupField).groupFields);
  }

  getGroupField(field: FormFields): GroupField {
    return field as GroupField
  }
  ngOnChanges() {
    if (this.formMetaData && this.formFields) {
      // this.formMetaData = this.data.formMetaData;
      // this.formFields = this.data.formFields;
      // console.log("data", this.data);
    }
    console.log("Form Metadata:", this.formMetaData);
    console.log("Form Fields:", this.formFields);

    // if (this.formFields && this.formMetaData) {
    if (this.formFields && this.aForm) {
      this.formFields.sort((a: FormFields, b: FormFields): number => {
        if (a.generalProperties.isArray && (!b.generalProperties.isGroup && !b.generalProperties.isArray && b.generalProperties.inputType !== 'textarea')) {
          return 1
        } else if (b.generalProperties.isArray && (!a.generalProperties.isGroup && !a.generalProperties.isArray && a.generalProperties.inputType !== 'textarea')) {
          return -1
        } else {
          return 0;
        }
      })
      for (const field of this.formFields) {
        this.addFieldToForm(this.aForm, field as FormFields);
      };
    }
  }
  ngOnInit() {
    // Initialization logic if needed
    console.log('Form Metadata:', this.formMetaData);
    console.log('Form Fields:', this.formFields);
    this.aForm = this.fb.group({});
    // if (this.formFields && this.formMetaData) {
    if (this.formFields) {
      this.formFields.sort((a: FormFields, b: FormFields): number => {
        if (a.generalProperties.isArray && (!b.generalProperties.isGroup && !b.generalProperties.isArray && b.generalProperties.inputType !== 'textarea')) {
          return 1
        } else if (b.generalProperties.isArray && (!a.generalProperties.isGroup && !a.generalProperties.isArray && a.generalProperties.inputType !== 'textarea')) {
          return -1
        } else {
          return 0;
        }
      })
      for (const field of this.formFields) {
        this.addFieldToForm(this.aForm, field as FormFields);
      };
    }
    for (let m = 0; m < 61; m++) {
      this.minutes.push(m < 10 ? '0' + m : m);
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
            // alert(searchableObject.join(" "))
            break;
          case "CodeableConceptFieldFromBackEnd":
            // alert("hey")
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
        console.log(fG, field.generalProperties.fieldApiName)
        fG.addControl(field.generalProperties.fieldApiName, control);
      }

      this.searchableObject[field.generalProperties.fieldApiName] = searchableObject

      console.log(this.searchableObject, "this.searcheableobject")
      if (field.generalProperties.fieldType == "CodeableConceptFieldFromBackEnd") {
        this.fieldAutoCompleteObject[field.generalProperties.fieldApiName] = of([])
      } else {
        this.fieldAutoCompleteObject[field.generalProperties.fieldApiName] = control.valueChanges.pipe(startWith(""), map((f: any) => {
          if (!f) {
            f = ""
          }
          // if (field.generalProperties.controllingField && field.generalProperties.controllingField.isAControlField) {
          //   if (f === field.generalProperties.controllingField.dependentFieldVisibilityTriggerValue) {
          //     (document.querySelector(`[dependency-id = "${field.generalProperties.controllingField.controlledFieldDependencyId}"]`) as HTMLElement).classList.remove('d-none')
          //   } else {
          //     if (!(document.querySelector(`[dependency-id = "${field.generalProperties.controllingField.controlledFieldDependencyId}"]`) as HTMLElement)?.classList?.contains('d-none')) {
          //       (document.querySelector(`[dependency-id = "${field.generalProperties.controllingField.controlledFieldDependencyId}"]`) as HTMLElement)?.classList.add('d-none');
          //     }
          //   }
          // }
          if (field.generalProperties.controllingField && field.generalProperties.controllingField.length > 0) {
            for (const cField of field.generalProperties?.controllingField) {
              // first hide all controlled fields
              (document.querySelector(`[dependency-id *= "${cField.controlledFieldDependencyId}"]`) as HTMLElement)?.classList.add('d-none');

              // then show the controlled field if the value matches the trigger value

              if (f === cField.dependentFieldVisibilityTriggerValue) {
                (document.querySelector(`[dependency-id *= "${cField.controlledFieldDependencyId}"]`) as HTMLElement)?.classList.remove('d-none')
              }
            }
          }
          console.log(f, field.generalProperties.fieldApiName);
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
    if (conceptField) {
      return conceptField.split('$#$')[1] || conceptField;
    }
    return conceptField;
  }
  getAFormArrayControl(fieldApiName: string): FormArray {
    // console.log(fieldApiName, this.aForm.value);
    // console.log((this.aForm.get(fieldApiName) as FormArray).controls.length)
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
    if (this.formMetaData?.closeDialogOnSubmit && this.dialogRef) {
      this.dialogRef.close({
        values: this.aForm.value,
        formMetaData: this.formMetaData,
        formFields: this.formFields
      });
    }

    this.formSubmitted.emit(this.aForm.value);

    if (this.resetOnSubmit) {
      this.aForm.reset();
    }
  }
  @ViewChildren('timeTrig') timeTriggs!: QueryList<HTMLElement>
  @ViewChildren('hsel') hourSelects!: QueryList<ElementRef>;
  @ViewChildren('msel') minuteSelects!: QueryList<ElementRef>;

  ngAfterViewInit() {
    if ((this.timeTriggs) && this.timeTriggs.length) {
      this.timeTriggs.forEach((e) => {
        //console.log(e.nativeElement as HTMLElement,);
        flatpickr(e, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
        })
      })
    }
    this.hourSelects.forEach((e: ElementRef, idx: number) => {
      const realHour = e.nativeElement.querySelector('.real-hour');
      const allEachHour: HTMLInputElement[] = e.nativeElement.querySelectorAll('.each-hour');

      const incButton = e.nativeElement.querySelector('.inc');
      this.realHourScroll[idx] = 0
      const decButton = e.nativeElement.querySelector('.dec');

      incButton.onclick = () => {
        const currentSeenHourIndex = Array.from(allEachHour).findIndex((e: HTMLInputElement) => {
          const parentRect = realHour.getBoundingClientRect();
          const childRect = e.getBoundingClientRect();

          return (
            childRect.top >= parentRect.top &&
            childRect.left >= parentRect.left &&
            childRect.bottom <= parentRect.bottom &&
            childRect.right <= parentRect.right
          );
        });

        if (currentSeenHourIndex < allEachHour.length - 1) {
          //alert(allEachHour.length + " " + currentSeenHourIndex);
          this.realHourScroll[idx] += 40
          // alert(this.realHourScroll);

          realHour.scroll(0, this.realHourScroll[idx]);
        }





      }


      decButton.onclick = () => {
        const currentSeenHourIndex = Array.from(allEachHour).findIndex((e: HTMLInputElement) => {
          const parentRect = realHour.getBoundingClientRect();
          const childRect = e.getBoundingClientRect();

          return (
            childRect.top >= parentRect.top &&
            childRect.left >= parentRect.left &&
            childRect.bottom <= parentRect.bottom &&
            childRect.right <= parentRect.right
          );
        });

        if (currentSeenHourIndex > 0) {
          this.realHourScroll[idx] -= 40
          // alert(this.realHourScroll);

          realHour.scroll(0, this.realHourScroll[idx]);
        }





      }
    })

    this.minuteSelects.forEach((e: ElementRef) => {

    })
  }

}



