import { Directive, ElementRef, inject, Input, Renderer2, RendererStyleFlags2 } from '@angular/core';
import { baseStatusStyles } from './shared/statusUIIcons';

@Directive({
  selector: '[appChips]'
})
export class ChipsDirective {
  private prevStatusClass: string | null = null;
  private _status = '';
  private _fontSize = '';
  private _iconSet: 'material-icons' | 'material-symbols-outlined' = 'material-icons';
  private _showText: boolean = true;
  // Single input: status text (external alias is appChips)
  @Input('appChips')
  set status(value: string | null | undefined) {
    this._status = (value ?? '').toString();
    this.render();
  }

  // second input
  @Input()
  set fontSize(value: string | null | undefined) {
    this._fontSize = (value ?? '').toString();
    this.render();
  }

  // third input (optional)
  @Input()
  set iconSet(value: 'material-icons' | 'material-symbols-outlined' | null | undefined) {
    if (value) this._iconSet = value;
    this.render();
  }

  @Input()
  set showText(value: boolean | null | undefined) {
    this._showText = value ?? true;
    // Implement logic to show or hide text based on the input value
    this.render();
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  private render() {
    const host = this.el.nativeElement;
    const normalized = this._status.trim().toLowerCase();

    // Base classes
    this.renderer.addClass(host, 'small-chips');
    this.renderer.addClass(host, 'g-just-flex');
    this.renderer.addClass(host, 'gap-8');
    this.renderer.addClass(host, 'py-8');

    // Apply optional font size to host
    if (this._fontSize) {
      this.renderer.setStyle(host, 'font-size', this._fontSize, RendererStyleFlags2.Important);
      this.renderer.setStyle(host, 'line-height', Number(this._fontSize.match(/\d+/)?.[0] || 16) +
        Number(Number(this._fontSize.match(/\d+/)?.[0]) / 2) +
        'px' || 'normal', RendererStyleFlags2.Important);
    }

    host.style.setProperty('margin', '0', 'important');
    // Also via Renderer2 for cross-renderer compatibility
    this.renderer.setStyle(host, 'margin', '0', RendererStyleFlags2.Important);

    // Dynamic status-* class
    const nextStatusClass = `status-${baseStatusStyles[normalized]?.color || 'gray'}`;
    if (this.prevStatusClass && this.prevStatusClass !== nextStatusClass) {
      this.renderer.removeClass(host, this.prevStatusClass);
    }
    this.renderer.addClass(host, nextStatusClass);
    this.prevStatusClass = nextStatusClass;

    // Clear current content
    while (host.firstChild) {
      this.renderer.removeChild(host, host.firstChild);
    }
    if (this._showText) {
      // <span>{{ status }}</span>
      const span = this.renderer.createElement('span');

      this.renderer.appendChild(span, this.renderer.createText(this._status || ''));

      this.renderer.appendChild(host, span);
    } else {
      this.renderer.addClass(host, 'no-border');
      this.renderer.setAttribute(host, 'title', this._status || '');
    }
    // Render icon using ligature font (no MatIconComponent needed)
    const iconName = baseStatusStyles[normalized]?.icon || 'help_outline';
    const iconSpan = this.renderer.createElement('span');
    this.renderer.addClass(iconSpan, this._iconSet); // 'material-icons' or 'material-symbols-outlined'
    if (this._fontSize) {
      this.renderer.setStyle(iconSpan, 'font-size', this._fontSize);
      this.renderer.setStyle(iconSpan, 'height', this._fontSize);
      this.renderer.setStyle(iconSpan, 'width', this._fontSize);
    }
    this.renderer.setStyle(iconSpan, 'backgroundColor', 'transparent');
    this.renderer.setStyle(iconSpan, 'borderColor', 'transparent');
    this.renderer.appendChild(iconSpan, this.renderer.createText(iconName));
    this.renderer.appendChild(host, iconSpan);
  }
}
