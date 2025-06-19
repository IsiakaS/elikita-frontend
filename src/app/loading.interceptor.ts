import { HttpContextToken, HttpEvent, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from './loader/loader.component';
import { tap } from 'rxjs';

export const LoadingUIEnabled = new HttpContextToken<boolean>(() => true);
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog)
  let dref: MatDialogRef<LoaderComponent>

  console.log(req.context.get(LoadingUIEnabled), "LoadingUIEnabled");
  if (req.context.get(LoadingUIEnabled)) {
    dref = dialog.open(LoaderComponent, {

    });
    return next(req).pipe(tap((event: HttpEvent<any>) => {
      if (event.type === HttpEventType.Response) {
        dref.close();
      }
      // dref.close();
    }));
  } else {
    return next(req);
  }
}
