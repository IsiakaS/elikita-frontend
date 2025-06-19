import { Pipe, PipeTransform } from '@angular/core';
import { Reference } from 'fhir/r5';

@Pipe({
  name: 'references2'
})
export class References2Pipe implements PipeTransform {

  transform(value: Reference, ...args: unknown[]): string {
    if (value.identifier?.value) { return value.identifier.value as string }
    else if (value.display) {
      return value.display.length < 20 ? value.display : value.display.substring(0, 20) + "..." as string
    }
    else if (value.reference) return (value.reference?.split("/")[value.reference?.split("/").length - 1]) as string;
    else return '';
  }

}
