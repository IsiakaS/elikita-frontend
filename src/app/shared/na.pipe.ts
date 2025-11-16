import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'na'
})
export class NaPipe implements PipeTransform {
    transform(value: any): string {
        if (value == null) return 'N/A';
        const trimmed = typeof value === 'string' ? value.trim() : value;
        return trimmed === '' ? 'N/A' : trimmed;
    }
}
