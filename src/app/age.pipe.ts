import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'age'
})
export class AgePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {

    let dob = new Date(value).getTime();
    if (dob < 0) {
      dob = new Date('1992-10-31').getTime()
    }
    const todayTime = new Date().getTime();
    const divider = 1000 * 60 * 60 * 24 * 365;

    return Number((todayTime - dob) / divider).toFixed(0);

  }

}
