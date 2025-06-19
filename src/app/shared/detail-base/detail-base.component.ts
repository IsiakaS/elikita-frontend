//port { HttpClient } from '@angular/common/http';
import { Component, inject, Input } from '@angular/core';
import { Bundle, CodeableReference, Dosage, FhirResource, Medication, MedicationRequest, Reference, Resource } from 'fhir/r5';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'
import { MatExpansionModule } from '@angular/material/expansion'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatMenuModule } from '@angular/material/menu'
import { MatInputModule } from '@angular/material/input'
import { MatFormField } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider'
import { MatChipsModule } from '@angular/material/chips'
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, forkJoin, map, Observable, tap } from 'rxjs';
import { HttpClient, HttpContext } from '@angular/common/http';
import { baseStatusStyles } from '../statusUIIcons';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { medicationIntentStyles } from '../intentIconStyles';
import { ReferencePipe } from '../pipes/CodeableReference.pipe';
import { CodeableReferencePipe } from '../codeable-reference.pipe';
import { FhirReferenceLabelPipe } from '../pipes/Reference.pipe';
import { CodeableConceptLabelPipe } from '../pipes/CodeableConcept.pipe';
import { MatDialog } from '@angular/material/dialog';
import { DynamicFormsV2Component } from '../dynamic-forms-v2/dynamic-forms-v2.component';
import { formMetaData, formFields } from '../dynamic-forms.interface';
import {
  CodeableConceptField, CodeField, GroupField, IndividualField,
  codeableConceptDataType, ReferenceDataType, codingDataType,
  IndividualReferenceField, ReferenceFieldArray,
  SingleCodeField
} from '../dynamic-forms.interface2';
import { FormFieldsSelectDataService } from '../form-fields-select-data.service';
import { ErrorService } from '../error.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { LoadingUIEnabled } from '../../loading.interceptor';
type FormFields = IndividualField | ReferenceFieldArray | CodeableConceptField | CodeField | IndividualReferenceField | GroupField;


@Component({
  selector: 'app-detail-base',
  imports:
    [MatCardModule, MatButtonModule,
      MatFormField, MatDividerModule, DatePipe, RouterLink,
      RouterLinkActive, CommonModule,
      MatExpansionModule, MatCheckboxModule, TitleCasePipe,
      MatTableModule, AsyncPipe,
      MatChipsModule,
      MatInputModule, ReferencePipe, CodeableConceptLabelPipe,
      MatMenuModule, CodeableReferencePipe, FhirReferenceLabelPipe,
      MatTableModule, MatIconModule, ReactiveFormsModule, MatProgressSpinnerModule,],
  templateUrl: './detail-base.component.html',
  styleUrl: './detail-base.component.scss'
})
export class DetailBaseComponent {
  @Input() url!: string;

  http = inject(HttpClient);
  resource: any = "";
  statuStyles: any;
  intentStyles: any;
  ngOnInit() {
    this.statuStyles = baseStatusStyles
    this.intentStyles = medicationIntentStyles
    this.http.get<any>(
      // "https:hapi.fhir.org/baseR4/MedicationRequest?_format=json",
      this.url + "?_format=json", {
      context: new HttpContext().set(LoadingUIEnabled, false)
    }
    ).pipe(map((dataBundle) => {
      console.log(dataBundle);
      if (dataBundle) {
        console.log(dataBundle)
        return dataBundle
      } else {
        return ""
      }
    }))
      .subscribe({
        next: (resource) => {
          this.resource = resource
        },
        error: (e: any) => {
          console.log(e)
        }
      })
  }

  sortAccordingToSequence(dosageArray: any[]): Dosage[] {
    return dosageArray.sort((a: Dosage, b: Dosage) => {
      if (a.sequence && b.sequence) {
        return a.sequence - b.sequence
      } else {
        return 0
      }
    })
  }

  // renderOtherFields(data: any, startKey: string, exclude: string[]) {
  //   let otherDetailWrapperStartTag = `<div class="other-details">`;
  //   let otherDetailWrapperEndTag = `</div>`
  //   if (startKey !== null && data[startKey]) {
  //     const otherFields = Object.keys(data[startKey]).filter((key) => !exclude.includes(key));
  //     for (const field of otherFields) {
  //       console.log(field);
  //       let fieldGroupWrapper = `<div class="field-group">`;
  //       let fieldGroupWrapperEnd = `</div>`
  //       let individualDetailWrapperStart = ""
  //       while (typeof data[startKey][field] == "object") {
  //         individualDetailWrapperStart = fieldGroupWrapper + `<div class="field-group-title">${field}</div><div class="individual-detail">`
  //         let individualDetailWrapperEnd = `</div>`
  //         for (const key of Object.keys(data[startKey][field])) {

  //         }

  //       }
  //       let finalGroup = `
  //       <div class="field-group">
  //                                       <div class="field-value" [innerHTML]="instruction.text">

  //                                       </div>
  //                                       <div class="field-title">
  //                                           Dosage Insructions In Text
  //                                       </div>
  //                                   </div>`

  //       for (let i = 0; i < data[startKey][field].length; i++) {
  //         field
  //       }
  //       let individualDetailWrapperEnd = `</div>`
  //     }
  //   }

  // }

  fieldKeys(data: any, exclude: any[] = []) {
    return Object.keys(data).filter((e) => {
      if (exclude.length == 0) {


        if (exclude.includes(e)) {
          return false
        } else {
          return true
        }

      } else {
        return true;
      }
    });

  }

  renderOtherFields(data: any, key: string = '', parentWrapper: any = null): any {
    console.log(parentWrapper);
    const elements: string[] = [];

    const isPrimitive = (val: any) =>
      val === null || ['string', 'number', 'boolean'].includes(typeof val);

    //  for (const key in data) {
    if (!data.hasOwnProperty(key)) {
      return '';
    };

    //const fullKey = startKey ? `${startKey}.${key}` : key;
    const value = data[key];

    if (isPrimitive(value)) {
      console.log('primitive', value);
      const el = document.createElement('div');
      el.innerHTML = `
      ${['system', 'code', 'display'].includes(key.split('.')[key.split('.').length - 1]) ? "" :
          ` ${key.split('.')[key.split('.').length - 1]} - `
        }${value}`;
      //       el.innerHTML =     ` <div class="field-group">
      //                                         <div class="field-value">
      // ${value}
      //                                         </div>
      //                                         <div class="field-title">
      //                                            ${key.split('.')[key.split('.').length - 1]}  
      //                                         </div>
      //                                     </div>`;
      console.log(el.innerHTML);

      // <strong>: </strong> ${value}`;

      if (!parentWrapper) {
        console.log(el.innerHTML)
        if (['system', 'code', 'meta'].includes(key.split('.')[key.split('.').length - 1])) {
          return "";
        }
        return el.innerHTML
      } else {
        if (['system', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
          return parentWrapper.innerHTML;
        }
        console.log(parentWrapper.innerHTML);
        if ((parentWrapper as HTMLElement).children.length) {
          (parentWrapper as HTMLElement).children[(parentWrapper as HTMLElement).children.length - 1].appendChild(el);
        } else {
          parentWrapper.appendChild(el);
        }
        return parentWrapper.innerHTML
      }


      //elements.push(el.innerHTML);

    } else {
      if (value instanceof Array) {
        // alert("Array");
        if (!parentWrapper) {
          parentWrapper = document.createElement('div');
          parentWrapper.classList.add('detail-group');
        }
        for (const k of Object.keys(value[0])) {
          this.renderOtherFields(value[0], k, parentWrapper);
        }
        //  this.renderOtherFields(value, '0', parentWrapper);
      } else {
        console.log('object', value)
        if (parentWrapper) {
          let childWrapper = document.createElement('div');
          childWrapper.classList.add('detail-group');
          childWrapper.innerHTML = `<div class="detail-group-title"> ${key.split('.')[key.split('.').length - 1]}  </div>`;
          if (['system', 'Coding', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
            parentWrapper.appendChild(childWrapper);
          }

          console.log(parentWrapper);
        } else {
          parentWrapper = document.createElement('div');
          parentWrapper.classList.add('detail-group');
          if (['system', 'Coding', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
            parentWrapper.innerHTML = `<div class="detail-group-title"> ${key.split('.')[key.split('.').length - 1]}  </div>`;
          }

        }
        for (const k of Object.keys(value)) {
          this.renderOtherFields(value, k, parentWrapper);
        }
      }
      //this.renderOtherFields(value, `$key, parentWrapper);
    }
    // } else {
    //   console.log('val', typeof (value));
    // }
    // }
    //console.log(hugeWrapper);
    // for (const e of elements) {
    //   document.querySelector(".other-details")!.innerHTML += e;
    // }
    console.log(parentWrapper);
    return parentWrapper.innerHTML
    // ? parentWrapper.innerHTML : '';

  }
  dialog = inject(MatDialog);
  formFieldsDataService = inject(FormFieldsSelectDataService);


  errorService = inject(ErrorService);




}
