import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { Location } from 'fhir/r4';
import { AuthService } from '../shared/auth/auth.service';
import { StateService } from '../shared/state.service';
import { baseStatusStyles } from '../shared/statusUIIcons';
import { ChipsDirective } from '../chips.directive';

@Component({
  selector: 'app-admission-location',
  standalone: true,
  imports: [CommonModule, ChipsDirective],
  templateUrl: './admission-location.component.html',
  styles: [`
    .admission-location { padding: 1rem; display: block; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; }
    .actions { display:flex; gap:0.5rem; }
    .table-wrapper { overflow:auto; margin-top:1rem; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:0.75rem; border-bottom:1px solid #e2e8f0; text-align:left; }
    .primary-label { font-weight:600; }
    .secondary-label { color:#64748b; }
    .chip { padding:0.125rem 0.5rem; border-radius:0.75rem; font-size:0.75rem; text-transform:capitalize; }
    .chip--neutral { background:#e2e8f0; color:#1f2937; }
    .actions-col { width:110px; text-align:right; }
    .empty-state { padding:2rem; text-align:center; border:1px dashed #cbd5f5; border-radius:0.75rem; margin-top:1.5rem; }
  `]
})
export class AdmissionLocationComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly stateService = inject(StateService);
  private readonly subs = new Subscription();

  statusStyles = baseStatusStyles;
  tableDataLevel2 = new BehaviorSubject<Location[]>([]);
  canExportLocation$: Observable<boolean> = this.auth.user.pipe(map(() => this.auth.can('location', 'export')));

  ngOnInit(): void {
    this.subs.add(
      this.stateService.orgWideResources.locations.subscribe((entries: any[]) => {
        const locations = (entries ?? [])
          .map(entry => entry.actualResource as Location)
          .filter(Boolean);
        this.tableDataLevel2.next(locations);
      })
    );
  }

  onExportLocations(): void {
    const snapshot = this.tableDataLevel2.getValue();
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
