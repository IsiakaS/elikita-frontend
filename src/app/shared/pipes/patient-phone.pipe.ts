import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientPhone',
  standalone: true,
  pure: true
})
export class PatientPhonePipe implements PipeTransform {

  transform(telecomArray: any[]): string {
    if (!telecomArray || !Array.isArray(telecomArray) || telecomArray.length === 0) {
      return 'No phone';
    }

    // Find phone numbers - prioritize mobile over phone over others
    const phones = telecomArray.filter((telecom: any) => 
      telecom?.system === 'phone' || telecom?.system === 'mobile'
    );

    if (phones.length === 0) {
      return 'No phone';
    }

    // Prefer mobile over regular phone
    const mobilePhone = phones.find((phone: any) => phone.system === 'mobile');
    if (mobilePhone && mobilePhone.value) {
      return mobilePhone.value;
    }

    // Fall back to any phone
    const anyPhone = phones.find((phone: any) => phone.value);
    if (anyPhone && anyPhone.value) {
      return anyPhone.value;
    }

    return 'No phone';
  }
}