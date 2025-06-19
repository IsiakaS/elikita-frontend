import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs';

export const labRequestsResolver: ResolveFn<boolean> = (route, state) => {
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

  return http.get("http://hapi.fhir.org/baseR4/ServiceRequest?_format=json").pipe(map((e: any) => {

    return e.entry.map((f: any) => {
      const randomNmbBtwZeroAndOne = Math.floor(Math.random() * 2);
      const subject = dummySubject[randomNmbBtwZeroAndOne];
      return { ...f.resource, subject }
    });
  }))
};
