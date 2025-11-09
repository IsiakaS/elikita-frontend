import { AsyncPipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { SplitHashPipe } from '../shared/split-hash.pipe';
import { MatDialog } from '@angular/material/dialog';
import { AddObservationComponent } from '../patient-observation/add-observation/add-observation.component';

@Component({
  selector: 'app-obs-res',
  imports: [DynamicFormsV2Component,
    MatInputModule, MatFormFieldModule, MatAutocompleteModule,
    AsyncPipe, TitleCasePipe, MatIconModule, MatButtonModule, ReactiveFormsModule,
    MatChipsModule, MatCardModule, AddVitalsComponent, SplitHashPipe],
  templateUrl: './obs-res.component.html',
  styleUrl: './obs-res.component.scss'
})
export class ObsResComponent {
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
  samplePhysicalExaminationObservations: any[] =
    [

      {
        "code": "249366005",
        "display": "Lung sounds",
        "value": "Patient's lung sounds are clear."

      },
      {
        "code": "163033001",
        "display": "Abdominal tenderness",
        "value": "Patient's abdomen is tender on palpation."

      },
      {
        "code": "301354004",
        "display": "Edema",
        "value": "Patient's lower extremities show signs of edema."

      }

    ]

  ngOnInit() {
    this.examArray.controls[0].get(['name'])?.setValue('Heart sounds');
    this.examArray.controls[0].get(['value'])?.setValue("Patient's heart sounds are normal.");
    for (const pe of this.samplePhysicalExaminationObservations) {

      this.examArray.push(this.fb.group({
        'name': [pe.display],
        'value': [pe.value]
      }));
    }
  }
  dialog = inject(MatDialog)
  addMorePhysicalExam() {
    this.dialog.open(AddObservationComponent, {
      maxHeight: '90vh',
      maxWidth: '650px',
      data: {
        isAnyCategory: false,
        observationCategoryValue: 'exam',
      }
    }).afterClosed().subscribe((result: any) => {
      console.log(result);
    });
  }
}
