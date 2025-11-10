import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientAge',
  standalone: true,
  pure: true
})
export class PatientAgePipe implements PipeTransform {

  transform(birthDate: string, showBirthDate: boolean = false): string {
    if (!birthDate) {
      return 'Unknown age';
    }

    const birth = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) {
      return 'Invalid date';
    }

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (showBirthDate) {
      const birthDateStr = birth.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      return `${age} years\n${birthDateStr}`;
    }

    return `${age} years`;
  }
}