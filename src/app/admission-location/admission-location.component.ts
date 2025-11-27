import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { Location } from 'fhir/r4';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth/auth.service';
import { StateService } from '../shared/state.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ChipsDirective } from '../chips.directive';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-admission-location',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, ChipsDirective, EmptyStateComponent],
  templateUrl: './admission-location.component.html',
  styles: [
    `
    .admission-location { padding: 1rem; display: block; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .actions { display:flex; gap:0.5rem; flex-wrap:wrap; }
    .table-wrapper { overflow:auto; margin-top:1rem; }
    table { width:100%; }
    .primary-label { font-weight:600; }
    .secondary-label { color:#64748b; }
    .actions-col { width:120px; text-align:right; }
    .empty-state { margin-top:2rem; }
  `]
})
export class AdmissionLocationComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly stateService = inject(StateService);
  private readonly subs = new Subscription();

  statusStyles = baseStatusStyles;
  canExportLocation$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('location', 'export')));

  tableDataSource = new MatTableDataSource<Location>([]);
  tableDataLevel2 = new BehaviorSubject<Location[]>([]);
  displayedColumns: string[] = ['name', 'status', 'physicalType', 'partOf', 'lastUpdated', 'actions'];

  ngOnInit(): void {
    this.subs.add(
      this.stateService.orgWideResources.locations.subscribe((entries: any[]) => {
        const locations = (entries ?? [])
          .map(entry => entry.actualResource as Location)
          .filter(Boolean);
        this.tableDataSource.data = locations;
        this.tableDataLevel2.next(locations);
      })
    );
  }

  onExportLocations(): void {
    const snapshot = this.tableDataSource.data;
    if (!snapshot.length) {
      console.warn('No locations to export.');
      return;
    }
    console.log('Export payload:', snapshot);
  }

  showRow(location: Location): void {
    this.showLocationDetails(location);
  }

  showLocationDetails(location: Location): void {
    console.log('Location details:', location);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
