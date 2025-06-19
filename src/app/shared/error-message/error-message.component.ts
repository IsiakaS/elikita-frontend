import { Component, Inject, Optional } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';

@Component({
  selector: 'app-error-message',
  imports: [],
  host: {
    class: 'error-component-host'
  },
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent {
  // data: any

  constructor(@Optional() @Inject(MAT_SNACK_BAR_DATA) public data: any, @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: any) {
    // this.data = data;
  }
}
