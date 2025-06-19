import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'fhirReferenceLabel'
})
export class FhirReferenceLabelPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(ref: any): string | SafeHtml {
        if (!ref) return '';

        const label = ref.display || ref.identifier?.value || '';
        const refPath = ref.reference;

        if (refPath) {
            const html = `<a href="${refPath}" target="_blank" rel="noopener noreferrer">${label || refPath}</a>`;
            return this.sanitizer.bypassSecurityTrustHtml(html);
        }

        return label;
    }
}
