import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[stretch]',
  standalone: true
})
export class StretchDirective {
  elref = inject(ElementRef);
  /**
   * Initializes the StretchDirective by adjusting the flex property of the nearest parent element
   * with the class 'mat-mdc-form-field'. The constructor traverses the DOM hierarchy starting from
   * the current element, alerts the immediate parent, and continues traversing until it finds the
   * target class. Once found, it sets the flex property to make the element stretch.
   */

  constructor() {



  }

  ngAfterViewInit() {
    let elem = this.elref.nativeElement;

    let pr = elem.parentElement;

    while (!pr.className.includes('mat-mdc-form-field ')) {
      pr = pr.parentElement;
    }
    pr.style.flex = "1 1 100%";
  }

}
