import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { delay, map } from 'rxjs';

export const patientsRecordResolver: ResolveFn<boolean> = (route, state) => {
  const http = inject(HttpClient);
  const patientId = route.parent?.params['id'] || route.params['id'];
  console.log(patientId);
  return http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
    return allArray.find((element: any) => {
      return element.identifier[0].value === patientId
    })
  }), delay(1000));
};

