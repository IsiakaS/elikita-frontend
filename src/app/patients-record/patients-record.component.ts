import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { MatTabsModule } from '@angular/material/tabs'
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { BehaviorSubject, forkJoin, map } from 'rxjs';
import { AgePipe } from '../age.pipe';
import { MatDialog } from '@angular/material/dialog';
import { formFields, formMetaData } from '../shared/dynamic-forms.interface'
import { DynamicFormsComponent } from '../dynamic-forms/dynamic-forms.component';
import { HttpClient } from '@angular/common/http';
import { DynamicFormsV2Component } from '../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatTooltipModule } from '@angular/material/tooltip'
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';

@Component({
  selector: 'app-patients-record',
  imports: [MatCardModule, MatButtonModule, CommonModule,
    MatFormField, MatDividerModule, RouterLink,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe, MatTooltipModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatInputModule, DatePipe,
    MatMenuModule, AgePipe,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './patients-record.component.html',
  styleUrl: './patients-record.component.scss'
})
export class PatientsRecordComponent {
  patientOpenAndClose = inject(PatientDetailsKeyService);
  route = inject(ActivatedRoute);
  resolvedData: any
  summaryTables: any = {}
  dialog = inject(MatDialog)

  constructor() {


  }
  patientId!: string
  encounterService = inject(EncounterServiceService);
  ngOnInit() {


    this.route.parent?.params.subscribe((allParamsObject) => {
      this.patientId = allParamsObject['id']
    })


    this.route.data.subscribe((allData) => {
      this.resolvedData = allData['patientData'];
      console.log(this.resolvedData);
    })

    this.resolvedData.encounter = [{
      "resourceType": "Encounter",
      "id": "enc-001",
      "status": "finished",
      "class": {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "AMB",
        "display": "Ambulatory"
      },
      "type": [{
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "11429006",
          "display": "Consultation"
        }],
        "text": "Outpatient Consultation"
      }],
      "subject": {
        "reference": "Patient/123",
        "display": "John Doe"
      },
      "participant": [{
        "individual": {
          "reference": "Practitioner/456",
          "display": "Dr. Alice"
        }
      }],
      "period": {
        "start": "2025-05-01T10:00:00+01:00",
        "end": "2025-05-01T10:45:00+01:00"
      },
      "reasonCode": [{
        "coding": [{
          "system": "http://snomed.info/sct",
          "code": "386661006",
          "display": "Fever"
        }],
        "text": "Fever and chills"
      }],
      "diagnosis": [{
        "condition": {
          "reference": "Condition/cond-001",
          "display": "Malaria"
        },
        "use": {
          "coding": [{
            "system": "http://terminology.hl7.org/CodeSystem/diagnosis-role",
            "code": "AD",
            "display": "Admission diagnosis"
          }]
        },
        "rank": 1
      }],
      "serviceProvider": {
        "reference": "Organization/hosp-001",
        "display": "General Clinic"
      }
    }]


    this.resolvedData.condition = [{

      "resourceType": "Condition",
      "id": "cond-1",
      "clinicalStatus": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
            "code": "active"
          }
        ]
      },
      "verificationStatus": {
        "coding": [
          {
            "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            "code": "confirmed"
          }
        ]
      },
      "category": [
        {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/condition-category",
              "code": "problem-list-item"
            }
          ]
        }
      ],
      "severity": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "255604002",
            "display": "Mild"
          }
        ]
      },
      "code": {
        "coding": [
          {
            "system": "http://snomed.info/sct",
            "code": "38341003",
            "display": "Hypertension"
          }
        ],
        "text": "Hypertension"
      },
      "subject": {
        "reference": "Patient/123",
        "display": "John Doe"
      },
      "encounter": {
        "reference": "Encounter/enc-1"
      },
      "onsetDateTime": "2025-05-09T10:26:00.710920",
      "abatementDateTime": "2025-02-08T10:26:00.710943",
      "recordedDate": "2024-09-03T10:26:00.710949",
      "asserter": {
        "reference": "Practitioner/456",
        "display": "Dr. Smith"
      },
      "note": [
        {
          "text": "Condition noted during routine checkup #1"
        }
      ]

    }]

    this.summaryTables['encounter'] = {
      displayedColumns: ['date',
        'reason', 'diagnosis', 'doctor']
    }
    this.summaryTables['condition'] = {
      displayedColumns:
        ['recordedDate', 'code',
          'severity',
          'asserter'
        ]
    }


  }
  http = inject(HttpClient);

  displayForm() {
    forkJoin({ class: this.http.get("/encounter/encounter_class.json") }).pipe(map((all: any) => {
      const keys = Object.keys(all);
      keys.forEach((key) => {
        console.log(all[key]);
        all[key] = {
          ...all[key], concept: all[key].concept.map((e: any) => {

            const system = all[key].system;
            return { ...e, system }


          })
        }
      })
      return all;
    })).subscribe((g: any) => {
      console.log(g);
      this.dialog.open(DynamicFormsV2Component, {
        data: {
          formMetaData: <formMetaData>{
            formName: 'Encounter (Visits)',
            formDescription: "Record your encounter with patient"
          },
          formFields: <formFields[]>[{
            fieldApiName: 'class',
            fieldName: 'Type of Encounter',
            fieldLabel: 'Type of Encounter',
            dataType: 'CodeableConcept',
            codingConcept: g.class.concept,
            codingSystems: g.class.system

          }]
        }
      })
    })
  }



}
