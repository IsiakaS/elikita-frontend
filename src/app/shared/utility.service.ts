import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs';
import { FormFields } from './dynamic-forms.interface2';
import { Bundle, BundleEntry, FhirResource, Observation, Resource, CodeableConcept } from 'fhir/r4';
import { backendEndPointToken } from '../app.config';
import { Coding } from 'fhir/r4';
import { GroupField, IndividualField } from '../shared/dynamic-forms.interface2';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor() { }
  commonFormFields: Record<string, FormFields> = {
    'address': <GroupField>{
      generalProperties: {
        fieldApiName: 'address',
        fieldName: 'Address',
        fieldLabel: 'Address',
        fieldType: 'IndividualField',
        auth: { read: 'all', write: 'doctor, nurse, admin' },
        isArray: false,
        isGroup: true
      },
      keys: ['line', 'city', 'state', 'country', 'postalCode'],
      groupFields: {
        line: <IndividualField>{
          generalProperties: {
            fieldApiName: 'line',
            fieldName: 'Address Line',
            fieldLabel: 'Address Line',
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: true,
            isGroup: false
          },
          data: ''
        },
        city: <IndividualField>{
          generalProperties: {
            fieldApiName: 'city',
            fieldName: 'City',
            fieldLabel: 'City',
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: false,
            isGroup: false
          },
          data: ''
        },
        state: <IndividualField>{
          generalProperties: {
            fieldApiName: 'state',
            fieldName: 'State/Province',
            fieldLabel: 'State/Province',
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: false,
            isGroup: false
          },
          data: ''
        },
        country: <IndividualField>{
          generalProperties: {
            fieldApiName: 'country',
            fieldName: 'Country',
            fieldLabel: 'Country',
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: false,
            isGroup: false
          },
          data: ''
        },
        postalCode: <IndividualField>{
          generalProperties: {
            fieldApiName: 'postalCode',
            fieldName: 'Postal Code',
            fieldLabel: 'Postal Code',
            fieldType: 'IndividualField',
            inputType: 'text',
            isArray: false,
            isGroup: false
          },
          data: ''
        }
      }
    },
  };
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
        // alert('codeable concept:' + key + ' val:' + val);
        out[key] = this.toCodeableConcept(val);
        continue;
      }

      // Attachments
      if (key.toLowerCase().includes('attachment')) {
        out[key] = this.mapAttachments(val);
        continue;
      }

      if (key.toLowerCase().trim() == 'resourcetype') {
        out[key] = val;
      }

      // Simple pass-through
      out[key] = val;
    }

    // Default status if not set
    if (opts?.defaultStatus && !out.status) {
      out.status = opts.defaultStatus;
    }
    // alert(JSON.stringify(out));
    return out;
  }

  // ---- Helpers ----

  private looksLikeCode(val: any, key: string): boolean {
    if (typeof val === 'string' && val.includes('$#$')) return true;
    if (Array.isArray(val) && val.every(v => typeof v === 'string' && v.includes('$#$'))) return true;
    // Exclude 'resourceType' from being treated as a code field
    if (key.toLowerCase() === 'resourcetype') return false;
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

  /**
   * Generate a requisition identifier for FHIR resources.
   * Requisitions are used to track orders/requests in healthcare settings (lab tests, imaging, procedures).
   * 
   * @param opts Configuration options
   * @param opts.prefix Prefix for the requisition number (default: 'REQ')
   * @param opts.resourceType Type of resource: 'lab', 'service', 'imaging', 'specimen' (default: 'lab')
   * @param opts.facilityCode Short facility/department code (default: 'FAC')
   * @param opts.system System URL for the identifier (default: hospital system URL)
   * @param opts.includeTimestamp Whether to include timestamp in the requisition (default: true)
   * @returns FHIR Identifier object with requisition number
   * 
   * @example
   * // Generates: { system: '...', value: 'REQ-LAB-FAC-20251118-001234' }
   * generateRequisition({ resourceType: 'lab', facilityCode: 'LAB' })
   * 
   * @example
   * // Generates: { system: '...', value: 'SRV-IMG-RAD-20251118-001234' }
   * generateRequisition({ prefix: 'SRV', resourceType: 'imaging', facilityCode: 'RAD' })
   */
  generateRequisition(opts?: {
    prefix?: string;
    resourceType?: 'lab' | 'service' | 'medReq' | 'imaging' | 'specimen' | 'procedure' | 'consultation';
    facilityCode?: string;
    system?: string;
    includeTimestamp?: boolean;
  }): { system: string; value: string; type?: any } {
    const prefix = opts?.prefix || 'REQ';
    const facilityCode = opts?.facilityCode || 'FAC';
    const includeTimestamp = opts?.includeTimestamp !== false;
    const system = opts?.system || 'http://hospital.example.org/requisition';

    // Resource type codes for clarity
    const typeCodeMap = {
      lab: 'LAB',
      medReq: 'MEDREQ',
      service: 'SRV',
      imaging: 'IMG',
      specimen: 'SPM',
      procedure: 'PRO',
      consultation: 'CON'
    };
    const typeCode = opts?.resourceType ? typeCodeMap[opts.resourceType] : 'GEN';

    // Generate timestamp component (YYYYMMDD format)
    const now = new Date();
    const dateStr = includeTimestamp
      ? now.toISOString().slice(0, 10).replace(/-/g, '') // YYYYMMDD
      : '';

    // Generate unique sequence number (6 digits)
    // In production, this should come from a database sequence or atomic counter
    const sequence = this.generateSequenceNumber(6);

    // Build requisition number: PREFIX-TYPE-FACILITY-DATE-SEQUENCE
    const parts = [prefix, typeCode, facilityCode];
    if (dateStr) parts.push(dateStr);
    parts.push(sequence);

    const requisitionValue = parts.join('-');

    return {
      system,
      value: requisitionValue,
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'PLAC',
          display: 'Placer Identifier'
        }],
        text: 'Requisition Number'
      }
    };
  }

  /**
   * Generate a pseudo-random sequence number for requisitions.
   * In production, replace this with a database sequence or distributed ID generator.
   * 
   * @param length Number of digits in the sequence (default: 6)
   * @returns Zero-padded sequence number as string
   */
  private generateSequenceNumber(length: number = 6): string {
    // Use timestamp + random for uniqueness
    // In production: fetch from backend sequence generator
    const timestamp = Date.now() % (10 ** length);
    const random = Math.floor(Math.random() * 1000);
    const combined = (timestamp + random) % (10 ** length);
    return String(combined).padStart(length, '0');
  }

  /**
   * Generate requisition identifier and add it to a FHIR resource.
   * 
   * @param resource The FHIR resource to add requisition to
   * @param opts Requisition generation options
   * @returns The resource with requisition identifier added
   * 
   * @example
   * const serviceRequest = { resourceType: 'ServiceRequest', ... };
   * addRequisitionToResource(serviceRequest, { resourceType: 'imaging', facilityCode: 'RAD' });
   */
  addRequisitionToResource(
    resource: any,
    opts?: Parameters<typeof this.generateRequisition>[0]
  ): any {
    if (!resource) return resource;

    const requisition = this.generateRequisition(opts);

    // Add to identifier array if it exists, otherwise create it
    if (!resource.identifier) {
      resource.identifier = [];
    }
    if (!Array.isArray(resource.identifier)) {
      resource.identifier = [resource.identifier];
    }

    // Check if requisition already exists (avoid duplicates)
    const hasRequisition = resource.identifier.some(
      (id: any) => id.type?.coding?.some((c: any) => c.code === 'PLAC')
    );

    if (!hasRequisition) {
      resource.identifier.push(requisition);
    }

    return resource;
  }

  /**
   * Extract requisition number from a FHIR resource's identifiers.
   * 
   * @param resource FHIR resource with identifiers
   * @returns Requisition value or null if not found
   */
  getRequisitionFromResource(resource: any): string | null {
    if (!resource?.identifier) return null;

    const identifiers = Array.isArray(resource.identifier)
      ? resource.identifier
      : [resource.identifier];

    const requisition = identifiers.find(
      (id: any) => id.type?.coding?.some((c: any) => c.code === 'PLAC')
    );

    return requisition?.value || null;
  }

  retrieveResourceFromEntry(entry: BundleEntry<FhirResource> | FhirResource): FhirResource {
    if ('resource' in entry) {
      return entry.resource as FhirResource;
    }

    return entry as FhirResource;
  }
  backendApiEndpoint = inject(backendEndPointToken);
  getResourceData(resourceType: string): Observable<FhirResource[]> {
    const url = `${this.backendApiEndpoint}/${resourceType}?_count=1000`;
    return this.http.get<Bundle>(url).pipe(
      map((response: Bundle) => response?.entry?.map((resourceEntry: BundleEntry<FhirResource>) => this.retrieveResourceFromEntry(resourceEntry) || []) || [])
    );
  }

  filterResourceByACodeableConceptfield(resources: FhirResource[], fieldName: string, fieldValue: Coding | string): FhirResource[] {
    return resources.filter((resource: any) => {
      const conceptFieldValue = resource[fieldName] as CodeableConcept;
      if (!conceptFieldValue) {
        return false;
      }
      if (typeof fieldValue === 'string') {
        return this.searchCodeableConceptByDisplayOrText(conceptFieldValue, fieldValue);
      } else {
        return (conceptFieldValue.coding || []).some((coding: any) => {
          return coding.code === fieldValue.code && coding.system === fieldValue.system;
        });

      }
    });
  }
}
