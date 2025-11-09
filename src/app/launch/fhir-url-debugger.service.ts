import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FhirUrlDebuggerService {

    private urlLog: Array<{
        timestamp: Date;
        originalUrl: string;
        convertedUrl?: string;
        source: string;
        stackTrace: string;
    }> = [];

    /**
     * Start deep URL monitoring to see exactly what fhirclient is doing
     */
    startDeepMonitoring(): void {
        console.log('🔍 Starting DEEP URL monitoring...');

        // Monitor ALL property accesses and method calls
        this.monitorObjectAccess();

        // Monitor console to see internal fhirclient logs
        this.monitorConsole();

        // Monitor error events that might reveal URL construction
        this.monitorErrors();

        console.log('🔍 Deep monitoring activated');
    }

    private monitorObjectAccess(): void {
        // Try to intercept any property access on FHIR objects
        const originalFHIR = (window as any).FHIR;

        if (originalFHIR) {
            (window as any).FHIR = new Proxy(originalFHIR, {
                get: (target, prop, receiver) => {
                    console.log('🔍 FHIR property accessed:', prop);
                    return Reflect.get(target, prop, receiver);
                }
            });
        }
    }

    private monitorConsole(): void {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args: any[]) => {
            // Look for URL patterns in console logs
            const message = args.join(' ');
            if (message.includes('http://') || message.includes('https://') || message.includes('/token')) {
                this.logUrl(message, 'console.log', this.getStackTrace());
            }
            return originalLog.apply(console, args);
        };

        console.error = (...args: any[]) => {
            const message = args.join(' ');
            if (message.includes('http://') || message.includes('https://') || message.includes('/token')) {
                this.logUrl(message, 'console.error', this.getStackTrace());
            }
            return originalError.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            const message = args.join(' ');
            if (message.includes('http://') || message.includes('https://') || message.includes('/token')) {
                this.logUrl(message, 'console.warn', this.getStackTrace());
            }
            return originalWarn.apply(console, args);
        };
    }

    private monitorErrors(): void {
        window.addEventListener('error', (event) => {
            if (event.message.includes('http://') || event.message.includes('/token')) {
                this.logUrl(event.message, 'error event', event.error?.stack || 'No stack');
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            const reason = event.reason?.toString() || '';
            if (reason.includes('http://') || reason.includes('/token')) {
                this.logUrl(reason, 'unhandled rejection', this.getStackTrace());
            }
        });
    }

    private logUrl(url: string, source: string, stackTrace: string): void {
        const entry = {
            timestamp: new Date(),
            originalUrl: url,
            source,
            stackTrace
        };

        this.urlLog.push(entry);

        // Keep only last 100 entries
        if (this.urlLog.length > 100) {
            this.urlLog.shift();
        }

        console.log('🔍 URL detected:', entry);
    }

    private getStackTrace(): string {
        try {
            throw new Error();
        } catch (e: any) {
            return e.stack || 'No stack trace available';
        }
    }

    /**
     * Get all captured URL logs
     */
    getUrlLog(): Array<any> {
        return [...this.urlLog];
    }

    /**
     * Clear the URL log
     */
    clearUrlLog(): void {
        this.urlLog = [];
    }

    /**
     * NUCLEAR DEBUGGING: Intercept ALL object property access
     */
    enableNuclearDebugging(): void {
        console.log('☢️ ENABLING NUCLEAR DEBUGGING...');

        // Wrap ALL window objects with proxies
        this.wrapWithProxy(window, 'window');

        // Specifically target common HTTP libraries
        this.interceptHttpLibraries();
    }

    private wrapWithProxy(obj: any, name: string, depth: number = 0): void {
        if (depth > 3) return; // Prevent infinite recursion

        try {
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'function') {
                    const originalFunc = obj[key];
                    obj[key] = new Proxy(originalFunc, {
                        apply: (target, thisArg, argumentsList) => {
                            // Check if any argument contains URL patterns
                            const args = argumentsList.join(' ');
                            if (args.includes('http://') || args.includes('/token')) {
                                console.log(`☢️ Function ${name}.${key} called with URL:`, argumentsList);
                                this.logUrl(args, `${name}.${key}`, this.getStackTrace());
                            }
                            return target.apply(thisArg, argumentsList);
                        }
                    });
                }
            });
        } catch (error) {
            // Ignore errors from non-enumerable properties
        }
    }

    private interceptHttpLibraries(): void {
        // Try to find and intercept common HTTP libraries
        const libraries = ['axios', 'fetch', 'XMLHttpRequest', 'jQuery'];

        libraries.forEach(lib => {
            const libObj = (window as any)[lib];
            if (libObj) {
                console.log(`☢️ Found ${lib}, wrapping with proxy...`);
                this.wrapWithProxy(libObj, lib);
            }
        });
    }

    /**
     * Create a report of all URL activity
     */
    generateReport(): string {
        const report = {
            totalUrls: this.urlLog.length,
            httpUrls: this.urlLog.filter(entry => entry.originalUrl.includes('http://')).length,
            httpsUrls: this.urlLog.filter(entry => entry.originalUrl.includes('https://')).length,
            tokenUrls: this.urlLog.filter(entry => entry.originalUrl.includes('/token')).length,
            sources: [...new Set(this.urlLog.map(entry => entry.source))],
            recentUrls: this.urlLog.slice(-10)
        };

        return JSON.stringify(report, null, 2);
    }
}