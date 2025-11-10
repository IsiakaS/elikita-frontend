import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientIdentifier',
  standalone: true,
  pure: true
})
export class PatientIdentifierPipe implements PipeTransform {

  transform(identifierArray: any[]): string {
    if (!identifierArray || !Array.isArray(identifierArray) || identifierArray.length === 0) {
      return 'No ID';
    }

    // Find the official or main identifier
    const primaryId = identifierArray.find((id: any) => 
      id.use === 'official' || id.use === 'usual'
    ) || identifierArray[0];

    if (!primaryId || !primaryId.value) {
      return 'No ID';
    }

    return primaryId.value;
  }
}