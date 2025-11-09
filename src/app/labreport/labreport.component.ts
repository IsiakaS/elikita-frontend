import { Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddReportComponent } from './add-report/add-report.component';
import { commonImports } from '../shared/table-interface';

@Component({
  selector: 'app-labreport',
  imports: [...commonImports],
  templateUrl: './labreport.component.html',
  styleUrl: './labreport.component.scss'
})
export class LabreportComponent {
  dialog = inject(MatDialog);

  addReport() {
    console.log("Add report clicked");
    this.dialog.open(AddReportComponent, {
      maxWidth: '650px',
      maxHeight: '90vh',

    });
  }
}
