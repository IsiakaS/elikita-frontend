import { Component, inject, Inject, Input, Optional, Self } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ErrorService } from '../../shared/error.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { commonImports } from '../../shared/table-interface';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, of, startWith, tap } from 'rxjs';
import { SplitHashPipe } from "../../shared/split-hash.pipe";
import { AdmissionService } from './admission.service';
import { TestingTasksComponent } from '../../testing-tasks/testing-tasks.component';

abstract class MatDialogProv {

}
@Component({
  selector: 'app-add-admission',
  imports: [...commonImports, CommonModule,
    MatAutocompleteModule, ReactiveFormsModule, TestingTasksComponent,
    MatSelectModule, DynamicFormsV2Component, SplitHashPipe],
  templateUrl: './add-admission.component.html',
  providers: [{ provide: MatDialogProv, useExisting: MAT_DIALOG_DATA }],
  styleUrls: ['../../shared/dynamic-forms-v2/dynamic-forms-v2.component.scss', './add-admission.component.scss']
})
export class AddAdmissionComponent {
  admService = inject(AdmissionService);
  @Input() formMetaData: any;
  @Input() formFieldsToUse: any;
  locationForm?: FormGroup
  fb = inject(FormBuilder)
  wardFormFilter?: Observable<any[]>;
  roomFormFilter?: Observable<any[]>
  bedFormFilter?: Observable<any[]>

  constructor(@Optional() @Self() @Inject(MatDialogProv) public data?: any) {


  }
  displayDisplay(val: any) {
    return val.split('$#$')[1];
  }
  ngOnInit() {
    if (this.data) {
      this.formMetaData = this.data.formMetaData;
      this.formFieldsToUse = this.data.formFieldsToUse;
    }
    if (this.formFieldsToUse.location) {
      this.locationForm = this.fb.group({
        'ward': '',
        'room': '',
        'bed': ""
      });
    }

    this.wardFormFilter = this.locationForm?.get(['ward'])?.valueChanges.pipe(startWith(""),
      tap((e: any[]) => {

        this.formFieldsToUse.location.formFields[1].useableData = this.formFieldsToUse.location.formFields[1].data.filter((e: any) => {
          // console.log(this.formFieldsToUse.location.formFields[0].data);
          return this.locationForm?.get(['ward'])?.value.includes(e.split('$#$')[2]);
        })
      }),
      map((e: any) => {
        // alert(e);
        return (this.formFieldsToUse.location.formFields[0].data || []).filter((f: any) => {
          // console.log(f, e);
          return f.toLowerCase().includes(e.toLowerCase());
        })
      })

      //  if (this.formFieldsToUse.location[0].data.find((f: any) => { return f.display.includes(e) }) !== undefined) {


      // })
    );

    //when room changes, bed data changes

    // this.locationForm?.get(['room'])?.valueChanges.pipe(startWith(""),
    //   map((e: any[]) => {
    //     this.formFieldsToUse.location.formFields[2].useableData = this.formFieldsToUse.location.formFields[2].data.filter((e: any) => {
    //       console.log(e, e.partOf, this.locationForm?.get(['ward'])?.value);
    //       return this.locationForm?.get(['room'])?.value.includes(e.split('$#$')[2]);
    //     })
    //     //  if (this.formFieldsToUse.location[0].data.find((f: any) => { return f.display.includes(e) }) !== undefined) {


    //   }))


    this.roomFormFilter = this.locationForm?.get(['room'])?.valueChanges.pipe(startWith(""),

      tap((e: any[]) => {
        this.formFieldsToUse.location.formFields[2].useableData = this.formFieldsToUse.location.formFields[2].data.filter((e: any) => {
          console.log(e, e.partOf, this.locationForm?.get(['ward'])?.value);
          return this.locationForm?.get(['room'])?.value.includes(e.split('$#$')[2]);
        })
        //  if (this.formFieldsToUse.location[0].data.find((f: any) => { return f.display.includes(e) }) !== undefined) {


      }),
      //  if (this.formFieldsToUse.location[0].data.find((f: any) => { return f.display.includes(e) }) !== undefined) {



      map((e: any) => {
        return (this.formFieldsToUse.location.formFields[1].useableData || []).filter((f: any) => {
          return f.toLowerCase().includes(e.toLowerCase());
        })
      }))

    this.bedFormFilter = this.locationForm?.get(['bed'])?.valueChanges.pipe(startWith(""),
      map((e: any) => {
        return (this.formFieldsToUse.location.formFields[2].useableData || []).filter((f: any) => {
          return f.toLowerCase().includes(e.toLowerCase());
        })
      }))



  }
  showCarePlanForm = false;
  displayTaskForm = false;
  showTaskForm() {
    this.displayTaskForm = true;
  }

}
