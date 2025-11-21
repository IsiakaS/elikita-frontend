import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { PatientObservationComponent } from './patient-observation.component';

describe('PatientObservationComponent', () => {
  let component: PatientObservationComponent;
  let fixture: ComponentFixture<PatientObservationComponent>;

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => ({ subscribe: () => undefined }) } as any);

    await TestBed.configureTestingModule({
      imports: [PatientObservationComponent],
      providers: [{ provide: MatDialog, useValue: dialogSpy }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientObservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('passes excludeKeys for empty value fields when opening details', () => {
    const dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    const observation: any = {
      resourceType: 'Observation',
      code: { text: 'Pulse' },
      valueString: '',
      valueQuantity: null,
      valueBoolean: true
    };

    component.showDetails(observation);

    const dialogConfig = dialog.open.calls.mostRecent().args[1];
    expect(dialogConfig.data.excludeKeys).toEqual(jasmine.arrayContaining(['valueString', 'valueQuantity']));
    expect(dialogConfig.data.excludeKeys).not.toContain('valueBoolean');
  });
});
