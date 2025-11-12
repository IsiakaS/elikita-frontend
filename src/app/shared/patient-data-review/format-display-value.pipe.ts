import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatDisplayValue',
    standalone: true
})
export class FormatDisplayValuePipe implements PipeTransform {
    /**
     * Format display value - extracts display text from $#$ format
     * If value contains $#$, split and return the middle part [1]
     * Otherwise, return the value as-is
     */
    transform(value: any): string {
        if (value === null || value === undefined) return '';

        // Handle arrays: format each item and join with comma
        if (Array.isArray(value)) {
            const parts = value
                .map(v => this.transform(v))
                .filter(v => v !== '');
            return parts.join(', ');
        }

        // Handle plain objects: try common display properties before fallback
        if (typeof value === 'object') {
            // Prefer common human-readable keys
            const preferredKeys = ['display', 'text', 'name', 'label', 'title', 'value'];
            for (const key of preferredKeys) {
                if ((value as any)[key] !== undefined && (value as any)[key] !== null) {
                    return this.transform((value as any)[key]);
                }
            }
            // FHIR CodeableConcept: use first coding.display/code if present
            if (Array.isArray((value as any).coding) && (value as any).coding.length) {
                const c0 = (value as any).coding[0];
                return this.transform(c0.display ?? c0.code ?? '');
            }
            // Fallback to JSON string
            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        }

        const stringValue = String(value);

        // Check if it's in the normalized format with $#$
        if (stringValue.includes('$#$')) {
            const parts = stringValue.split('$#$');
            return parts[1] || stringValue; // Return display value (middle part)
        }

        return stringValue;
    }
}
