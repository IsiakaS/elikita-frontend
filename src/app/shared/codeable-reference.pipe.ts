import { HttpClient } from '@angular/common/http';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, Observable, of } from 'rxjs';

@Pipe({
  name: 'codeableReference'
})
export class CodeableReferencePipe implements PipeTransform {
  sanitizer = inject(DomSanitizer);
  http = inject(HttpClient);
  transform(value: any, ...args: any[]): Observable<string | SafeHtml> {

    if (!value) return of('');

    // 1. Prefer concept if available
    const concept = value.concept;
    if (concept?.text) return concept.text;

    if (concept?.coding?.length) {
      const code = concept.coding[0].code || '';
      const display = concept.coding[0].display || '';
      const label = `${code}${code && display ? ' - ' : ''}${display}`;
      this.sanitizer.bypassSecurityTrustHtml(`<span>${label}</span>`);
    }

    // 2. Fall back to reference
    const ref = value.reference;
    if (ref) {
      const label = ref.display || ref.identifier?.value || ref.reference || '';
      if (ref.reference && (!args || args.length == 0)) {
        const link = `<a href="${ref.reference}" target="_blank" rel="noopener noreferrer">${label}</a>`;
        this.sanitizer.bypassSecurityTrustHtml(link);
      } else if (ref.reference && args && args.length > 0) {
        return this.http.get(ref.reference + "?_format=json").pipe(map((e: any) => {
          let g; console.log(e);

          // return e.map((f: any) => {
          g = e;
          for (const path of args) {
            if (isNaN(Number(path))) {
              g = g[path];
            } else {
              g = g[path];
            }
            console.log(g);

          }
          return g;
          // })
        }))

      }
      return of(label);
    }

    return of('');
  }

}
