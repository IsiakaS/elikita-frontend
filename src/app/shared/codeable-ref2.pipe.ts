import { Pipe, PipeTransform } from '@angular/core';
import { CodeableReference } from 'fhir/r5';
import { Observable } from 'rxjs';

@Pipe({
  name: 'codeableRef2'
})
export class CodeableRef2Pipe implements PipeTransform {


  transform(value: CodeableReference, ...args: any[]): string {
    console.log(value)

    if (!value) return '';

    // 1. Prefer concept if available
    const concept = value.concept;
    if (value.concept && concept?.text) { return concept.text; }

    if (value.concept && value.concept?.coding?.length) {
      const code = concept?.coding?.[0].code || '';
      const display = concept?.coding?.[0].display || '';
      const label = `${code}${code && display ? ' - ' : ''}${display}`;
      return label
      // this.sanitizer.bypassSecurityTrustHtml(`<span>${label}</span>`);
    }

    // 2. Fall back to reference
    const ref = value.reference;
    if (ref) {
      console.log(ref);
      const label = ref.display || ref.identifier?.value ||
        ((ref.reference?.split("/")[ref.reference?.split("/").length - 1]) && (ref.reference?.split("/")[ref.reference?.split("/").length - 1]).length < 20 ? ref.reference?.split("/")[ref.reference?.split("/").length - 1] : (ref.reference?.split("/")[ref.reference?.split("/").length - 1]) ? ref.reference?.split("/")[ref.reference?.split("/").length - 1].substring(0, 20) + "..." : "") || '';
      console.log(label);
      return label;

    }
    return ""

  }

}


