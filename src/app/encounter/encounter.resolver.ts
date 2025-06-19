import { ResolveFn } from '@angular/router';

export const encounterResolver: ResolveFn<boolean> = (route, state) => {
  return true;
};
