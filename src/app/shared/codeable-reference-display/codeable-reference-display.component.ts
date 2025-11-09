import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { CodeableReference, Reference } from 'fhir/r5';
import { fetchFromReferencePipe } from "../Fetch.pipe";
import { References2Pipe } from "../references2.pipe";
import { LinkInReferencesService } from '../link-in-references.service';
import { AsyncPipe } from '@angular/common';
import { commonImports } from '../table-interface';

@Component({
  selector: 'app-codeable-reference-display',
  imports: [...commonImports, fetchFromReferencePipe, References2Pipe, AsyncPipe,],
  templateUrl: './codeable-reference-display.component.html',
  styleUrl: './codeable-reference-display.component.scss'
})
export class CodeableReferenceDisplayComponent {
  @Input() data?: CodeableReference
  @Input() referenceDeepPath?: string | null;
  @Input() valueDeepPath?: string | null;
  @Input() tdReference?: ElementRef
  @Output() tdClicked = new EventEmitter();
  linkInReferences = inject(LinkInReferencesService);
  @ViewChild('actualBase') actualBase?: ElementRef;
  alltds() {
    if (this.tdReference) {
      this.tdClicked.emit(this.tdReference)
    } else {
      this.tdClicked.emit(null);
    }

  }

  ngAfterViewInit() {
    //CHECK the right of actualBase to the right of .mat-mdc-dialog-surface.mdc-dialog__surface wich is one 
    // of its ancestral parent. if the right is not visible, then set the
    //width to the width to 250px  - the diff and put scroll on actual base
    if (this.actualBase && this.actualBase.nativeElement) {
      const actualBaseRect = this.actualBase.nativeElement.getBoundingClientRect();
      const dialogSurface = document.querySelector('.mat-mdc-dialog-surface.mdc-dialog__surface');
      if (dialogSurface) {
        const dialogRect = dialogSurface.getBoundingClientRect();
        if (actualBaseRect.right >= dialogRect.right) {
          this.actualBase.nativeElement.style.width = '250px';
          this.actualBase.nativeElement.style.overflowX = 'auto';
        } else {
          this.actualBase.nativeElement.style.width = `calc(250px - ${dialogRect.right - actualBaseRect.right}px)`;
          this.actualBase.nativeElement.style.overflowX = 'auto';

        }
      } else {
        console.warn('Dialog surface not found, cannot adjust width.');
      }
    }
  }
}