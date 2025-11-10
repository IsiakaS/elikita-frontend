import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'patientContacts',
  standalone: true,
  pure: true
})
export class PatientContactsPipe implements PipeTransform {

  transform(telecomArray: any[], type: 'phone' | 'email' | 'all' = 'all', maxItems: number = 2): string {
    if (!telecomArray || !Array.isArray(telecomArray) || telecomArray.length === 0) {
      return type === 'phone' ? 'No phone' : type === 'email' ? 'No email' : 'No contacts';
    }

    let filteredContacts: any[] = [];

    switch (type) {
      case 'phone':
        filteredContacts = telecomArray.filter((telecom: any) => 
          telecom?.system === 'phone' || telecom?.system === 'mobile' || telecom?.system === 'sms'
        );
        break;
      case 'email':
        filteredContacts = telecomArray.filter((telecom: any) => 
          telecom?.system === 'email'
        );
        break;
      case 'all':
        filteredContacts = telecomArray.filter((telecom: any) => 
          telecom?.value && telecom?.system
        );
        break;
    }

    if (filteredContacts.length === 0) {
      return type === 'phone' ? 'No phone' : type === 'email' ? 'No email' : 'No contacts';
    }

    // Sort by priority: mobile > phone > email > others
    const priorityOrder = ['mobile', 'phone', 'email', 'sms', 'fax', 'pager', 'url', 'other'];
    filteredContacts.sort((a: any, b: any) => {
      const aIndex = priorityOrder.indexOf(a.system) !== -1 ? priorityOrder.indexOf(a.system) : 999;
      const bIndex = priorityOrder.indexOf(b.system) !== -1 ? priorityOrder.indexOf(b.system) : 999;
      return aIndex - bIndex;
    });

    // Take only the requested number of items
    const contactsToShow = filteredContacts.slice(0, maxItems);

    // Format each contact with system indicator if showing all
    const formattedContacts = contactsToShow.map((contact: any) => {
      if (type === 'all') {
        const icon = this.getSystemIcon(contact.system);
        return `${icon} ${contact.value}`;
      }
      return contact.value;
    });

    // Join with line breaks for stacking (HTML will need to handle this)
    const result = formattedContacts.join(' | ');
    
    // Add indicator if there are more items
    if (filteredContacts.length > maxItems) {
      return `${result} (+${filteredContacts.length - maxItems} more)`;
    }

    return result;
  }

  private getSystemIcon(system: string): string {
    const icons: { [key: string]: string } = {
      'phone': '📞',
      'mobile': '📱',
      'email': '✉️',
      'sms': '💬',
      'fax': '📠',
      'pager': '📟',
      'url': '🌐',
      'other': '📋'
    };
    return icons[system] || '📋';
  }
}