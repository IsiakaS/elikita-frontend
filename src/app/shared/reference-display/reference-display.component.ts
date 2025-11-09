import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { Reference } from 'fhir/r5';
import { fetchFromReferencePipe } from "../Fetch.pipe";
import { References2Pipe } from "../references2.pipe";
import { LinkInReferencesService } from '../link-in-references.service';
import { AsyncPipe } from '@angular/common';
import { commonImports } from '../table-interface';

@Component({
  selector: 'app-reference-display',
  imports: [fetchFromReferencePipe, References2Pipe, AsyncPipe, ...commonImports],
  templateUrl: './reference-display.component.html',
  styleUrl: './reference-display.component.scss'
})
export class ReferenceDisplayComponent {
  @Input() data?: Reference
  @Input() referenceDeepPath?: string[] | null;
  @Input() tdReference?: ElementRef | HTMLElement
  @Output() tdClicked = new EventEmitter();
  linkInReferences = inject(LinkInReferencesService);

  alltds($event: any) {
    // alert("F")
    console.log('alltds called', $event?.currentTarget.className, $event?.target.className);
    if ($event?.target.className.includes('link-group-icon')
      || $event?.target.className.includes('mat-icon')
      || $event?.target.className.includes('mat-expansion-panel-header')) {

      if (this.tdReference) {
        this.tdClicked.emit(this.tdReference)
      } else {
        this.tdClicked.emit(null);
      }
      setTimeout(() => {
        if (this.actualBase && this.actualBase.nativeElement) {
          console.log(this.actualBase)
          // debugger;
          const actualBaseRect = this.actualBase.nativeElement.getBoundingClientRect();
          const dialogSurface = document.querySelector('.mat-mdc-dialog-surface.mdc-dialog__surface');
          if (dialogSurface) {
            const dialogRect = dialogSurface.getBoundingClientRect();
            if (actualBaseRect.right >= dialogRect.right) {
              this.actualBase.nativeElement.style.width = '250px';
              this.actualBase.nativeElement.style.overflowX = 'auto';
            } else {
              this.actualBase.nativeElement.style.width = `${250 - (dialogRect.left - actualBaseRect.left)}px`;
              // alert(`${dialogRect.right}`);
              // alert(`${actualBaseRect.left}`);
              this.actualBase.nativeElement.style.overflowX = 'auto';

            }
          } else {
            console.warn('Dialog surface not found, cannot adjust width.');
          }
        }
      }, 3000);
    }

  }

  @ViewChild('actualBase') actualBase?: ElementRef;
  ngAfterViewInit() {
    //CHECK the right of actualBase to the right of .mat-mdc-dialog-surface.mdc-dialog__surface wich is one 
    // of its ancestral parent. if the right is not visible, then set the
    //width to the width to 250px  - the diff and put scroll on actual base

  }
}
