import { Pipe, PipeTransform } from '@angular/core';
import type { CodeableConcept } from 'fhir/r5';

@Pipe({
    name: 'joinedcodeableconcept'
})
export class JoinedCodeableConceptPipe implements PipeTransform {
    transform(
        value: Array<CodeableConcept | string> | CodeableConcept | string | null | undefined,
        separator: string = ', '
    ): string {
        if (value == null) return '';
        const toStringSafe = (cc: CodeableConcept | string | null | undefined): string => {
            if (cc == null) return '';
            if (typeof cc === 'string') return cc;
            const coding = Array.isArray((cc as any).coding) ? (cc as any).coding : [];
            const first = coding.length > 0 ? coding[0] : undefined;
            return (cc.text || first?.display || first?.code || '') as string;
        };

        if (Array.isArray(value)) {
            const parts = value.map(v => (toStringSafe(v) || '').trim()).filter(Boolean);
            return parts.join(separator);
        }

        return toStringSafe(value);
    }
}
