import { ResolveFn } from '@angular/router';

export const patObsResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
