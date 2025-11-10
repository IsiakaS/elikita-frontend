import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientName',
  standalone: true,
  pure: true  // Pure pipe for better performance
})
export class PatientNamePipe implements PipeTransform {

  transform(nameArray: any[]): string {
    if (!nameArray || !Array.isArray(nameArray) || nameArray.length === 0) {
      return 'Unknown Patient';
    }

    // Get the first official or usual name, or fallback to first available
    const name = nameArray.find((n: any) => n.use === 'official' || n.use === 'usual') || nameArray[0];
    
    if (!name) {
      return 'Unknown Patient';
    }

    const parts: string[] = [];

    // Add all given names (first names, middle names, etc.)
    if (name.given && Array.isArray(name.given) && name.given.length > 0) {
      const givenNames = name.given
        .filter((given: string) => given && given.trim()) // Remove empty strings
        .join(' '); // Join with spaces
      if (givenNames) {
        parts.push(givenNames);
      }
    }

    // Add family name (last name)
    if (name.family && name.family.trim()) {
      parts.push(name.family);
    }

    // Return joined name or fallback
    const fullName = parts.join(' ').trim();
    return fullName || 'Unknown Patient';
  }
}