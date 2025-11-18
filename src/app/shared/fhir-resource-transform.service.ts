import { Injectable } from '@angular/core';

export interface FhirReference {
    reference: string;
    display?: string;
}

export interface FhirCoding {
    system?: string;
    code: string;
    display?: string;
}

export interface FhirCodeableConcept {
    coding?: FhirCoding[];
    text?: string;
}

type PropertyKind =
    'CodeableConcept' |
    'Reference' |
    'CodeableConcept[]' |
    'Reference[]' |
    'string' |
    'string[]' |
    'primitive';

// Minimal mapping (extend as needed)
const RESOURCE_PROPERTY_TYPES: Record<string, Record<string, PropertyKind>> = {
    Patient: {
        gender: 'string',
        maritalStatus: 'CodeableConcept',
        communication: 'CodeableConcept[]',
        generalPractitioner: 'Reference[]'
    },
    Encounter: {
        type: 'CodeableConcept[]',
        class: 'CodeableConcept',
        priority: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        reasonReference: 'Reference[]',
        subject: 'Reference',
        participant: 'Reference[]'
    },
    Observation: {
        category: 'CodeableConcept[]',
        code: 'CodeableConcept',
        bodySite: 'CodeableConcept',
        method: 'CodeableConcept',
        focus: 'Reference[]',
        subject: 'Reference',
        performer: 'Reference[]'
    },
    ServiceRequest: {
        status: 'string',
        intent: 'string',
        priority: 'string',
        code: 'CodeableConcept',
        category: 'CodeableConcept[]',
        reasonCode: 'CodeableConcept[]',
        subject: 'Reference',
        performer: 'Reference[]',
        performerType: 'CodeableConcept'
    },
    MedicationRequest: {
        status: 'string',
        intent: 'string',
        medicationCodeableConcept: 'CodeableConcept',
        medicationReference: 'Reference',
        subject: 'Reference',
        reasonCode: 'CodeableConcept[]',
        performerType: 'CodeableConcept'
    },
    AllergyIntolerance: {
        clinicalStatus: 'CodeableConcept',
        verificationStatus: 'CodeableConcept',
        type: 'string',
        category: 'string[]',
        code: 'CodeableConcept',
        patient: 'Reference',
        recorder: 'Reference',
        asserter: 'Reference',
        reaction: 'CodeableConcept[]'
    },
    Immunization: {
        vaccineCode: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        patient: 'Reference',
        location: 'Reference',
        site: 'CodeableConcept',
        route: 'CodeableConcept'
    },
    DiagnosticReport: {
        category: 'CodeableConcept[]',
        code: 'CodeableConcept',
        subject: 'Reference',
        performer: 'Reference[]',
        resultsInterpreter: 'Reference[]'
    },
    Appointment: {
        status: 'string',
        appointmentType: 'CodeableConcept',
        reasonCode: 'CodeableConcept[]',
        participant: 'Reference[]',
        serviceType: 'CodeableConcept[]'
    },
    Location: {
        type: 'CodeableConcept[]'
    },
    Practitioner: {
        qualification: 'CodeableConcept[]'
    },
    Medication: {
        code: 'CodeableConcept',
        form: 'CodeableConcept',
        ingredient: 'CodeableConcept[]'
    },
    Specimen: {
        type: 'CodeableConcept',
        subject: 'Reference',
        collection: 'Reference'
    },
    Task: {
        status: 'string',
        intent: 'string',
        code: 'CodeableConcept',
        focus: 'Reference'
    },
    CarePlan: {
        status: 'string',
        intent: 'string',
        category: 'CodeableConcept[]',
        subject: 'Reference'
    },
    ChargeItemDefinition: {
        code: 'CodeableConcept[]'
    },
    Slot: {
        serviceType: 'CodeableConcept[]'
    },
    Condition: {
        code: 'CodeableConcept',
        category: 'CodeableConcept[]',
        subject: 'Reference'
    }
};

@Injectable({
    providedIn: 'root'
})
export class FhirResourceTransformService {

    transformValues(
        resourceType: string,
        data: Record<string, any>,
        passthrough: string[] = []
    ): Record<string, any> {
        const result: Record<string, any> = {};
        const typeMap = RESOURCE_PROPERTY_TYPES[resourceType] || {};
        Object.entries(data).forEach(([key, value]) => {
            if (passthrough.includes(key)) {
                result[key] = value;
                return;
            }
            const kind: PropertyKind = typeMap[key] || this.inferKind(value);
            result[key] = this.applyKindTransform(value, kind);
        });
        return result;
    }

    private inferKind(value: any): PropertyKind {
        if (Array.isArray(value)) return 'string[]';
        if (typeof value === 'string') return 'string';
        return 'primitive';
    }

    private applyKindTransform(value: any, kind: PropertyKind): any {
        switch (kind) {
            case 'CodeableConcept': return this.toCodeableConcept(value);
            case 'CodeableConcept[]': return this.ensureArray(value).map(v => this.toCodeableConcept(v));
            case 'Reference': return this.toReference(value);
            case 'Reference[]': return this.ensureArray(value).map(v => this.toReference(v));
            case 'string': return value;
            case 'string[]': return this.ensureArray(value);
            default: return value;
        }
    }

    private ensureArray(v: any): any[] {
        return Array.isArray(v) ? v : (v == null ? [] : [v]);
    }

    private toCodeableConcept(raw: any): FhirCodeableConcept | any {
        if (!raw) return raw;
        if (typeof raw === 'object' && (raw.coding || raw.text)) return raw;
        if (typeof raw !== 'string') return { text: String(raw) };
        const parts = raw.split('$#$').map(p => p.trim());
        if (parts.length === 3 && this.allPartsHaveValue(parts)) {
            const [code, display, system] = parts;
            return { coding: [{ code, display, system }], text: display };
        }
        if (parts.length === 2 && this.allPartsHaveValue(parts)) {
            const [code, display] = parts;
            return { coding: [{ code, display }], text: display };
        }
        return { text: raw };
    }

    private toReference(raw: any): FhirReference | any {
        if (!raw) return raw;
        if (typeof raw === 'object' && raw.reference) return raw;
        if (typeof raw !== 'string') return raw;
        const parts = raw.split('$#$').map(p => p.trim());
        if (parts.length === 2 && this.allPartsHaveValue(parts)) {
            const [reference, display] = parts;
            return { reference, display };
        }
        // Pattern ResourceType/id [optional display after space]
        const firstSpace = raw.indexOf(' ');
        const candidate = firstSpace === -1 ? raw : raw.substring(0, firstSpace);
        if (/^[A-Z][A-Za-z]+\/[A-Za-z0-9\-.]+$/.test(candidate)) {
            const display = firstSpace === -1 ? undefined : raw.substring(firstSpace + 1).trim() || undefined;
            return { reference: candidate, ...(display ? { display } : {}) };
        }
        return raw; // fallback
    }

    private allPartsHaveValue(parts: string[]): boolean {
        return parts.every(p => p !== '');
    }
}
