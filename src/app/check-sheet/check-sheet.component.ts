import { Component, inject } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { AddVitalsComponent } from '../patient-observation/add-vitals/add-vitals.component';
import { ObsResComponent } from '../obs-res/obs-res.component';
import { PatSympComponent } from "../pat-symp/pat-symp.component";
import { Bundle, BundleEntry, CodeableConcept, Medication, MedicationRequest, Observation, Quantity } from 'fhir/r5';
import { EncounterServiceService } from '../patient-wrapper/encounter-service.service';
import { MatDividerModule } from '@angular/material/divider';
import { CodeableReferenceDisplayComponent } from "../shared/codeable-reference-display/codeable-reference-display.component";
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-check-sheet',
  imports: [...commonImports,
    MatSelectModule,
    AddVitalsComponent, ObsResComponent, PatSympComponent, MatDividerModule, CodeableReferenceDisplayComponent],
  templateUrl: './check-sheet.component.html',
  styleUrls: ['../patients-record/patients-record.component.scss',
    '../encounter-check/encounter-check.component.scss', '../pat-symp/pat-symp.component.scss',
    './check-sheet.component.scss']
})
export class CheckSheetComponent {
  hardCodedResolvedData: any
  http = inject(HttpClient);
  resolvedData: any;
  patientId = "100096"
  labRequestAndValue?: any[];
  medRequestAndValue?: any[];
  longForm(unit: string | undefined) {
    if (unit === undefined) {
      return ''
    }
    switch (unit) {
      case 'd':
        return 'day';
      case 'h':
        return 'hour';
      case 'min':
        return 'minute';
      case 's':
        return 'second';
      default:
        return unit;
    }
  }

  ngOnInit() {
    this.http.get<Bundle<MedicationRequest>>("https://hapi.fhir.org/baseR5/MedicationRequest?_format=json&_count=100").subscribe((e: Bundle<MedicationRequest>) => {
      this.medRequestAndValue = e?.entry?.filter((e: any) => {
        return e.resource.hasOwnProperty('dosageInstruction') && e.resource.hasOwnProperty('medication');
      }).map((f: BundleEntry<MedicationRequest>) => {
        return {
          name: f.resource?.medication,
          dosage: f.resource?.dosageInstruction,
          timing: f.resource?.dosageInstruction?.[0].timing?.repeat?.frequency ? `${f.resource?.dosageInstruction?.[0].timing?.repeat?.frequency}  every 
          ${f.resource?.dosageInstruction?.[0].timing?.repeat?.period} ${this.longForm(f.resource?.dosageInstruction?.[0].timing?.repeat?.periodUnit)}` : '',
        }
      });
    });

    this.http.get<Bundle<Observation>>("https://hapi.fhir.org/baseR5/Observation?_format=json&category=laboratory").pipe(map((e) => {
      return e?.entry?.
        // filter((g: any) => {
        //   return g.hasOwnProperty('valueQuantity');
        // })
        map((f: BundleEntry<Observation>) => {
          //   return {name: f.resource.code,
          //     value: f.resource.valueQuantity}
          return {
            name: f.resource?.code?.text || (f.resource?.code?.coding?.[0].display ||
              f.resource?.code?.coding?.[0].display),
            value: f.resource?.valueQuantity ? `${f.resource?.valueQuantity?.value} ${f.resource?.valueQuantity?.unit || f.resource?.valueQuantity?.code}` : "Result Not Yet Available"
          }
        }
        ).reverse().slice(0, 5)
    })).subscribe((e) => {
      this.labRequestAndValue = e;
    })


    this.http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
      return allArray.find((element: any) => {
        console.log(element)
        return element.identifier[0].value === "100096"
      })
    }),).subscribe((patientData) => {
      console.log(patientData);
      this.resolvedData = patientData;
    });
  }
  requestLabTest() {
    // Logic to request a lab test
    this.encounterService.addServiceRequest('100001');
  }
  encounterService = inject(EncounterServiceService);
}

