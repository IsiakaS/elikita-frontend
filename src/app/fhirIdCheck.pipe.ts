import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'isFhirReference'
})
export class IsFhirReferencePipe implements PipeTransform {

    transform(value: string | null | undefined): boolean {
        if (!value || typeof value !== 'string') return false;

        // UUID regex (matches 8-4-4-4-12 hex digits)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        // Simple FHIR ID pattern (letters, digits, -, ., 1-64 chars)
        // const idPattern = /^[A-Za-z0-9\-\.]{1,64}$/;

        return uuidPattern.test(value);
    }
}
