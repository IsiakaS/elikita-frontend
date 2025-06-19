import { inject, Injectable, Optional } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorMessageComponent } from './error-message/error-message.component';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  constructor(@Optional() public dref: MatDialogRef<ErrorMessageComponent>) { }
  dialog = inject(MatDialog);


  openandCloseError(error: string): void {
    const dialogRef = this.dialog.open(ErrorMessageComponent, {
      data: { message: error },
      panelClass: 'error-dialog'
    });

    setInterval(() => {
      if (dialogRef) {
        dialogRef.close();
      }


    }, 3000);


    // This method can be used to handle errors globally
    // For example, you can log the error or display a notification
    console.error('An error occurred:', error);
    // You can also implement a notification service to show user-friendly messages
  }
}
