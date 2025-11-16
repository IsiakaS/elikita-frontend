import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { backendEndPointToken } from '../app.config';
import { map, tap, catchError } from 'rxjs/operators';
// Add the interceptor token (one folder backward)
import { LoadingUIEnabled } from '../loading.interceptor';

@Injectable({ providedIn: 'root' })
export class ReferenceDisplayService {
    private http = inject(HttpClient);
    private backend = inject(backendEndPointToken);

    // Cache of ref -> display
    private cache: Record<string, string> = {};
    // Public stream for consumers that want to react to any ref display updates
    readonly refDisplays$ = new BehaviorSubject<Record<string, string>>({});

    // Ensure display is available (fetch if needed)
    ensure(ref: string): Observable<string> {
        if (!ref) return of('');
        const cached = this.cache[ref];
        if (cached) return of(cached);

        const { type, id } = this.splitRef(ref);
        if (!type || !id) {
            this.updateCache(ref, ref);
            return of(ref);
        }

        return this.http.get<any>(`${this.backend}/${type}/${id}`, {
            // Skip global loader for this quick lookup
            context: new HttpContext().set(LoadingUIEnabled, false)
        }).pipe(
            map((res) => this.buildDisplayFromResource(type, res) || `${type}/${id}`),
            tap((display) => this.updateCache(ref, display)),
            catchError(() => {
                const fallback = `${type}/${id}`;

                this.updateCache(ref, fallback);
                return of(fallback);
            })
        );
    }

    private updateCache(ref: string, display: string) {
        this.cache[ref] = display;
        this.refDisplays$.next({ ...this.cache });
    }

    private splitRef(ref: string): { type: string | null; id: string | null } {
        // Supports "ResourceType/id" or full URLs ending in "ResourceType/id"
        try {
            const parts = ref.split('/');
            if (parts.length >= 2) {
                const id = parts[parts.length - 1] || null;
                const type = parts[parts.length - 2] || null;
                return { type, id };
            }
            return { type: null, id: null };
        } catch {
            return { type: null, id: null };
        }
    }

    private buildDisplayFromResource(type: string, res: any): string {
        if (!res) return '';
        const toHumanName = (r: any): string => {
            const name = r?.name;
            if (Array.isArray(name) && name.length) {
                const n = name[0] || {};
                if (n.text) return String(n.text);
                const given = Array.isArray(n.given) ? n.given.join(' ') : (n.given || '');
                const family = n.family || '';
                return `${(given || '').toString().trim()} ${(family || '').toString().trim()}`.trim();
            }
            if (typeof r?.name === 'string') return r.name;
            return r?.id || '';
        };

        switch ((type || '').toLowerCase()) {
            case 'patient':
            case 'practitioner':
            case 'relatedperson':
                return toHumanName(res);
            case 'organization':
                return res?.name || res?.id || '';
            case 'observation': {
                const cc = res?.code || {};
                if (cc.text) return String(cc.text);
                const coding = Array.isArray(cc.coding) ? cc.coding : [];
                return coding[0]?.display || coding[0]?.code || res?.id || '';
            }
            case 'medication':
            case 'medicationrequest': {
                const cc = res?.code || res?.medicationCodeableConcept || {};
                if (cc?.text) return String(cc.text);
                const coding = Array.isArray(cc?.coding) ? cc.coding : [];
                return coding[0]?.display || coding[0]?.code || res?.id || '';
            }
            default:
                return res?.id || '';
        }
    }
}
