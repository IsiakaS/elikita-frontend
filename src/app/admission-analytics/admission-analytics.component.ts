import { Component, inject } from '@angular/core';
import { commonImports } from '../shared/table-interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { BrowserModule } from '@angular/platform-browser';
import { NgxChartsModule, ScaleType } from '@swimlane/ngx-charts';
import { HttpClient } from '@angular/common/http';
import { Bundle, Observation } from 'fhir/r5';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admission-analytics',
  imports: [...commonImports, MatSelectModule,
    NgxChartsModule, CommonModule,
    MatChipsModule, ReactiveFormsModule],
  templateUrl: './admission-analytics.component.html',
  styleUrl: './admission-analytics.component.scss'
})
export class AdmissionAnalyticsComponent {

  chartFilter = new FormControl("respiratory-rate");

  chartFilterOptions: string[] = [
    'blood-pressure',
    'heart-rate',
    'temperature',
    'respiratory-rate',
    'oxygen-saturation',

  ];
  multi: any[] = [];
  view: [number, number] = [700, 300];
  legend = true;
  showLabels = true;
  animations = true;
  xAxis = true;
  yAxis = true;
  showYAxisLabel = true;
  showXAxisLabel = true;
  xAxisLabel = 'Date';
  yAxisLabel = 'Value';
  timeline = true;

  colorScheme = {

    name: 'whatever',
    domain: ['#327991', '#4980a0', '#639bb6', '#87b7c1'],
    selectable: true,
    group: ScaleType.Linear
  };
  //   domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  // };
  http = inject(HttpClient);

  ngxChartData?: any[]
  legendTitle: string = "";

  formatDateStringToMediumDateAndTime(dateISOString: string) {
    const date = new Date(dateISOString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
      date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' });
  }
  ngOnInit() {
    this.chartFilter.valueChanges.subscribe(value => {
      console.log("Selected filter:", value);
      switch (value) {
        case 'respiratory-rate':
          this.http.get<Bundle<Observation>>('https://hapi.fhir.org/baseR5/Observation?code=9279-1&_format=json&_count=20').
            subscribe((data: Bundle<Observation>) => {
              const observations = data.entry?.map(entry => entry.resource) as Observation[];
              const seriesData = observations.map(obs => ({
                name: this.formatDateStringToMediumDateAndTime(obs.effectiveDateTime || obs.effectivePeriod?.start || 'Unknown'),
                value: obs.valueQuantity?.value || 0
              }));
              console.log("Series Data:", seriesData);
              this.legendTitle = "Respiratory Rate";
              this.yAxisLabel = "Value (breaths/min)";
              this.ngxChartData = [{
                name: 'Respiratory Rate',
                series: seriesData
              }];

            });
          break;
        case 'heart-rate':
          this.http.get<Bundle<Observation>>('https://hapi.fhir.org/baseR5/Observation?code=8867-4&_format=json&_count=20').
            subscribe((data: Bundle<Observation>) => {
              const observations = data.entry?.map(entry => entry.resource) as Observation[];
              const seriesData = observations.map(obs => ({
                name: this.formatDateStringToMediumDateAndTime(obs.effectiveDateTime || obs.effectivePeriod?.start
                  || obs.issued
                  || 'Unknown'),
                value: obs.valueQuantity?.value || 0
              }));
              console.log("Series Data:", seriesData);
              this.legendTitle = "Heart Rate";
              this.yAxisLabel = "Value (beats/min)";
              this.ngxChartData = [{
                name: 'Heart Rate',
                series: seriesData
              }];
            });
          break;
        //blood glucose  & platelet-count
        case 'blood-glucose':
          this.http.get<Bundle<Observation>>('https://hapi.fhir.org/baseR5/Observation?code=1558-6&_format=json&_count=20').
            subscribe((data: Bundle<Observation>) => {
              const observations = data.entry?.map(entry => entry.resource) as Observation[];
              const seriesData = observations.map(obs => ({
                name: this.formatDateStringToMediumDateAndTime(obs.effectiveDateTime || obs.effectivePeriod?.start
                  || obs.issued
                  || 'Unknown'),
                value: obs.valueQuantity?.value || 0
              }));
              console.log("Series Data:", seriesData);
              this.legendTitle = "Blood Glucose";
              this.yAxisLabel = "Value (mg/dL)";
              this.ngxChartData = [{
                name: 'Blood Glucose',
                series: seriesData
              }];
            });
          break;
        case 'platelet-count':
          this.http.get<Bundle<Observation>>('https://server.fire.ly/r5/Observation?code=26464-8&_format=json').
            subscribe((data: Bundle<Observation>) => {
              const observations = data.entry?.map(entry => entry.resource) as Observation[];
              const seriesData = observations.map(obs => ({
                name: this.formatDateStringToMediumDateAndTime(obs.effectiveDateTime || obs.effectivePeriod?.start
                  || obs.issued
                  || 'Unknown'),
                value: obs.valueQuantity?.value || 0
              }));
              console.log("Series Data:", seriesData);
              this.legendTitle = "Platelet Count";
              this.yAxisLabel = "Value (cells/mcL)";
              this.ngxChartData = [{
                name: 'Platelet Count',
                series: seriesData
              }];
            });
      }
    });
  }

  chipsValueChanges(e: any) {
    switch (e.value) {
      case 'vital-signs':
        console.log("Vital Signs selected");
        this.chartFilterOptions = [
          'blood-pressure',
          'heart-rate',
          'temperature',
          'respiratory-rate',


        ];
        break;
      case 'lab-results':
        console.log("Lab Results selected");
        this.chartFilterOptions = [
          'blood-glucose',
          'cholesterol',
          'hemoglobin',
          'white-blood-cell-count',
          'platelet-count'
        ];
        break;
      case 'medications':
        console.log("Medications selected");
        this.chartFilterOptions = [
          'medication-1',
          'medication-2',
          'medication-3'
        ];
        break;
      default:
        break;
    }
  }
}
