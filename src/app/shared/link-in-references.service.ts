import { Injectable } from '@angular/core';
import { CodeableReference, Reference } from 'fhir/r5';

@Injectable({
  providedIn: 'root'
})
export class LinkInReferencesService {

  constructor() { }
  returnLinkFromReferences(objData: CodeableReference | Reference | any): string | null {
    if (objData.hasOwnProperty('reference') && typeof (objData['reference']) === 'string') {

      return objData.reference + "";
    } else if (objData.hasOwnProperty('reference') && typeof (objData['reference']) !== 'string'
      && objData['reference']!.hasOwnProperty('reference') && typeof (objData['reference']!['reference']) === 'string') {
      return objData.reference!.reference + "";
    } else {
      return null;
    }
  }
}
