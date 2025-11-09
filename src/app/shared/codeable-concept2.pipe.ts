import { Pipe, PipeTransform } from '@angular/core';
import { CodeableConcept } from 'fhir/r5';

@Pipe({
  name: 'codeableConcept2'
})
export class CodeableConcept2Pipe implements PipeTransform {

  transform(value: CodeableConcept, whatToExtract: string | null = null, ...args: unknown[]): string {
    if (!whatToExtract

    ) {
      if (value.hasOwnProperty('text')) {
        return value.text as string;
      } else {
        console.log(value, value?.coding, (value?.coding?.[0], value?.coding?.[0].display || value?.coding?.[0].code) as string)
        return (value?.coding?.[0].display || value?.coding?.[0].code) as string;
      }
    }
    else {
      if (value.hasOwnProperty(whatToExtract)) {
        return (value as any)[whatToExtract];
      } else {
        if (value.coding?.hasOwnProperty(whatToExtract)) {
          return (value.coding as any)[whatToExtract];
        } else {
          return (value.coding?.[0] as any)[whatToExtract];
        }
      }
    }
  }

}
