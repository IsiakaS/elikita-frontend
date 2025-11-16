import { Directive, ElementRef, HostListener, Input, OnChanges, Renderer2, SimpleChanges, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { ReferenceDisplayService } from './reference-display.service';
import { finalize } from 'rxjs/operators';

@Directive({
    selector: '[appReferenceDisplay]',
    standalone: true,
    hostDirectives: [
        { directive: MatTooltip, inputs: ['matTooltip', 'matTooltipPosition'] }
    ]
})
export class ReferenceDisplayDirective implements OnChanges {
    @Input('appReferenceDisplay') ref: string | null | undefined;
    @Input() maxWidth: string = '180px';
    @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'above';
    @Input() showRawRef: boolean = true;
    // Instant fetch/replace option (primary and compatibility alias as requested)
    @Input() instantFetchAndReplace: boolean = false;
    @Input('InstantfetchAndRepace') set InstantfetchAndRepace(v: any) { this.instantFetchAndReplace = this.coerceBoolean(v); }

    private el = inject(ElementRef<HTMLElement>);
    private r2 = inject(Renderer2);
    private svc = inject(ReferenceDisplayService);
    private tooltip = inject(MatTooltip);

    private loaderEl: HTMLElement | null = null;
    private static spinnerStyleInjected = false;

    ngOnChanges(_: SimpleChanges): void {
        this.applyEllipsisStyles();
        this.tooltip.position = this.tooltipPosition;

        // If host has no text and showRawRef, put the ref as content
        const hostText = (this.el.nativeElement.textContent || '').trim();
        if (this.showRawRef && (!hostText || hostText.length === 0) && this.ref) {
            this.r2.setProperty(this.el.nativeElement, 'textContent', this.ref);
        }

        // Instant fetch & replace (no hover)
        if (this.instantFetchAndReplace) {
            this.tryInstantResolveAndReplace();
        }
    }

    private coerceBoolean(v: any): boolean {
        return v != null && `${v}` !== 'false' && v !== false && v !== 0;
    }

    private isLikelyReference(ref: string): boolean {
        // Match ".../ResourceType/id" and "{ResourceType}/{id}" patterns
        // ResourceType: letters+digits; id: FHIR id rule [A-Za-z0-9\-\.]{1,64}
        const parts = ref.split('/');
        if (parts.length < 2) return false;
        const id = parts[parts.length - 1];
        const type = parts[parts.length - 2];
        return /^[A-Za-z][A-Za-z0-9]*$/.test(type) && /^[A-Za-z0-9\-\.]{1,64}$/.test(id);
    }

    private tryInstantResolveAndReplace() {
        const ref = (this.ref || '').trim();
        if (!ref || !this.isLikelyReference(ref)) return;

        // Only replace if host is empty or currently shows the raw ref, else assume already resolved
        const host = this.el.nativeElement;
        const current = (host.textContent || '').trim();
        const shouldReplace = !current || current === ref || this.showRawRef;

        if (!shouldReplace) return;

        this.showMiniLoader();
        this.svc.ensure(ref)
            .pipe(finalize(() => this.hideMiniLoader()))
            .subscribe(display => {
                const text = display || ref;
                // Replace the visible text
                this.r2.setProperty(host, 'textContent', text);
                // Also update tooltip
                this.tooltip.message = text;
                this.r2.setAttribute(host, 'title', text);
            });
    }

    private applyEllipsisStyles() {
        const el = this.el.nativeElement;
        this.r2.setStyle(el, 'display', 'inline-block');
        this.r2.setStyle(el, 'max-width', this.maxWidth);
        this.r2.setStyle(el, 'overflow', 'hidden');
        this.r2.setStyle(el, 'text-overflow', 'ellipsis');
        this.r2.setStyle(el, 'white-space', 'nowrap');
        this.r2.setStyle(el, 'vertical-align', 'bottom');
        // do not set title aggressively; it will be set when tooltip has content
    }

    // Find nearest ancestor by tag name
    private findAncestor(el: HTMLElement | null, tagName: string): HTMLElement | null {
        let cur: HTMLElement | null = el;
        const target = tagName.toUpperCase();
        while (cur && cur !== document.body) {
            if (cur.tagName === target) return cur;
            cur = cur.parentElement;
        }
        return null;
    }

    // Ensure TD is above TR to make cell hoverable over row overlays
    private raiseTdOverTr() {
        const hostEl = this.el.nativeElement;
        const td = this.findAncestor(hostEl, 'TD');
        const tr = this.findAncestor(hostEl, 'TR');

        if (!td || !tr) return;

        // TR: ensure positioned and under TD
        const trComputed = getComputedStyle(tr);
        if (trComputed.position === 'static' || !trComputed.position) {
            this.r2.setStyle(tr, 'position', 'relative');
        }
        this.r2.setStyle(tr, 'z-index', '1');

        // TD: ensure positioned and above TR
        const tdComputed = getComputedStyle(td);
        if (tdComputed.position === 'static' || !tdComputed.position) {
            this.r2.setStyle(td, 'position', 'relative');
        }
        this.r2.setStyle(td, 'z-index', '2');
    }

    private ensureSpinnerStyles() {
        if (ReferenceDisplayDirective.spinnerStyleInjected) return;
        const style = this.r2.createElement('style');
        style.textContent = `@keyframes app-ref-spin { 100% { transform: rotate(360deg); } }`;
        document.head.appendChild(style);
        ReferenceDisplayDirective.spinnerStyleInjected = true;
    }

    // ABSOLUTE spinner inside host (no layout shift)
    private showMiniLoader() {
        if (this.loaderEl) return;
        this.ensureSpinnerStyles();

        const host = this.el.nativeElement;
        const pos = getComputedStyle(host).position;
        if (!pos || pos === 'static') {
            this.r2.setStyle(host, 'position', 'relative');
        }

        const span = this.r2.createElement('span') as HTMLElement;
        this.r2.setStyle(span, 'position', 'absolute');
        this.r2.setStyle(span, 'top', 'calc(100% + 2px)');
        this.r2.setStyle(span, 'left', '0');
        this.r2.setStyle(span, 'width', '12px');
        this.r2.setStyle(span, 'height', '12px');
        this.r2.setStyle(span, 'border', '2px solid currentColor');
        this.r2.setStyle(span, 'border-top-color', 'transparent');
        this.r2.setStyle(span, 'border-radius', '50%');
        this.r2.setStyle(span, 'animation', 'app-ref-spin 0.8s linear infinite');
        this.r2.setStyle(span, 'opacity', '0.7');
        this.r2.setStyle(span, 'pointer-events', 'none');
        this.r2.setStyle(span, 'z-index', '3');

        host.appendChild(span);
        this.loaderEl = span;
    }

    private hideMiniLoader() {
        if (!this.loaderEl) return;
        const parent = this.loaderEl.parentElement;
        if (parent) parent.removeChild(this.loaderEl);
        this.loaderEl = null;
    }

    @HostListener('mouseleave')
    onMouseLeave() {
        this.hideMiniLoader();
    }

    @HostListener('mouseenter')
    onMouseEnter() {
        // Don't do anything for non-reference strings
        const trimmed = (this.ref || '').trim();
        if (!this.isLikelyReference(trimmed)) return;

        // raise td above tr for proper hover
        this.raiseTdOverTr();

        if (!trimmed) {
            this.tooltip.message = '';
            return;
        }

        // Show tooltip immediately; refresh after resolve
        this.tooltip.message = 'Resolving...';
        this.tooltip.show();

        // show tiny loader beneath the host while resolving
        this.showMiniLoader();

        this.svc.ensure(trimmed)
            .pipe(finalize(() => this.hideMiniLoader()))
            .subscribe(display => {
                const msg = display || trimmed;
                this.tooltip.message = msg;
                this.r2.setAttribute(this.el.nativeElement, 'title', msg || '');
                // Force tooltip to refresh content without requiring re-hover
                this.tooltip.hide(0);
                requestAnimationFrame(() => this.tooltip.show());
            });
    }
}
