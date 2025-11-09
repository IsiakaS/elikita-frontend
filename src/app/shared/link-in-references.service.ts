import { Inject, inject, Injectable } from '@angular/core';
import { CodeableReference, Reference } from 'fhir/r5';
import { backendUrlforSamplesToken } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class LinkInReferencesService {
  // This service is used to extract links from references or codeable references.
  // It checks if the reference is a string or an object with a reference property.
  constructor(@Inject(backendUrlforSamplesToken) private backendSampleToken: string) { }
  returnLinkFromReferences(objData: CodeableReference | Reference | any): string | null {
    if (objData.hasOwnProperty('reference') && typeof (objData['reference']) === 'string') {
      console.log("LinkInReferencesService: ", this.backendSampleToken);
      let r = objData.reference + "";
      if (r.includes('http')) {
        return r;
      } else {
        console.log(this.backendSampleToken + r,
          this.backendSampleToken + `${r.startsWith("/") ? "" : "/"}` + r);
        return this.backendSampleToken + `${r.startsWith("/") ? "" : "/"}` + r;
      }
    } else if (objData.hasOwnProperty('reference') && typeof (objData['reference']) !== 'string'
      && objData['reference']!.hasOwnProperty('reference') && typeof (objData['reference']!['reference']) === 'string') {
      let r = objData.reference!.reference + "";
      if (r.includes('http')) {
        return r;
      } else {
        return this.backendSampleToken + r.startsWith("/") ? "" : "/" + r;
      }
    } else {
      return null;
    }
  }
}
