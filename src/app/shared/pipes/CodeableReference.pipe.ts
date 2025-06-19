import { HttpClient } from '@angular/common/http';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { map, Observable, of } from 'rxjs';

@Pipe({
    name: 'Reference'
})
export class ReferencePipe implements PipeTransform {
    sanitizer = inject(DomSanitizer);
    http = inject(HttpClient);
    transform(value: any, ...args: any[]): Observable<string | SafeHtml | any> {

        if (!value) return of('');



        // 2. Fall back to reference
        const ref = value;
        console.log(ref);
        if (ref) {
            const label = ref.display || ref.identifier?.value || ref.reference || '';
            if (ref.reference && (!args || args.length == 0)) {
                const link = `<a href="${ref.reference}" target="_blank" rel="noopener noreferrer">${label}</a>`;
                this.sanitizer.bypassSecurityTrustHtml(link);
            } else if (ref.reference && args && args.length > 0) {
                return this.http.get("https://server.fire.ly/r5/Patient/fbdffbd8-290d-4432-9a30-c93f639efc49" + "?_format=json").pipe(map((e: any) => {
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
            console.log(label)
            return of(label);
        }

        return of('');
    }

}
