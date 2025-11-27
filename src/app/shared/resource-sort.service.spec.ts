import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ResourceSortService, SortDirection } from './resource-sort.service';

describe('ResourceSortService', () => {
    let service: ResourceSortService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ResourceSortService);
    });

    it('should sort descending by default using a single field', () => {
        const resources = [
            { id: 'a', authoredOn: '2024-01-01T00:00:00Z' },
            { id: 'b', authoredOn: '2024-06-01T00:00:00Z' },
            { id: 'c', authoredOn: '2023-12-01T00:00:00Z' }
        ];

        const sorted = service.sortResources(resources, 'authoredOn');

        expect(sorted[0].id).toBe('b');
        expect(sorted[sorted.length - 1].id).toBe('c');
    });

    it('should sort ascending when asked', () => {
        const resources = [
            { id: 'a', authoredOn: '2024-01-01T00:00:00Z' },
            { id: 'b', authoredOn: '2024-06-01T00:00:00Z' }
        ];

        const sorted = service.sortResources(resources, 'authoredOn', 'asc');

        expect(sorted[0].id).toBe('a');
    });

    it('should fall back to secondary keys when the first field is missing', () => {
        const resources = [
            { id: 'x', effectiveDateTime: '2024-04-01T00:00:00Z' },
            { id: 'y', created: '2024-01-01T00:00:00Z' }
        ];

        const sorted = service.sortResources(resources, ['authoredOn', 'effectiveDateTime', 'created']);

        expect(sorted[0].id).toBe('x');
    });

    it('sortResources$ should emit sorted arrays on source updates', done => {
        const source = new BehaviorSubject([{ id: 'a', date: '2023-01-01T00:00:00Z' }]);
        const sorted$ = service.sortResources$(source.asObservable(), 'date');

        const emitted: string[] = [];
        const subscription = sorted$.subscribe(values => {
            emitted.push(values.map(r => r.id).join(','));
            if (emitted.length === 2) {
                expect(emitted[0]).toBe('a');
                expect(emitted[1]).toBe('b,a');
                subscription.unsubscribe();
                done();
            }
        });

        source.next([
            { id: 'b', date: '2024-01-01T00:00:00Z' },
            { id: 'a', date: '2023-01-01T00:00:00Z' }
        ]);
    });
});
