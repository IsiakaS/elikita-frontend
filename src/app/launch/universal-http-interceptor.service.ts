import { Injectable } from '@angular/core';

export interface RequestLog {
    id: string;
    timestamp: Date;
    method: string;
    url: string;
    originalUrl: string;
    convertedUrl?: string;
    requestType: 'fetch' | 'xhr' | 'angular-http' | 'redirect' | 'form' | 'websocket' | 'unknown';
    headers?: any;
    body?: any;
    stackTrace: string;
    wasConverted: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UniversalHttpInterceptorService {

    private requestLog: RequestLog[] = [];
    private interceptorsActive = false;
    private requestCounter = 0;

    /**
     * Start intercepting ALL HTTP requests from ANY source
     */
    startUniversalInterception(): void {
        if (this.interceptorsActive) {
            console.log('🔄 Universal interceptors already active');
            return;
        }

        console.log('🚀 ACTIVATING UNIVERSAL HTTP INTERCEPTION...');

        // 1. Intercept XMLHttpRequest (XHR)
        this.interceptXMLHttpRequest();

        // 2. Intercept Fetch API
        this.interceptFetch();

        // 3. Intercept Angular HttpClient
        this.interceptAngularHttp();

        // 4. Intercept Window Navigation
        this.interceptWindowNavigation();

        // 5. Intercept Form Submissions
        this.interceptFormSubmissions();

        // 6. Intercept WebSocket connections
        this.interceptWebSocket();

        // 7. Intercept Dynamic Script/Image/Link loading
        this.interceptDynamicResourceLoading();

        // 8. Intercept History API
        this.interceptHistoryAPI();

        // 9. Intercept Service Worker messages
        this.interceptServiceWorker();

        this.interceptorsActive = true;
        console.log('✅ UNIVERSAL HTTP INTERCEPTION ACTIVE');
    }

    /**
     * 1. XMLHttpRequest Interception
     */
    private interceptXMLHttpRequest(): void {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        const self = this;

        XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async: boolean = true, user?: string | null, password?: string | null) {
            const originalUrl = url.toString();
            const convertedUrl = self.enforceHttps(originalUrl);
            const wasConverted = originalUrl !== convertedUrl;

            // Log the request
            const logEntry = self.createLogEntry('xhr', method, originalUrl, convertedUrl, wasConverted);
            self.requestLog.push(logEntry);

            console.log(`🌐 XHR ${method}:`, {
                original: originalUrl,
                converted: convertedUrl,
                wasConverted
            });

            return originalOpen.call(this, method, convertedUrl, async, user, password);
        };

        XMLHttpRequest.prototype.send = function (body?: any) {
            console.log('📤 XHR SEND:', { body });
            return originalSend.call(this, body);
        };
    }

    /**
     * 2. Fetch API Interception
     */
    private interceptFetch(): void {
        const originalFetch = window.fetch;
        const self = this;

        window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            let originalUrl = '';
            let headers = {};

            if (typeof input === 'string') {
                originalUrl = input;
            } else if (input instanceof URL) {
                originalUrl = input.toString();
            } else if (input instanceof Request) {
                originalUrl = input.url;
                // Extract headers from Request object
                input.headers.forEach((value, key) => {
                    (headers as any)[key] = value;
                });
            }

            const convertedUrl = self.enforceHttps(originalUrl);
            const wasConverted = originalUrl !== convertedUrl;

            // Log the request
            const logEntry = self.createLogEntry('fetch', init?.method || 'GET', originalUrl, convertedUrl, wasConverted);
            logEntry.headers = { ...headers, ...init?.headers };
            logEntry.body = init?.body;
            self.requestLog.push(logEntry);

            console.log(`🌐 FETCH ${init?.method || 'GET'}:`, {
                original: originalUrl,
                converted: convertedUrl,
                wasConverted,
                headers: logEntry.headers
            });

            // Update the input with converted URL
            if (typeof input === 'string') {
                input = convertedUrl;
            } else if (input instanceof URL) {
                input = new URL(convertedUrl);
            } else if (input instanceof Request) {
                input = new Request(convertedUrl, input);
            }

            return originalFetch.call(this, input, init);
        };
    }

    /**
     * 3. Angular HttpClient Interception
     */
    private interceptAngularHttp(): void {
        // This will be handled by Angular's HTTP interceptor if available
        // But we can also patch the underlying XMLHttpRequest which Angular uses
        console.log('🅰️ Angular HTTP will be intercepted via XHR patching');
    }

    /**
     * 4. Window Navigation Interception
     */
    private interceptWindowNavigation(): void {
        const self = this;

        // Safely intercept window.location changes using property descriptors
        try {
            const originalLocationAssign = window.location.assign.bind(window.location);
            const originalLocationReplace = window.location.replace.bind(window.location);

            // Try to redefine location methods if possible
            try {
                Object.defineProperty(window.location, 'assign', {
                    value: function (url: string) {
                        const convertedUrl = self.enforceHttps(url);
                        const wasConverted = url !== convertedUrl;

                        const logEntry = self.createLogEntry('redirect', 'ASSIGN', url, convertedUrl, wasConverted);
                        self.requestLog.push(logEntry);

                        console.log('🔄 LOCATION.ASSIGN:', { original: url, converted: convertedUrl, wasConverted });

                        return originalLocationAssign(convertedUrl);
                    },
                    writable: true,
                    configurable: true
                });
            } catch (assignError) {
                console.warn('⚠️ Cannot intercept location.assign (read-only):', (assignError as Error).message || assignError);
            }

            try {
                Object.defineProperty(window.location, 'replace', {
                    value: function (url: string) {
                        const convertedUrl = self.enforceHttps(url);
                        const wasConverted = url !== convertedUrl;

                        const logEntry = self.createLogEntry('redirect', 'REPLACE', url, convertedUrl, wasConverted);
                        self.requestLog.push(logEntry);

                        console.log('🔄 LOCATION.REPLACE:', { original: url, converted: convertedUrl, wasConverted });

                        return originalLocationReplace(convertedUrl);
                    },
                    writable: true,
                    configurable: true
                });
            } catch (replaceError) {
                console.warn('⚠️ Cannot intercept location.replace (read-only):', (replaceError as Error).message || replaceError);
            }

        } catch (locationError) {
            console.warn('⚠️ Cannot intercept window.location methods:', (locationError as Error).message || locationError);
        }

        // Intercept window.open
        const originalWindowOpen = window.open;
        window.open = function (url?: string | URL, target?: string, features?: string) {
            if (url) {
                const originalUrl = url.toString();
                const convertedUrl = self.enforceHttps(originalUrl);
                const wasConverted = originalUrl !== convertedUrl;

                const logEntry = self.createLogEntry('redirect', 'WINDOW.OPEN', originalUrl, convertedUrl, wasConverted);
                self.requestLog.push(logEntry);

                console.log('🔄 WINDOW.OPEN:', { original: originalUrl, converted: convertedUrl, wasConverted });

                return originalWindowOpen.call(this, convertedUrl, target, features);
            }
            return originalWindowOpen.call(this, url, target, features);
        };

        // Intercept href setter
        this.interceptHrefSetter();
    }

    private interceptHrefSetter(): void {
        const self = this;

        // Intercept direct href assignments
        const originalHrefDescriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href');

        if (originalHrefDescriptor && originalHrefDescriptor.set) {
            Object.defineProperty(Location.prototype, 'href', {
                set: function (url: string) {
                    const convertedUrl = self.enforceHttps(url);
                    const wasConverted = url !== convertedUrl;

                    const logEntry = self.createLogEntry('redirect', 'HREF', url, convertedUrl, wasConverted);
                    self.requestLog.push(logEntry);

                    console.log('🔄 HREF SET:', { original: url, converted: convertedUrl, wasConverted });

                    originalHrefDescriptor.set!.call(this, convertedUrl);
                },
                get: originalHrefDescriptor.get,
                enumerable: true,
                configurable: true
            });
        }
    }

    /**
     * 5. Form Submission Interception
     */
    private interceptFormSubmissions(): void {
        const self = this;
        const originalSubmit = HTMLFormElement.prototype.submit;

        HTMLFormElement.prototype.submit = function () {
            const action = this.action;
            if (action) {
                const convertedAction = self.enforceHttps(action);
                const wasConverted = action !== convertedAction;

                const logEntry = self.createLogEntry('form', this.method.toUpperCase() || 'POST', action, convertedAction, wasConverted);
                self.requestLog.push(logEntry);

                console.log('📝 FORM SUBMIT:', { original: action, converted: convertedAction, wasConverted });

                if (wasConverted) {
                    this.action = convertedAction;
                }
            }

            return originalSubmit.call(this);
        };

        // Also intercept form submissions via submit event
        document.addEventListener('submit', (event) => {
            const form = event.target as HTMLFormElement;
            if (form && form.action) {
                const action = form.action;
                const convertedAction = self.enforceHttps(action);
                const wasConverted = action !== convertedAction;

                if (wasConverted) {
                    console.log('📝 FORM EVENT SUBMIT:', { original: action, converted: convertedAction });
                    form.action = convertedAction;
                }
            }
        });
    }

    /**
     * 6. WebSocket Interception
     */
    private interceptWebSocket(): void {
        const self = this;
        const originalWebSocket = window.WebSocket;

        (window as any).WebSocket = function (url: string | URL, protocols?: string | string[]) {
            const originalUrl = url.toString();
            let convertedUrl = originalUrl;

            // Convert ws:// to wss:// for WebSocket HTTPS equivalent
            if (originalUrl.startsWith('ws://')) {
                convertedUrl = originalUrl.replace('ws://', 'wss://');
            }

            const wasConverted = originalUrl !== convertedUrl;

            const logEntry = self.createLogEntry('websocket', 'CONNECT', originalUrl, convertedUrl, wasConverted);
            self.requestLog.push(logEntry);

            console.log('🔌 WEBSOCKET:', { original: originalUrl, converted: convertedUrl, wasConverted });

            return new originalWebSocket(convertedUrl, protocols);
        };

        // Copy static properties
        Object.setPrototypeOf((window as any).WebSocket, originalWebSocket);
        (window as any).WebSocket.prototype = originalWebSocket.prototype;
    }

    /**
     * 7. Dynamic Resource Loading Interception
     */
    private interceptDynamicResourceLoading(): void {
        const self = this;

        // Intercept dynamic script loading
        const originalCreateElement = document.createElement;
        document.createElement = function (tagName: string, options?: ElementCreationOptions) {
            const element = originalCreateElement.call(this, tagName, options);

            if (tagName.toLowerCase() === 'script') {
                const scriptElement = element as HTMLScriptElement;
                const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');

                if (originalSrcDescriptor && originalSrcDescriptor.set) {
                    Object.defineProperty(scriptElement, 'src', {
                        set: function (url: string) {
                            const convertedUrl = self.enforceHttps(url);
                            const wasConverted = url !== convertedUrl;

                            if (wasConverted) {
                                const logEntry = self.createLogEntry('unknown', 'SCRIPT', url, convertedUrl, wasConverted);
                                self.requestLog.push(logEntry);
                                console.log('📜 SCRIPT SRC:', { original: url, converted: convertedUrl });
                            }

                            originalSrcDescriptor.set!.call(this, convertedUrl);
                        },
                        get: originalSrcDescriptor.get,
                        enumerable: true,
                        configurable: true
                    });
                }
            }

            return element;
        };
    }

    /**
     * 8. History API Interception
     */
    private interceptHistoryAPI(): void {
        const self = this;
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (state: any, title: string, url?: string | URL | null) {
            if (url) {
                const originalUrl = url.toString();
                const convertedUrl = self.enforceHttps(originalUrl);
                const wasConverted = originalUrl !== convertedUrl;

                if (wasConverted) {
                    const logEntry = self.createLogEntry('redirect', 'PUSHSTATE', originalUrl, convertedUrl, wasConverted);
                    self.requestLog.push(logEntry);
                    console.log('📚 HISTORY.PUSHSTATE:', { original: originalUrl, converted: convertedUrl });
                    url = convertedUrl;
                }
            }

            return originalPushState.call(this, state, title, url);
        };

        history.replaceState = function (state: any, title: string, url?: string | URL | null) {
            if (url) {
                const originalUrl = url.toString();
                const convertedUrl = self.enforceHttps(originalUrl);
                const wasConverted = originalUrl !== convertedUrl;

                if (wasConverted) {
                    const logEntry = self.createLogEntry('redirect', 'REPLACESTATE', originalUrl, convertedUrl, wasConverted);
                    self.requestLog.push(logEntry);
                    console.log('📚 HISTORY.REPLACESTATE:', { original: originalUrl, converted: convertedUrl });
                    url = convertedUrl;
                }
            }

            return originalReplaceState.call(this, state, title, url);
        };
    }

    /**
     * 9. Service Worker Interception
     */
    private interceptServiceWorker(): void {
        if ('serviceWorker' in navigator) {
            console.log('👷 Service Worker interception setup (limited access to SW requests)');
            // Note: We can't directly intercept SW requests, but we can monitor registration
        }
    }

    /**
     * HTTPS Enforcement Logic
     */
    private enforceHttps(url: string): string {
        if (!url || typeof url !== 'string') return url;

        // Convert http:// to https://
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }

        // Convert ws:// to wss:// for WebSockets
        if (url.startsWith('ws://')) {
            return url.replace('ws://', 'wss://');
        }

        return url;
    }

    /**
     * Create log entry
     */
    private createLogEntry(
        requestType: RequestLog['requestType'],
        method: string,
        originalUrl: string,
        convertedUrl?: string,
        wasConverted: boolean = false
    ): RequestLog {
        return {
            id: `req_${++this.requestCounter}`,
            timestamp: new Date(),
            method,
            url: convertedUrl || originalUrl,
            originalUrl,
            convertedUrl: wasConverted ? convertedUrl : undefined,
            requestType,
            stackTrace: this.getStackTrace(),
            wasConverted
        };
    }

    private getStackTrace(): string {
        try {
            throw new Error();
        } catch (e: any) {
            return e.stack || 'No stack trace available';
        }
    }

    /**
     * Get all logged requests
     */
    getRequestLog(): RequestLog[] {
        return [...this.requestLog];
    }

    /**
     * Get requests that were converted to HTTPS
     */
    getConvertedRequests(): RequestLog[] {
        return this.requestLog.filter(log => log.wasConverted);
    }

    /**
     * Clear request log
     */
    clearRequestLog(): void {
        this.requestLog = [];
    }

    /**
     * Generate comprehensive report
     */
    generateReport(): any {
        const converted = this.getConvertedRequests();

        return {
            totalRequests: this.requestLog.length,
            convertedRequests: converted.length,
            conversionRate: this.requestLog.length ? (converted.length / this.requestLog.length * 100).toFixed(2) + '%' : '0%',
            requestTypes: this.getRequestTypeBreakdown(),
            methodBreakdown: this.getMethodBreakdown(),
            recentRequests: this.requestLog.slice(-10),
            convertedUrls: converted.map(log => ({
                original: log.originalUrl,
                converted: log.convertedUrl,
                type: log.requestType,
                method: log.method
            }))
        };
    }

    private getRequestTypeBreakdown(): any {
        const breakdown: any = {};
        this.requestLog.forEach(log => {
            breakdown[log.requestType] = (breakdown[log.requestType] || 0) + 1;
        });
        return breakdown;
    }

    private getMethodBreakdown(): any {
        const breakdown: any = {};
        this.requestLog.forEach(log => {
            breakdown[log.method] = (breakdown[log.method] || 0) + 1;
        });
        return breakdown;
    }

    /**
     * Stop all interception (restore original methods)
     */
    stopInterception(): void {
        console.log('🛑 Stopping universal HTTP interception (requires page reload for full restoration)');
        this.interceptorsActive = false;
        // Note: In a real implementation, you'd want to store original methods and restore them
    }
}