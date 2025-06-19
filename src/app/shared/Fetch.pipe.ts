import { HttpClient, HttpContext, HttpContextToken } from '@angular/common/http';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Reference } from 'fhir/r5';
import { catchError, delay, map, Observable, of, take, timeout } from 'rxjs';
import { LoadingUIEnabled } from '../loading.interceptor';

@Pipe({
  name: 'fetchFromReference'
})
export class fetchFromReferencePipe implements PipeTransform {
  sanitizer = inject(DomSanitizer);
  http = inject(HttpClient);
  transform(value: any, ...args: any[]): Observable<string | SafeHtml> {

    if (!value) return of('');



    // 2. Fall back to reference
    const ref = value

    const label = ref.display || ref.identifier?.value || ref.reference || '';
    if (ref.reference && (!args || args.length == 0)) {
      return of("")
    } else if (ref.reference && args && args.length > 0) {
      return this.http.get(ref.reference + "?_format=json", {
        context: new HttpContext().set(LoadingUIEnabled, false)   //Token(() => { return false })
      }).pipe(//timeout(5000), 
        //delay(120000),
        map((e: any) => {
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
        }),
        catchError((err: any) => {
          return this.http.get("https://server.fire.ly/r5/Patient/fbdffbd8-290d-4432-9a30-c93f639efc49" + "?_format=json", {
            context: new HttpContext().set(LoadingUIEnabled, false)   //Token(() => { return false })
          }).pipe(map((e: any) => {
            let g; console.log(e);

            // return e.map((f: any) => {
            g = e;
            for (const path of args) {
              if (!g) {
                g = " "; break;
              }
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
        })
      )

    } else {
      return of("_")
    }




  }

}


