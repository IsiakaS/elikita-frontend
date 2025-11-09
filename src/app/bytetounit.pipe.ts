import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytetounit'
})
export class BytetounitPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    if (typeof value !== 'number') {
      return value; // Return the original value if it's not a number
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    let size = value;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

}
