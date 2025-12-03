import { IsoDateFormatterPipe } from './iso-date-formatter.pipe';

describe('IsoDateFormatterPipe', () => {
    let pipe: IsoDateFormatterPipe;

    beforeEach(() => {
        pipe = new IsoDateFormatterPipe();
    });

    it('should create an instance', () => {
        expect(pipe).toBeTruthy();
    });

    it('should format valid ISO date string with Z timezone', () => {
        const isoDate = '2025-11-29T20:47:16.147Z';
        const result = pipe.transform(isoDate);
        expect(result).toContain('Nov 29, 2025');
        expect(result).toContain('$#$');
    });

    it('should format valid ISO date string without milliseconds', () => {
        const isoDate = '2025-11-29T12:00:00Z';
        const result = pipe.transform(isoDate);
        expect(result).toContain('Nov 29, 2025');
        expect(result).toContain('$#$');
    });

    it('should return original string for non-ISO format', () => {
        const nonIsoString = 'Hello World';
        const result = pipe.transform(nonIsoString);
        expect(result).toBe('Hello World');
    });

    it('should return original string for invalid date string', () => {
        const invalidDate = '2025-13-32T25:99:99.999Z';
        const result = pipe.transform(invalidDate);
        expect(result).toBe(invalidDate);
    });

    it('should return original value for null', () => {
        const result = pipe.transform(null);
        expect(result).toBeNull();
    });

    it('should return original value for undefined', () => {
        const result = pipe.transform(undefined);
        expect(result).toBeUndefined();
    });

    it('should return original value for non-string input', () => {
        const result = pipe.transform(12345);
        expect(result).toBe(12345);
    });

    it('should handle ISO date with timezone offset', () => {
        const isoDate = '2025-11-29T20:47:16.147+01:00';
        const result = pipe.transform(isoDate);
        expect(result).toContain('$#$');
    });
});
