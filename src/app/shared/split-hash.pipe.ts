import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'splitHash'
})
export class SplitHashPipe implements PipeTransform {

  transform(value: unknown, ...args: any[]): string {

    if (!value || typeof value !== 'string') {
      return '';
    } else {
      const parts = value.split('$#$');
      // console.log(args, parts, value, 'args,parts,value');
      if (args[0] >= parts.length) {

        return '';
      } else {
        return parts[args[0]] || '';
      }
    }


  }

}
