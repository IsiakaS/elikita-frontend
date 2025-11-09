import { Component, inject } from '@angular/core';
import { fieldType } from '../shared/dynamic-forms.interface2';
import { Bundle } from 'fhir/r5';
import { HttpClient } from '@angular/common/http';
import { TabledOptionComponent } from '../tabled-option/tabled-option.component';
import { JsonPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-specimens',
  imports: [TabledOptionComponent, JsonPipe, MatCardModule, MatDividerModule],
  templateUrl: './specimens.component.html',
  styleUrl: './specimens.component.scss'
})
export class SpecimensComponent {
  http = inject(HttpClient);
  testingTabeledOption = {
    headerFilter: new Map<string, string[]>([

      ['status', ['active', 'completed', 'entered-in-error']],
    ]),
    columnMetaData: new Map([['request', {
      dataType: "IndividualReferenceField",
      columnName: "Lab Request"
    }],
    ['status', {
      dataType: "IndividualField",
      displayStyle: "chips",
      columnName: "Status"
    }],
    ['receivedTime', {
      dataType: "IndividualField",
      columnName: "Received Time"
    }],
    ['type', {
      dataType: "CodeableConceptField",

      columnName: "Type"
    }],

    ['subject', {
      dataType: "IndividualReferenceField",

      columnName: "Patient"
    }],



    ]) as Map<string, {
      dataType?: fieldType,
      displayStyle?: 'normal' | 'chips' | any,
      inputType?: any,
      columnName?: string
    }>,
    selectedRow: "",
    rawTableData: null as Bundle<any> | null,
    columns: ['receivedTime', 'status', 'type', 'subject',],
  }
  ngOnInit() {
    this.http.get("https://hapi.fhir.org/baseR5/Specimen?_format=json").subscribe((e: any) => {
      console.log(e)
      this.testingTabeledOption.rawTableData = e;

    })
  }

}
