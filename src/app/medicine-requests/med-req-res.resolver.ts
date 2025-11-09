import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Bundle } from 'fhir/r5';

export const medReqResResolver: ResolveFn<Bundle> = (route, state) => {
  const http = inject(HttpClient);
  //give me another link fro sample testing
  const anothersamplelink2 = "https://test.fhir.org/r5/MedicationRequest?_format=json";
  //return http.get<Bundle>("https://server.fire.ly/r5/MedicationRequest?_format=json");
  return http.get<Bundle>("/medication2_bundle.json");


};
