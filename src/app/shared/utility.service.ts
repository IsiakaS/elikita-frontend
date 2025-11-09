import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { FormFields } from './dynamic-forms.interface2';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  getPatientName(patientId: any): Observable<string | null> {
    return this.http.get("sample_fhir_patients.json").pipe(map((allArray: any) => {
      return allArray.find((element: any) => {
        return element.identifier[0].value === patientId
      })
    }), map((patient: any) => {
      return patient.name[0].given.join(' ') + ' ' + patient.name[0].family;
    }));
  }

  getPatientIdFromRoute(): string | null {
    let startRoute = this.route.root.firstChild;
    let patientId = null;

    while (startRoute) {


      startRoute.snapshot.url.forEach((segment, index) => {
        console.log(startRoute?.routeConfig?.path?.includes("id"));
        if (segment.path.includes('patients') && startRoute?.routeConfig?.path?.includes("id")) {
          patientId = startRoute.snapshot.url[index + 1].path;

          // alert(patientId)
        } else {

        }
      }
      )

      startRoute = startRoute?.firstChild
    }
    return patientId;
  }

  convertFormFields(e: Map<string, {
    formFields: FormFields[],
    [key: string]: any
  }>): FormFields[] {
    const fieldsToReturn: FormFields[] = [];
    Array.from(e).forEach((f) => {
      f[1].formFields.forEach((g) => {
        fieldsToReturn.push(g);
      })
    })
    return fieldsToReturn
  }
}
