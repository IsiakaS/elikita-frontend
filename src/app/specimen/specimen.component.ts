import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { Bundle } from 'fhir/r5';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';

@Component({
  selector: 'app-specimen',
  imports: [TabledOptionComponent],
  templateUrl: './specimen.component.html',
  styleUrl: './specimen.component.scss'
})
export class SpecimenComponent {
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
    this.http.get("https://server.fire.ly/r4/MedicationRequest?_format=json").subscribe((e: any) => {
      this.testingTabeledOption.rawTableData = e;

    })
  }


}
