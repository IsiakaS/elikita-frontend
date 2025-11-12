import { HttpContextToken, HttpEvent, HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoaderComponent } from './loader/loader.component';
import { catchError, of, tap } from 'rxjs';
import { CacheStorageService } from './cache-storage.service';

export const LoadingUIEnabled = new HttpContextToken<boolean>(() => true);
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // alert(req.url);

  const dialog = inject(MatDialog)
  let dref: MatDialogRef<LoaderComponent>
  const cacheStorage = inject(CacheStorageService);
  console.log(req.context.get(LoadingUIEnabled), "LoadingUIEnabled");
  if (req.context.get(LoadingUIEnabled)) {
    dref = dialog.open(LoaderComponent, {

    });

    // Cache only idempotent GET requests. Do not short-circuit PUT/POST/PATCH/DELETE.
    if (req.method === 'GET' && cacheStorage.cache.hasOwnProperty(req.urlWithParams)) {
      console.log('[cache] HIT for', req.urlWithParams);
      dref.close();
      const cached = cacheStorage.cache[req.urlWithParams];
      // Ensure a proper HttpResponse is returned
      return of(new HttpResponse({ ...cached }));
    }

    return next(req).pipe(tap((event: HttpEvent<any>) => {
      if (event.type === HttpEventType.Response) {
        console.log('[network] response for', req.method, req.urlWithParams);
        // Store only GET responses
        if (req.method === 'GET') {
          cacheStorage.cache[req.urlWithParams] = event;
        } else {
          // Invalidate cache entries related to this resource URL
          const baseKey = req.url.split('?')[0];
          const patientCollectionPrefix = (() => {
            // Try to compute the collection URL prefix (e.g., https://host/Patient)
            try {
              const urlObj = new URL(baseKey, window.location.origin);
              const idx = urlObj.pathname.indexOf('/Patient');
              if (idx >= 0) {
                const prefixPath = urlObj.pathname.substring(0, idx + '/Patient'.length);
                return urlObj.origin + prefixPath;
              }
            } catch { /* ignore */ }
            // Fallback: simple substring search on the raw string
            const raw = baseKey;
            const i = raw.indexOf('/Patient');
            return i >= 0 ? raw.substring(0, i + '/Patient'.length) : baseKey;
          })();

          Object.keys(cacheStorage.cache).forEach(k => {
            // Invalidate specific resource cache (e.g., /Patient/{id})
            if (k.startsWith(baseKey)) {
              delete cacheStorage.cache[k];
              return;
            }
            delete cacheStorage.cache[k];
            // Invalidate collection/list caches (e.g., /Patient?search... or exact /Patient)
            if (k.startsWith(patientCollectionPrefix) && (k.includes('/Patient?') || k.endsWith('/Patient'))) {
              delete cacheStorage.cache[k];
              return;
            }
          });
        }
        dref.close();
      }
    }),

      catchError((e: any) => {
        dref.close();
        throw (e);
      }));
  } else {
    return next(req);
  }
}
