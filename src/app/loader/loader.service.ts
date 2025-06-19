import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from './loader.component';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  dialog = inject(MatDialog);
  loaderRef!: MatDialogRef<LoaderComponent>
  constructor() { }

  openLoader() {
    this.loaderRef = this.dialog.open(LoaderComponent, {
      panelClass: 'transparent-loader',
      backdropClass: 'transparent-loader-backdrop'
    });
  }

  closeLoader() {
    if (!this.loaderRef) {

    } else {
      this.loaderRef.close()
    }
  }
}
