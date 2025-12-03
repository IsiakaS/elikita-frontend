import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-service-request-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './add-service-request-codes.component.html',
  styleUrls: ['./add-service-request-codes.component.scss']
})
export class AddServiceRequestCodesComponent implements OnInit {
  loading = false;

  ngOnInit(): void {
    // TODO: Load form fields and metadata
  }

  onFormSubmit(formData: any): void {
    // TODO: Transform and submit ActivityDefinition
    console.log('Form submitted:', formData);
  }
}
