import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetReferencesService {

  constructor(private http: HttpClient) { }


  getReference(resourceId: [string, string]): Observable<any> {
    // Extract the reference from the URL
    const [resourceType, id] = resourceId;
    // test url

    const url = `/${resourceType}_reference.json`;
    //alert("Fetching resource from: " + id);
    // Fetch the resource from the URL
    return this.http.get<any>(url).pipe(
      // Filter the response to find the resource with the matching ID
      map((resources: any[]) => resources.find(resource => resource.id === id)),
      map((e) => { return [resourceType + "/" + id, e] })
    );

  }


  extractReferences(observations: any[]): string[] {
    const refs: any[] = [];

    observations.forEach(obs => {
      if (obs.subject?.reference) refs.push(obs.subject.reference);
      if (obs.performer) obs.performer.forEach((p: any) => refs.push(p.reference));
      //  if (obs.encounter?.reference) refs.push(obs.encounter.reference);
      if (obs.asserter?.reference) refs.push(obs.asserter.reference);
    });

    return refs;
  }


  deduplicateReferences(refs: string[]): string[] {
    return Array.from(new Set(refs));
  }




  // fetchReferences(refs: string[]): Promise<Map<string, any>> {
  //   const results = await Promise.all(
  //     refs.map(async ref => {
  //       const [type, id] = ref.split('/');
  //       const resource = await fhirService.getResource(type, id);
  //       return [ref, resource];
  //     })
  //   );

  //   return new Map(results); // Map<"Patient/123", {...}>
  // }


}


