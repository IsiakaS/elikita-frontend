import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isoDateFormatter',
    standalone: true
})
export class IsoDateFormatterPipe implements PipeTransform {
    /**
     * Transforms a string to formatted date and time if it's a valid ISO date string,
     * otherwise returns the original string.
     * 
     * @param value - The input string to check and format
     * @returns Formatted "date$#$time" string if ISO format, otherwise original string
     * 
     * @example
     * // Returns "Nov 29, 2025$#$8:47 PM"
     * '2025-11-29T20:47:16.147Z' | isoDateFormatter
     * 
     * @example
     * // Returns "Hello World"
     * 'Hello World' | isoDateFormatter
     */
    transform(value: any): string {
        // Return original if null, undefined, or not a string
        if (!value || typeof value !== 'string') {
            return value;
        }

        // Check if the string matches ISO 8601 date format pattern
        // Pattern: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ss.sss+00:00
        const isoPattern = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/i;

        if (!isoPattern.test(value)) {
            // Not ISO format, return original string
            return value;
        }

        // Try to parse as date
        const date = new Date(value);

        // Check if valid date
        if (isNaN(date.getTime())) {
            // Invalid date, return original string
            return value;
        }

        // Format date and time
        const dateString = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${dateString}$#$${timeString}`;
    }
}
