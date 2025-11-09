import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Bundle } from 'fhir/r5';
import { map } from 'rxjs';

export const labRequestsResolver: ResolveFn<Bundle> = (route, state) => {
  const http = inject(HttpClient);
  const dummySubject = [
    {
      "reference": "patients/123",
      "display": "Abubakar Nurein"
    },

    {
      "reference": "patients/456",
      "display": "Leya Aithu"
    }
  ]

  return http.get<Bundle>("https://server.fire.ly/r5/ServiceRequest?_format=json");
  // return http.get<Bundle>("serviceRequest_bundle.json");

  // .pipe(map((e: any) => {

  //   return e.entry.map((f: any) => {
  //     const randomNmbBtwZeroAndOne = Math.floor(Math.random() * 2);
  //     const subject = dummySubject[randomNmbBtwZeroAndOne];
  //     return { ...f.resource, subject }
  //   });
  // }))
};
