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
        if (!value) return '';

        const stringValue = String(value);

        // Check if it's in the normalized format with $#$
        if (stringValue.includes('$#$')) {
            const parts = stringValue.split('$#$');
            return parts[1] || stringValue; // Return display value (middle part)
        }

        return stringValue;
    }
}
