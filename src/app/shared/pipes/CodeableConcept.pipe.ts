import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'codeableConceptLabel'
})
export class CodeableConceptLabelPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value: any): string | SafeHtml {
        if (!value) return '';

        // Return .text if available
        if (value.text) return value.text;

        // Else try coding[0]
        const coding = value.coding?.[0];
        if (coding?.code || coding?.display) {
            const code = coding.code || '';
            const display = coding.display || '';
            const html = `<span>${code}${code && display ? ' - ' : ''}${display}</span>`;
            return this.sanitizer.bypassSecurityTrustHtml(html);
        }

        return '';
    }
}
