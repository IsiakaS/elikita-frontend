import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientAddress',
  standalone: true,
  pure: true
})
export class PatientAddressPipe implements PipeTransform {

  transform(addressArray: any[]): string {
    if (!addressArray || !Array.isArray(addressArray) || addressArray.length === 0) {
      return 'No address';
    }

    // Get the first home or work address, or fallback to first available
    const address = addressArray.find((addr: any) => 
      addr.use === 'home' || addr.use === 'work'
    ) || addressArray[0];

    if (!address) {
      return 'No address';
    }

    const parts: string[] = [];

    // Prioritize city and country for table display
    if (address.city && address.city.trim()) {
      parts.push(address.city);
    }

    if (address.state && address.state.trim()) {
      parts.push(address.state);
    }

    if (address.country && address.country.trim()) {
      parts.push(address.country);
    }

    // Add street address if we have space and other parts exist
    if (address.line && Array.isArray(address.line)) {
      const firstLine = address.line.find((line: string) => line && line.trim());
      if (firstLine) {
        // Put street address at the beginning for better context
        parts.unshift(firstLine);
      }
    }

    const fullAddress = parts.join(', ').trim();
    return fullAddress || 'No address';
  }
}