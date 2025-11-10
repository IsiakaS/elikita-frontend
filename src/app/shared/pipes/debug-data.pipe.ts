import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'debugData',
  standalone: true,
  pure: false  // Not pure so we can see changes
})
export class DebugDataPipe implements PipeTransform {

  transform(value: any, label: string = 'Debug'): string {
    console.log(`${label}:`, value);
    console.log(`${label} type:`, typeof value);
    console.log(`${label} isArray:`, Array.isArray(value));
    if (value && typeof value === 'object') {
      console.log(`${label} keys:`, Object.keys(value));
    }
    return JSON.stringify(value, null, 2);
  }
}