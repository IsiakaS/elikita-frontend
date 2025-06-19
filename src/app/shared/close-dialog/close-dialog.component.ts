import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-close-dialog',
  imports: [MatIconModule],
  templateUrl: './close-dialog.component.html',
  styleUrl: './close-dialog.component.scss'
})
export class CloseDialogComponent {

  @Input() bg: any;
  @Input() dialogRef: any

  closeDialog() {
    this.dialogRef.close();
  }

}
