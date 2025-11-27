import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type SortDirection = 'asc' | 'desc';

@Injectable({
    providedIn: 'root'
})
export class ResourceSortService {
    sortResources<T>(
        resources: T[] | undefined | null,
        sortBy: string | string[],
        direction: SortDirection = 'desc'
    ): T[] {
        if (!resources || !resources.length) {
            return [];
        }

        const sortKeys = Array.isArray(sortBy) ? sortBy : [sortBy];
        const sorted = [...resources].sort((a, b) => {
            const dateA = this.extractFirstValidDate(a, sortKeys);
            const dateB = this.extractFirstValidDate(b, sortKeys);
            return this.compareDates(dateA, dateB, direction);
        });

        return sorted;
    }

    sortResources$<T>(
        resources$: Observable<T[] | undefined | null>,
        sortBy: string | string[],
        direction: SortDirection = 'desc'
    ): Observable<T[]> {
        return resources$.pipe(
            map(resources => this.sortResources(resources, sortBy, direction))
        );
    }

    private compareDates(a: Date | null, b: Date | null, direction: SortDirection): number {
        const timeA = a?.getTime() ?? 0;
        const timeB = b?.getTime() ?? 0;
        if (timeA === timeB) {
            return 0;
        }
        const delta = timeA - timeB;
        return direction === 'asc' ? delta : -delta;
    }

    private extractFirstValidDate(resource: any, keys: string[]): Date | null {
        for (const key of keys) {
            const value = resource?.[key];
            const candidate = this.resolveDateValue(value);
            if (candidate) {
                return candidate;
            }
        }
        return null;
    }

    private resolveDateValue(value: any): Date | null {
        if (!value) {
            return null;
        }
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'string' || typeof value === 'number') {
            const parsed = new Date(value);
            return isNaN(parsed.getTime()) ? null : parsed;
        }
        if (typeof value === 'object') {
            const candidates = [
                value.value,
                value.start,
                value.authoredOn,
                value.issued,
                value.registered,
                value.date,
                value.effectiveDateTime,
                value.created,
                value.onsetDateTime,
                value.period?.start
            ];
            for (const candidate of candidates) {
                const resolved = this.resolveDateValue(candidate);
                if (resolved) {
                    return resolved;
                }
            }
        }
        return null;
    }
}
