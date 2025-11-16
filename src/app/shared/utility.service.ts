import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { FormFields } from './dynamic-forms.interface2';
import { Observation, Resource } from 'fhir/r4';

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

  searchCodeableConceptByDisplayOrText(concept: any, codOrText: string, system?: string): boolean {
    if (!concept) {
      return false;
    }
    if (!concept.coding && !concept.text) {
      return false;
    }
    if (concept.coding && !concept.text && !Array.isArray(concept.coding)) {
      return false;
    }
    if (concept.text && concept.text.toLowerCase() === codOrText.toLowerCase()) {
      // alert(concept.text)
      return true;
    }
    if (concept.coding && Array.isArray(concept.coding)) {
      return concept.coding.some((coding: any) => {

        if (coding.display && coding.display.toLowerCase() === codOrText.toLowerCase()) {
          return true;
        }
        return false;
      });
    }
    return false;
  }

  convertAllValueTypesToString(obj: Observation | any): string {
    if (!obj || typeof obj !== 'object') return '';

    const toStr = (v: unknown) => (v ?? '').toString().trim();

    const fmtQuantity = (q: any) => {
      if (!q) return '';
      const comp = toStr(q.comparator);
      const val = toStr(q.value);
      const unit = toStr(q.unit || q.code);
      return [comp + val, unit].filter(Boolean).join(' ').trim();
    };

    const fmtCodeableConcept = (cc: any) => {
      if (!cc) return '';
      if (cc.text) return toStr(cc.text);
      if (Array.isArray(cc.coding)) {
        const parts = cc.coding
          .map((c: any) => toStr(c.display || c.code || ''))
          .filter(Boolean);
        if (parts.length) return Array.from(new Set(parts)).join(', ');
      }
      return '';
    };

    const fmtRange = (r: any) => {
      if (!r) return '';
      const low = fmtQuantity(r.low);
      const high = fmtQuantity(r.high);
      if (low && high) return `${low} - ${high}`;
      return low || high || '';
    };

    const fmtRatio = (ra: any) => {
      if (!ra) return '';
      const num = fmtQuantity(ra.numerator);
      const den = fmtQuantity(ra.denominator);
      if (num && den) return `${num} / ${den}`;
      return num || den || '';
    };

    const fmtSampledData = (sd: any) => {
      if (!sd) return '';
      // Use raw data string; avoid overlong output by trimming
      const data = toStr(sd.data);
      return data;
    };

    const fmtPeriod = (p: any) => {
      if (!p) return '';
      const start = toStr(p.start);
      const end = toStr(p.end);
      if (start && end) return `${start} - ${end}`;
      return start || end || '';
    };

    const valueProps = [
      'valueQuantity',
      'valueCodeableConcept',
      'valueString',
      'valueBoolean',
      'valueInteger',
      'valueRange',
      'valueRatio',
      'valueSampledData',
      'valueTime',
      'valueDateTime',
      'valuePeriod'
    ] as const;

    for (const prop of valueProps) {
      const v = obj[prop as keyof typeof obj];
      if (v === undefined || v === null) continue;

      switch (prop) {
        case 'valueQuantity':
          return fmtQuantity(v);
        case 'valueCodeableConcept':
          return fmtCodeableConcept(v);
        case 'valueString':
        case 'valueTime':
        case 'valueDateTime':
          return toStr(v);
        case 'valueBoolean':
          return String(Boolean(v));
        case 'valueInteger':
          return typeof v === 'number' ? String(v) : toStr(v);
        case 'valueRange':
          return fmtRange(v);
        case 'valueRatio':
          return fmtRatio(v);
        case 'valueSampledData':
          return fmtSampledData(v);
        case 'valuePeriod':
          return fmtPeriod(v);
        default:
          break;
      }
    }

    return '';
  }


  chooseFirstStringFromCodeableConcept(concept: any): string {
    if (!concept) {
      return '';
    }
    if (concept.text) {
      return concept.text;
    }
    if (concept.coding && Array.isArray(concept.coding) && concept.coding.length > 0) {
      let index = 0;
      let textToReturn = '';
      while (index < concept.coding.length && !textToReturn) {
        if (concept.coding[index].display) {
          textToReturn = concept.coding[index].display;
          // return textToReturn;
        }
        index++;
      }
      return textToReturn
    }
    return '';
  }

  getBefittingIconsForVitals(vitalCode: string): string {
    const key = (vitalCode || '').trim().toLowerCase();

    // Heuristic matches
    if (key.includes('blood pressure') || key.includes('systolic') || key.includes('diastolic') || key === 'bp') {
      return 'speed';
    }
    if (key.includes('oxygen') || key.includes('spo2')) {
      return 'water_drop';
    }
    if (key.includes('respir')) {
      return 'air';
    }
    if (key.includes('pulse')) {
      return 'favorite';
    }
    if (key.includes('temp')) {
      return 'thermostat';
    }
    if (key.includes('weight')) {
      return 'monitor_weight';
    }
    if (key.includes('height') || key.includes('stature')) {
      return 'height';
    }
    if (key.includes('bmi') || key.includes('body mass index')) {
      return 'insights';
    }
    if (key.includes('glucose') || key.includes('sugar')) {
      return 'science';
    }
    if (key.includes('pain')) {
      return 'sentiment_dissatisfied';
    }

    // Exact/synonym matches
    switch (key) {
      // using text not codes
      case 'body temperature':
      case 'temperature':
        return 'thermostat';
      case 'heart rate':
        return 'favorite';
      case 'respiratory rate':
      case 'respiration rate':
        return 'air';
      case 'oxygen saturation':
        return 'water_drop';
      case 'body height':
      case 'height':
      case 'stature':
        return 'height';
      case 'body weight':
      case 'weight':
        return 'monitor_weight';
      default:
        return 'insights';
    }
  }

  FilterResourcesBasedOnReferenceFieldId<T>(resources: Resource[], referenceField: string, referenceId: string): Resource[] {
    return resources.filter((resource: any) => {
      const refFieldValue = resource[referenceField];
      if (typeof refFieldValue === 'string') {
        return refFieldValue === referenceId;
      } else if (refFieldValue && typeof refFieldValue === 'object' && 'reference' in refFieldValue) {
        return (refFieldValue as any).reference === referenceId;
      }
      return false;
    });

  }
}

