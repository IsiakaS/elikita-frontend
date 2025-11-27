import { Pipe, PipeTransform } from '@angular/core';
import { CodeableConcept } from 'fhir/r4';

@Pipe({
  name: 'codeableConcept2'
})
export class CodeableConcept2Pipe implements PipeTransform {

  transform(value: CodeableConcept | string | null | undefined, whatToExtract: string | null = null, ...args: unknown[]): string {
    if (value == null) return '';
    if (typeof value === 'string') return value; // pass through plain strings

    const firstCoding = Array.isArray((value as any).coding) && (value as any).coding.length > 0
      ? (value as any).coding[0]
      : undefined;

    if (!whatToExtract) {
      if (Object.prototype.hasOwnProperty.call(value, 'text') && value.text) {
        return value.text as string;
      } else {
        return (firstCoding?.display || firstCoding?.code || '') as string; // safe fallback
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(value, whatToExtract)) {
        return ((value as any)[whatToExtract] || '') as string;
      } else if (Array.isArray((value as any).coding)) {
        // try direct property on coding array object, then first coding element
        const codingObj: any = (value as any).coding;
        if (Object.prototype.hasOwnProperty.call(codingObj, whatToExtract)) {
          return (codingObj[whatToExtract] || '') as string;
        }
        return (codingObj[0]?.[whatToExtract] || '') as string;
      } else {
        return '';
      }
    }
  }

}
