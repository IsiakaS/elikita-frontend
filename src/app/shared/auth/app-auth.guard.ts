import { inject } from '@angular/core';
import { CanActivateChildFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';


export const appAuthGuard: CanActivateChildFn = (childRoute, state) => {

  const auth = inject(AuthService);
  if (auth.user.getValue() !== null
&& localStorage.getItem("fhir_hospital_id")
) {

    return true;

  }

  if(auth.user.getValue() !== null && !localStorage.getItem("fhir_hospital_id")){
  const hospitalSelectUrl: UrlTree = inject(Router).parseUrl('/hospital-select');
  console.log(state.url)
  return hospitalSelectUrl;
  }

  const loginUrl: UrlTree = inject(Router).parseUrl('/login');
  console.log(state.url)
  if (!state.url.includes('login')) {
    auth.triedUrl = state.url
  }

  return loginUrl;

};
