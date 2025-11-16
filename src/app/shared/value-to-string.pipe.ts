import { Pipe, PipeTransform } from '@angular/core';
import { UtilityService } from './utility.service';

@Pipe({
    name: 'valueToString',
    standalone: true
})
export class ValueToStringPipe implements PipeTransform {
    constructor(private util: UtilityService) { }

    transform(obj: any): string {
        if (!obj || typeof obj !== 'object') {
            return '';
        }

        // Blood Pressure special handling (panel 85354-9 or has 8480-6/8462-4 components)
        const bp = this.tryBloodPressure(obj);
        if (bp) return bp;

        // Fallback to generic stringifier
        return this.util.convertAllValueTypesToString(obj);
    }

    private tryBloodPressure(obs: any): string {
        const codeable = obs?.code;
        const codeStr = (codeable?.text || '').toLowerCase();
        const coding = Array.isArray(codeable?.coding) ? codeable.coding : [];
        const hasPanelCode = coding.some((c: any) => c?.code === '85354-9');
        const mentionsBp =
            codeStr.includes('blood pressure') ||
            coding.some((c: any) => (c?.display || '').toLowerCase().includes('blood pressure'));

        const components = Array.isArray(obs?.component) ? obs.component : [];
        const hasSys = components.some((c: any) => c?.code?.coding?.some((k: any) => k?.code === '8480-6'));
        const hasDia = components.some((c: any) => c?.code?.coding?.some((k: any) => k?.code === '8462-4'));

        if (!(hasPanelCode || mentionsBp || (hasSys && hasDia))) return '';

        const getVal = (code: string) => {
            const comp = components.find((c: any) => c?.code?.coding?.some((k: any) => k?.code === code));
            const v = comp?.valueQuantity?.value;
            const unit = comp?.valueQuantity?.unit || comp?.valueQuantity?.code || '';
            return { v, unit };
        };

        const sys = getVal('8480-6'); // Systolic
        const dia = getVal('8462-4'); // Diastolic

        if (sys?.v != null && dia?.v != null) {
            const unit = (sys.unit || dia.unit || '').replace('mm[Hg]', 'mmHg') || 'mmHg';
            return `${sys.v}/${dia.v} ${unit}`.trim();
        }
        return '';
    }
}
