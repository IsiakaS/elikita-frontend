import { ResolveFn } from '@angular/router';

export const patRegResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
