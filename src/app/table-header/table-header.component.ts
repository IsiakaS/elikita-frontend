import { TitleCasePipe } from '@angular/common';
import { Component, ElementRef, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormField, MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { AgePipe } from '../age.pipe';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-table-header',
  imports: [MatCardModule, MatButtonModule,
    MatFormField, MatDividerModule,
    MatExpansionModule, MatCheckboxModule, TitleCasePipe,
    MatTableModule,
    MatChipsModule,
    MatInputModule,
    MatMenuModule,
    MatTableModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './table-header.component.html',
  styleUrl: './table-header.component.scss'
})
export class TableHeaderComponent {
  @Input() patientsTableFilterArray!: Map<string, string[]>;
  @Input() patientsFiltersFormControlObject!: { [key: string]: FormGroup }
  @Input() searchBoxTitle?: string;
  // When false, header renders nothing (used when there is no table data)
  @Input() hasData: boolean = true;


  expand(element: HTMLElement) {
    element.classList.toggle('expand')
  }
}

