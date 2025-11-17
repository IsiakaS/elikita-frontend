import { Directive, ElementRef, inject, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
    selector: '[appTruncateWords]',
    standalone: true,
    hostDirectives: [
        { directive: MatTooltip, inputs: ['matTooltip', 'matTooltipPosition'] }
    ]
})
export class TruncateWordsDirective implements OnChanges {
    @Input('appTruncateWords') maxWords = 20;
    @Input() maxWidth: string = '360px';
    @Input() wrap: boolean = true;
    @Input() tooltipPosition: 'above' | 'below' | 'left' | 'right' = 'above';
    @Input() showIcon: boolean = true;

    private el = inject(ElementRef<HTMLElement>);
    private r2 = inject(Renderer2);
    private tooltip = inject(MatTooltip);

    private originalText: string | null = null;
    private moreEl: HTMLElement | null = null;
    private deferTimer: any = null;

    ngOnChanges(_: SimpleChanges): void {
        // Prepare styles
        const host = this.el.nativeElement;
        this.r2.setStyle(host, 'display', 'inline-block');
        this.r2.setStyle(host, 'max-width', this.maxWidth);
        this.r2.setStyle(host, 'overflow', 'hidden');
        this.r2.setStyle(host, 'text-overflow', 'ellipsis');
        this.r2.setStyle(host, 'vertical-align', 'bottom');
        this.r2.setStyle(host, 'white-space', this.wrap ? 'normal' : 'nowrap');

        // Use programmatic property 'position' (alias in template is 'matTooltipPosition')
        this.tooltip.position = this.tooltipPosition;

        this.recompute();
    }

    private recompute() {
        const host = this.el.nativeElement;

        // Read full text from content if not cached OR was cached empty
        if (!this.originalText || this.originalText.length === 0) {
            const current = (host.textContent || '').trim();
            if (!current) {
                // Likely called too early; defer to next tick
                if (!this.deferTimer) {
                    this.deferTimer = setTimeout(() => {
                        this.deferTimer = null;
                        this.recompute();
                    }, 0);
                }
                // Nothing to do yet
                this.clearMore();
                this.tooltip.message = '';
                this.r2.removeAttribute(host, 'title');
                return;
            }
            this.originalText = current;
        }

        // If no content or content does not look like text, skip
        if (!this.originalText) {
            this.clearMore();
            this.tooltip.message = '';
            this.r2.removeAttribute(host, 'title');
            return;
        }

        // Decide to truncate
        const words = this.originalText.split(/\s+/).filter(Boolean);
        if (words.length <= this.maxWords) {
            // Not truncated; show original and clear tooltip
            this.clearMore();
            this.setHostText(this.originalText);
            this.tooltip.message = '';
            this.r2.removeAttribute(host, 'title');
            return;
        }

        const truncated = words.slice(0, this.maxWords).join(' ') + '…';
        this.clearMore();
        this.setHostText(truncated);

        // Tooltip shows full text
        this.tooltip.message = this.originalText;
        this.r2.setAttribute(host, 'title', this.originalText);

        // Append a small “more” indicator (ellipsis) when truncated
        if (this.showIcon) this.appendMoreIndicator();
    }

    private setHostText(text: string) {
        this.r2.setProperty(this.el.nativeElement, 'textContent', text);
    }

    private appendMoreIndicator() {
        const host = this.el.nativeElement;
        // avoid duplicates
        if (this.moreEl?.parentElement) return;

        const span = this.r2.createElement('span') as HTMLElement;
        this.r2.setStyle(span, 'margin-left', '4px');
        this.r2.setStyle(span, 'opacity', '0.6');
        this.r2.setStyle(span, 'font-weight', '500');
        this.r2.setStyle(span, 'pointer-events', 'none');
        this.r2.setProperty(span, 'textContent', '…'); // visual hint for “more”
        host.appendChild(span);
        this.moreEl = span;
    }

    private clearMore() {
        if (!this.moreEl) return;
        const parent = this.moreEl.parentElement;
        if (parent) parent.removeChild(this.moreEl);
        this.moreEl = null;
    }
}
