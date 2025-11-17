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

  /**
   * Convert a flat values object gathered from a form into a FHIR resource structure.
   * Heuristics:
   * - Strings containing "$#$" => CodeableConcept (code$#$display$#$system).
   * - Keys containing "status" => resource.status (lowercased).
   * - Keys ending with Date / DateTime => ISO instant (onsetDateTime, effectiveDateTime, authoredOn, etc. if present).
   * - Provided patientId => subject reference for common clinical resources (Observation, Condition, MedicationRequest, ServiceRequest).
   * - Provided encounterId => encounter reference for Observation / Condition / MedicationRequest.
   * - performerId => performer reference array when applicable.
   * - codeFieldNames / referenceFieldNames override auto-detection for special fields.
   * - Attachments (array of { name, type, data(base64) }) -> resource.attachment(s) or valueAttachment if single.
   */
  buildFhirResource(
    resourceType: string,
    values: Record<string, any>,
    opts?: {
      patientId?: string;
      encounterId?: string;
      performerId?: string;
      defaultStatus?: string;
      codeFieldNames?: string[];
      referenceFieldNames?: string[];
    }
  ): any {
    const out: any = { resourceType };

    // Subject / patient reference
    if (opts?.patientId && resourceType !== 'Patient') {
      const subjectCapable = ['Observation', 'Condition', 'MedicationRequest', 'ServiceRequest', 'AllergyIntolerance', 'Procedure'];
      if (subjectCapable.includes(resourceType)) {
        out.subject = { reference: `Patient/${opts.patientId}` };
      }
    }

    // Encounter reference
    if (opts?.encounterId) {
      const encounterCapable = ['Observation', 'Condition', 'MedicationRequest', 'Procedure'];
      if (encounterCapable.includes(resourceType)) {
        out.encounter = { reference: `Encounter/${opts.encounterId}` };
      }
    }

    // Performer
    if (opts?.performerId) {
      const performerCapable = ['Observation', 'MedicationRequest', 'Procedure', 'ServiceRequest'];
      if (performerCapable.includes(resourceType)) {
        out.performer = [{ reference: `Practitioner/${opts.performerId}` }];
      }
    }

    const codeFields = new Set(opts?.codeFieldNames || []);
    const refFields = new Set(opts?.referenceFieldNames || []);

    const isEmpty = (v: any) =>
      v === undefined || v === null ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0);

    for (const key of Object.keys(values || {})) {
      let val = values[key];
      if (isEmpty(val)) continue;

      // Status
      if (key.toLowerCase().includes('status') && !out.status && typeof val === 'string') {
        out.status = val.toLowerCase();
        continue;
      }

      // Date/time normalization
      if (/date(time)?$/i.test(key) && typeof val === 'string') {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          // Map onsetDateTime vs generic dateTime
          out[key] = parsed.toISOString();
          continue;
        }
      }

      // Explicit reference mapping (string or array)
      if (refFields.has(key) || /reference|subject|encounter|patient|performer/i.test(key)) {
        out[key] = this.mapReferenceValue(val);
        continue;
      }

      // CodeableConcept mapping
      if (codeFields.has(key) || this.looksLikeCode(val, key)) {
        out[key] = this.toCodeableConcept(val);
        continue;
      }

      // Attachments
      if (key.toLowerCase().includes('attachment')) {
        out[key] = this.mapAttachments(val);
        continue;
      }

      // Simple pass-through
      out[key] = val;
    }

    // Default status if not set
    if (opts?.defaultStatus && !out.status) {
      out.status = opts.defaultStatus;
    }

    return out;
  }

  // ---- Helpers ----

  private looksLikeCode(val: any, key: string): boolean {
    if (typeof val === 'string' && val.includes('$#$')) return true;
    if (Array.isArray(val) && val.every(v => typeof v === 'string' && v.includes('$#$'))) return true;
    return /(code|category|priority|severity|class|type)$/i.test(key);
  }

  private toCodeableConcept(input: any): any {
    if (!input) return null;
    if (typeof input === 'string') {
      if (input.includes('$#$')) {
        const [code = '', display = '', system = ''] = input.split('$#$');
        return { coding: [{ code, display, system }], text: display || code };
      }
      return { text: input };
    }
    if (Array.isArray(input)) {
      // array of encoded strings or objects
      const coding = input.flatMap((v: any) => {
        if (typeof v === 'string' && v.includes('$#$')) {
          const [code = '', display = '', system = ''] = v.split('$#$');
          return [{ code, display, system }];
        }
        if (v && typeof v === 'object' && (v.code || v.display)) {
          return [{ code: v.code || '', display: v.display || v.text || '', system: v.system || '' }];
        }
        return [];
      });
      return coding.length ? { coding, text: coding[0].display || coding[0].code } : { text: String(input) };
    }
    if (typeof input === 'object') {
      if (Array.isArray(input.coding)) return input;
      if (input.code || input.display) {
        return {
          coding: [{ code: input.code || '', display: input.display || input.text || '', system: input.system || '' }],
          text: input.display || input.code
        };
      }
    }
    return { text: String(input) };
  }

  private mapReferenceValue(val: any): any {
    if (typeof val === 'string') {
      return { reference: val };
    }
    if (Array.isArray(val)) {
      return val
        .filter(v => !!v)
        .map(v => typeof v === 'string' ? { reference: v } : v.reference ? v : null)
        .filter(v => !!v);
    }
    if (val && typeof val === 'object' && val.reference) {
      return val;
    }
    return val;
  }

  private mapAttachments(val: any): any {
    if (!val) return [];
    const arr = Array.isArray(val) ? val : [val];
    return arr
      .filter(v => v && (v.data || v.url))
      .map(v => ({
        contentType: v.type || v.contentType || 'application/octet-stream',
        data: v.data, // base64 expected
        url: v.url,
        title: v.name || v.title
      }))
      .filter(a => a.data || a.url);
  }
}

