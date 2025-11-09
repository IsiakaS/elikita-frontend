import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { DynamicFormsV2Component } from '../../shared/dynamic-forms-v2/dynamic-forms-v2.component';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddVitalsComponent } from '../../patient-observation/add-vitals/add-vitals.component';

@Component({
  selector: 'app-task-details',
  imports: [ReactiveFormsModule,

    MatMenuModule,
    MatFormFieldModule, MatButtonModule, MatInputModule,
    MatDatepickerModule, MatSelectModule, CommonModule,
    MatTimepickerModule, MatDividerModule, RouterLink,
    DynamicFormsV2Component, JsonPipe, MatIconModule, MatAutocompleteModule],
  templateUrl: './task-details.component.html',
  styleUrls: ['../../testing-tasks/testing-tasks.component.scss', './task-details.component.scss']
})
export class TaskDetailsComponent {
  dialog = inject(MatDialog);
  fulfillTasks() {
    // Logic to fulfill tasks goes here
    this.dialog.open(AddVitalsComponent, {
      maxHeight: '90vh',
      data: {
        vitalsComponents: ['bloodPressure', 'temperature', 'respiratoryRate', 'oxygenSaturation', 'pulseRate']
      }
    });
  }
}
