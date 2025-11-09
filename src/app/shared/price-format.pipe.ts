import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceFormat'
})
export class PriceFormatPipe implements PipeTransform {

  // Currency symbols mapping for currencies that don't display symbols properly
  private currencySymbols: { [key: string]: string } = {
    'NGN': '₦',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'KRW': '₩',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'BRL': 'R$',
    'MXN': '$',
    'ZAR': 'R',
    'THB': '฿',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$'
  };

  transform(value: unknown, ...args: unknown[]): unknown {
    // 1000 separator and 2 decimal places
    if (typeof value === 'number') {
      const currency = (args[0] as string) || 'NGN';
      //  alert(currency);
      // Try using the native toLocaleString first
      let formatted = value.toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      // If the currency symbol is not displayed (just shows currency code), use our custom symbol
      if (formatted.includes(currency) && this.currencySymbols[currency]) {
        // Format the number without currency, then add our custom symbol
        const numberFormatted = value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        formatted = `${this.currencySymbols['NGN']}${numberFormatted}`;
      }

      return formatted;
    } else {
      return value;
    }
  }

}
