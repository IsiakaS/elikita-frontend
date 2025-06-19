import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';

export const patientsResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  return http.get("/sample_fhir_patients.json");
  // return http.get("https://hapi.fhir.org/baseR4/Patient").pipe(map((entries: any) => entries['entry'].map((e: any) => {
  //   return e.resource
  // })));
};
