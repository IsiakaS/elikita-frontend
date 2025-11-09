import { Component, inject, Input } from '@angular/core';
import { MedicationRequest, Patient } from 'fhir/r4';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AsyncPipe, CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { catchError, mergeMap, switchMap, tap, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ErrorService } from '../shared/error.service';
import { AgePipe } from "../age.pipe";
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessMessageComponent } from '../shared/success-message/success-message.component';

export type PatientReg = Patient & { status: string }
@Component({
  selector: 'app-patient-registration-details',
  imports: [MatCardModule, MatButtonModule, MatDividerModule, DatePipe, CommonModule,
    TitleCasePipe, MatIconModule, AgePipe, MatTabsModule],
  templateUrl: './patient-registration-details.component.html',
  styleUrls: ['../dummy-medication-request-details/dummy-medication-request-details.component.scss', './patient-registration-details.component.scss']
})

export class PatientRegistrationDetailsComponent {
  @Input() inputData?: PatientReg
  @Input() practitionerPurpose?: boolean
  http = inject(HttpClient);
  private _sn = inject(MatSnackBar);
  allMedications!: MedicationRequest[];
  statuStyles: any;
  data: PatientReg | null = inject(MAT_DIALOG_DATA, { optional: true });
  dialogRef = inject(MatDialogRef<PatientRegistrationDetailsComponent>, { optional: true });
  errorService = inject(ErrorService);
  ngOnInit() {
    this.statuStyles = baseStatusStyles
    // no intent styles needed; trimmed unused imports

  }
  ngOnChanges() {
    if (!this.data && this.inputData) {
      this.data = this.inputData;
    }
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

  fieldKeys(data: any, exclude: any[]) {
    return Object.keys(data).filter((e) => {
      if (exclude.includes(e)) {
        return false
      } else {
        return true
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
        if (['system', 'code'].includes(key.split('.')[key.split('.').length - 1])) {
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
  // Approve: fetch original Patient then PUT with active=true

  approvePatient() {
    const id = this.data?.id;
    if (!id) {
      this.errorService.openandCloseError('Missing patient id.');
      return;
    }
    const url = `https://elikita-server.daalitech.com/Patient/${id}`;
    this.http.get<Patient>(url).pipe(
      // Tag errors from the initial GET so we can differentiate in the final handler
      catchError(err => throwError(() => ({ _stage: 'get', error: err }))),
      switchMap((patient) => {
        const updated: Patient = { ...patient, active: true } as Patient;
        console.log('[Approval] Original patient fetched:', patient);
        console.log('[Approval] Updated patient to send via PUT:', updated);
        const headers = new HttpHeaders({
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        });
        return this.http.put<Patient>(url, updated).pipe(
          // Tag errors from the PUT separately
          tap((e) => { console.log(e) }),
          catchError(err => throwError(() => ({ _stage: 'put', error: err })))
        );
      })
    ).subscribe({
      next: (res) => {
        this._sn.openFromComponent(SuccessMessageComponent, {
          data: { message: 'Patient approved. You can now find them on the Patients page.', action: 'View Patient' },
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        console.log('[Approval] PUT success response:', res);
        this.dialogRef?.close({ approved: true, id, resource: res });
      },
      error: (err) => {
        // err may be the underlying HttpErrorResponse or our tagged wrapper { _stage, error }
        const stage = (err && err._stage) ? err._stage : 'unknown';
        const cause = (err && err.error) ? err.error : err;
        console.error('Approve failed', stage, cause);
        if (stage === 'get') {
          this.errorService.openandCloseError('Could not load patient for approval. Please try again.');
        } else if (stage === 'put') {
          this.errorService.openandCloseError('Could not approve patient (update failed). Please try again.');
        } else {
          this.errorService.openandCloseError('Could not approve patient. Please try again.');
        }
      }
    });
  }

  rejectPatient() {
    const id = this.data?.id;
    if (!id) {
      this.errorService.openandCloseError('Missing patient id.');
      return;
    }
    if (!confirm('Are you sure you want to reject and delete this patient registration? This action cannot be undone.')) {
      return;
    }
    const url = `https://elikita-server.daalitech.com/Patient/${id}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.dialogRef?.close({ approved: false, rejected: true, id });
      },
      error: (err) => {
        console.error('Reject delete failed', err);
        this.errorService.openandCloseError('Could not delete patient. Please try again.');
      }
    });
  }
}
