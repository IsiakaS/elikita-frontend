import { Component, inject } from '@angular/core';
import { PatientDetailsKeyService } from '../patient-sidedetails/patient-details-key.service';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { TabledOptionComponent } from "../tabled-option/tabled-option.component";
import { Bundle } from 'fhir/r5';

@Component({
  selector: 'app-testing',
  imports: [RouterOutlet, TabledOptionComponent],
  templateUrl: './testing.component.html',
  styleUrl: './testing.component.scss'
})
export class TestingComponent {
  ps = inject(PatientDetailsKeyService);
  ngAfterViewInit() {
    this.ps.openPatientDetailsStrip();
  }
  http = inject(HttpClient);
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['subject', {
      dataType: "IndividualReferenceField",
      columnName: "Patient"
    }],
    ['medication', {
      dataType: "CodeableReferenceField",
      displayStyle: "chips",
      columnName: "Allergy Type"
    }],
    ['status', {
      dataType: "SingleCodeField",
      displayStyle: "chips",
      columnName: "Status"
    }],


    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['subject', 'medication', 'status',],
  }
  ngOnInit() {
    // this.http.get("https://server.fire.ly/r4/MedicationRequest?_format=json").subscribe((e: any) => {
    //   this.testingTabeledOption.rawTableData = e;

    // })
  }


  processSelection(event: {
    [key: string]: any,
    reference: { reference: string, display: string },
    resource: any
  }) {
    console.log(event);
  }
}
