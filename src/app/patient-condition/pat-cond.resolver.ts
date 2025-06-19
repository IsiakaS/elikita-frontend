import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { delay, forkJoin, map, switchMap } from 'rxjs';
import { GetReferencesService } from '../shared/get-references.service';


export const patCondResolver: ResolveFn<any> = (route, state) => {
  const http = inject(HttpClient);
  const getReferenceService = inject(GetReferencesService);
  //correct way to get patientId
  //const patientId = route.params['id'];
  // for demo purposes, we will use a hardcoded patientId
  const patientId = "pat-1"; // Replace with actual patient ID as needed
  // Fetching observations for the patient
  // This is a mock URL, replace with actual API endpoint
  console.log("Fetching observations for patient ID:", patientId);

  return http.get("condition_bundle.json").pipe(
    map((jsonObject: any) => {
      const allArray = jsonObject['entry'].map((e: any) => { return e.resource });
      console.log(allArray);
      return allArray.filter((element: any) => {
        //normal method to check if the observation is for the patient
        //   return element.subject.reference === `Patient/${patientId}`;
        //hardcoded for testing
        return element.subject.reference === `Patient/123`;
      });
    }),
    switchMap((observations: any[]) => {
      const obs = observations
      console.log(obs);
      const allRef = getReferenceService.deduplicateReferences(getReferenceService.extractReferences(obs))
      console.log(allRef);
      return forkJoin(allRef.map((e) => getReferenceService.getReference([e.split("/")[0], e.split("/")[1]]))).pipe(
        map((references: any[]) => {
          console.log(references, observations);
          return {
            observations: observations,
            // Extracting unique references from the observations
            references
          }
        }))
    }),

    delay(1000)
  );
};
