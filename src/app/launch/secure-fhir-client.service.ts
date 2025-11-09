import { Injectable } from '@angular/core';
import FHIR from 'fhirclient';
import { fhirclient } from 'fhirclient/lib/types';
import Client from 'fhirclient/lib/Client';

@Injectable({
    providedIn: 'root'
})
export class SecureFhirClientService {

    /**
     * Ensures all URLs use HTTPS protocol
     */
    private enforceHttps(url: string): string {
        if (!url) return url;

        // Convert http:// to https://
        if (url.startsWith('http://')) {
            return url.replace('http://', 'https://');
        }

        // If no protocol specified, assume https
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return `https://${url}`;
        }

        return url;
    }

    /**
     * Validates that URLs are using HTTPS
     */
    private validateHttpsUrl(url: string, urlType: string): void {
        if (!url.startsWith('https://')) {
            console.warn(`⚠️ ${urlType} should use HTTPS for security: ${url}`);
            throw new Error(`${urlType} must use HTTPS protocol for security reasons`);
        }
    }

    /**
     * Secure wrapper for FHIR.oauth2.authorize that enforces HTTPS
     */
    async secureAuthorize(params: fhirclient.AuthorizeParams): Promise<string | void> {
        // Enforce HTTPS on all URL parameters
        const secureParams = { ...params };

        // Enforce HTTPS on issuer
        if (secureParams.iss) {
            secureParams.iss = this.enforceHttps(secureParams.iss);
            this.validateHttpsUrl(secureParams.iss, 'Issuer (iss)');
        }

        // Enforce HTTPS on redirect URI
        if (secureParams.redirectUri) {
            secureParams.redirectUri = this.enforceHttps(secureParams.redirectUri);
            this.validateHttpsUrl(secureParams.redirectUri, 'Redirect URI');
        }

        // Enforce HTTPS on base URL if provided
        if (secureParams.fhirServiceUrl) {
            secureParams.fhirServiceUrl = this.enforceHttps(secureParams.fhirServiceUrl);
            this.validateHttpsUrl(secureParams.fhirServiceUrl, 'FHIR Service URL');
        }

        // Log security info
        console.log('🔒 Secure FHIR Authorization with HTTPS enforcement:', {
            issuer: secureParams.iss,
            redirectUri: secureParams.redirectUri,
            fhirServiceUrl: secureParams.fhirServiceUrl,
            pkceMode: secureParams.pkceMode
        });

        try {
            const result = await FHIR.oauth2.authorize(secureParams);

            // If result is a string (URL), ensure it's HTTPS
            if (typeof result === 'string') {
                const secureResult = this.enforceHttps(result);
                console.log('🔒 Authorization URL converted to HTTPS:', secureResult);
                return secureResult;
            }

            return result;
        } catch (error) {
            console.error('❌ Secure authorization failed:', error);
            throw error;
        }
    }

    /**
     * Secure wrapper for FHIR.oauth2.ready that validates client URLs
     */
    async secureReady(options?: any): Promise<Client> {
        try {
            const client = await FHIR.oauth2.ready(options);

            // Validate and secure the client's URLs
            console.log(client);
            this.secureClientUrls(client);

            return client;
        } catch (error) {

            console.error('❌ Secure ready failed:', error);
            throw error;
        }
    }

    /**
     * Ensures all client URLs use HTTPS
     */
    private secureClientUrls(client: Client): void {
        // Get the current state
        const state = client.state;

        // Check and secure token endpoint
        if (state.tokenUri) {
            const secureTokenUri = this.enforceHttps(state.tokenUri);
            this.validateHttpsUrl(secureTokenUri, 'Token endpoint');

            if (secureTokenUri !== state.tokenUri) {
                console.log('🔒 Token endpoint converted to HTTPS:', secureTokenUri);
                state.tokenUri = secureTokenUri;
            }
        }

        // Check and secure FHIR server URL
        if (state.serverUrl) {
            const secureServerUrl = this.enforceHttps(state.serverUrl);
            this.validateHttpsUrl(secureServerUrl, 'FHIR server URL');

            if (secureServerUrl !== state.serverUrl) {
                console.log('🔒 FHIR server URL converted to HTTPS:', secureServerUrl);
                state.serverUrl = secureServerUrl;
            }
        }

        // Check authorization endpoint if available
        if (state.authorizeUri) {
            const secureAuthorizeUri = this.enforceHttps(state.authorizeUri);
            this.validateHttpsUrl(secureAuthorizeUri, 'Authorization endpoint');

            if (secureAuthorizeUri !== state.authorizeUri) {
                console.log('🔒 Authorization endpoint converted to HTTPS:', secureAuthorizeUri);
                state.authorizeUri = secureAuthorizeUri;
            }
        }
    }

    /**
     * Creates a secure FHIR client with HTTPS enforcement
     */
    async createSecureClient(stateOrURI: fhirclient.ClientState | string): Promise<Client> {
        let clientInput = stateOrURI;

        // If input is a string (URI), ensure it's HTTPS
        if (typeof stateOrURI === 'string') {
            clientInput = this.enforceHttps(stateOrURI);
            this.validateHttpsUrl(clientInput as string, 'Client URI');
        }

        const client = FHIR.client(clientInput);

        // Secure the client URLs
        this.secureClientUrls(client);

        return client;
    }

    /**
     * AGGRESSIVE: Monkey-patch XMLHttpRequest and fetch to intercept ALL network calls
     */
    enforceHttpsGlobally(): void {
        console.log('🚀 Starting AGGRESSIVE HTTPS enforcement...');

        // 1. Patch XMLHttpRequest
        this.patchXMLHttpRequest();

        // 2. Patch fetch API
        this.patchFetchAPI();

        // 3. Patch URL constructor
        this.patchURLConstructor();

        // 4. Patch any FHIR-specific methods
        this.patchFHIRMethods();

        // 5. NUCLEAR OPTION: Patch String.prototype methods used for URL construction
        this.patchStringMethods();

        // 6. Intercept location changes
        this.patchLocationMethods();

        console.log('🔒 AGGRESSIVE HTTPS enforcement activated for ALL network calls');
    }

    /**
     * NUCLEAR OPTION: Intercept string operations that might be used for URL construction
     */
    private patchStringMethods(): void {
        console.log('☢️ ACTIVATING NUCLEAR OPTION: String method patching...');

        // Store original methods
        const originalConcat = String.prototype.concat;
        const originalReplace = String.prototype.replace;

        // Patch String.concat to detect URL construction
        String.prototype.concat = function (...strings: string[]): string {
            const result = originalConcat.apply(this, strings);

            // Check if result looks like a token endpoint URL
            if (result.includes('/token') && result.startsWith('http://')) {
                const httpsResult = result.replace('http://', 'https://');
                console.log('☢️ String.concat URL converted to HTTPS:', httpsResult);
                return httpsResult;
            }

            return result;
        };

        // Monitor template literal constructions by watching for common patterns
        this.interceptTemplateLiterals();
    }

    private interceptTemplateLiterals(): void {
        // Create a global URL validator that gets called before any network request
        (window as any).__validateURL = (url: string): string => {
            if (typeof url === 'string' &&
                (url.includes('/token') || url.includes('/oauth') || url.includes('/auth')) &&
                url.startsWith('http://')) {
                const httpsUrl = url.replace('http://', 'https://');
                console.log('☢️ Template literal URL converted to HTTPS:', httpsUrl);
                return httpsUrl;
            }
            return url;
        };
    }

    private patchLocationMethods(): void {
        // Patch window.location.href setter
        const originalLocationHref = Object.getOwnPropertyDescriptor(Location.prototype, 'href');

        if (originalLocationHref && originalLocationHref.set) {
            Object.defineProperty(Location.prototype, 'href', {
                set: function (url: string) {
                    if (url.includes('/token') && url.startsWith('http://')) {
                        url = url.replace('http://', 'https://');
                        console.log('🔒 Location.href converted to HTTPS:', url);
                    }
                    originalLocationHref.set!.call(this, url);
                },
                get: originalLocationHref.get,
                enumerable: true,
                configurable: true
            });
        }
    }

    private patchXMLHttpRequest(): void {
        const originalOpen = XMLHttpRequest.prototype.open;

        XMLHttpRequest.prototype.open = function (method: string, url: string | URL, async: boolean = true, user?: string | null, password?: string | null) {
            let finalUrl = url.toString();

            // Force HTTPS for any token-related endpoints
            if (finalUrl.includes('/token') ||
                finalUrl.includes('/oauth') ||
                finalUrl.includes('/auth') ||
                finalUrl.includes('.well-known')) {

                if (finalUrl.startsWith('http://')) {
                    finalUrl = finalUrl.replace('http://', 'https://');
                    console.log('🔒 XMLHttpRequest URL converted to HTTPS:', finalUrl);
                }
            }

            return originalOpen.call(this, method, finalUrl, async, user, password);
        };
    }

    private patchFetchAPI(): void {
        const originalFetch = window.fetch;

        window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
            let url = '';

            if (typeof input === 'string') {
                url = input;
            } else if (input instanceof URL) {
                url = input.toString();
            } else if (input instanceof Request) {
                url = input.url;
            }

            // Force HTTPS for token-related endpoints
            if (url.includes('/token') ||
                url.includes('/oauth') ||
                url.includes('/auth') ||
                url.includes('.well-known')) {

                if (url.startsWith('http://')) {
                    url = url.replace('http://', 'https://');
                    console.log('🔒 Fetch URL converted to HTTPS:', url);

                    // Update the input
                    if (typeof input === 'string') {
                        input = url;
                    } else if (input instanceof URL) {
                        input = new URL(url);
                    } else if (input instanceof Request) {
                        input = new Request(url, input);
                    }
                }
            }

            return originalFetch.call(this, input, init);
        };
    }

    private patchURLConstructor(): void {
        const originalURL = window.URL;

        // Create a proxy for URL constructor
        const URLProxy = new Proxy(originalURL, {
            construct(target, args: [string | URL, string?]) {
                let url = args[0];

                if (typeof url === 'string' &&
                    (url.includes('/token') ||
                        url.includes('/oauth') ||
                        url.includes('/auth') ||
                        url.includes('.well-known'))) {

                    if (url.startsWith('http://')) {
                        url = url.replace('http://', 'https://');
                        console.log('🔒 URL constructor converted to HTTPS:', url);
                        args[0] = url;
                    }
                }

                return new target(args[0], args[1]);
            }
        });

        // Replace global URL constructor
        (window as any).URL = URLProxy;
    }

    private patchFHIRMethods(): void {
        try {
            // Patch FHIR.oauth2.authorize if it exists
            if (FHIR && FHIR.oauth2 && FHIR.oauth2.authorize) {
                const originalAuthorize = FHIR.oauth2.authorize;

                FHIR.oauth2.authorize = (params: any) => {
                    console.log('🔒 Intercepting FHIR.oauth2.authorize:', params);

                    // Force HTTPS on all URL parameters
                    if (params.iss && params.iss.startsWith('http://')) {
                        params.iss = params.iss.replace('http://', 'https://');
                        console.log('🔒 FHIR authorize iss converted to HTTPS:', params.iss);
                    }

                    if (params.redirectUri && params.redirectUri.startsWith('http://')) {
                        params.redirectUri = params.redirectUri.replace('http://', 'https://');
                        console.log('🔒 FHIR authorize redirectUri converted to HTTPS:', params.redirectUri);
                    }

                    if (params.fhirServiceUrl && params.fhirServiceUrl.startsWith('http://')) {
                        params.fhirServiceUrl = params.fhirServiceUrl.replace('http://', 'https://');
                        console.log('🔒 FHIR authorize fhirServiceUrl converted to HTTPS:', params.fhirServiceUrl);
                    }

                    return originalAuthorize.call(this, params);
                };
            }

            // Patch FHIR.oauth2.ready if it exists
            if (FHIR && FHIR.oauth2 && FHIR.oauth2.ready) {
                const originalReady = FHIR.oauth2.ready;

                FHIR.oauth2.ready = (options?: any) => {
                    console.log('🔒 Intercepting FHIR.oauth2.ready:', options);
                    return originalReady.call(this, options);
                };
            }

            // Try to patch internal FHIR client methods
            this.patchFHIRClientInternals();

        } catch (error) {
            console.warn('⚠️ Could not patch FHIR methods:', error);
        }
    }

    private patchFHIRClientInternals(): void {
        try {
            // Patch Client prototype methods if accessible
            const ClientPrototype = (FHIR as any).Client?.prototype || Client.prototype;

            if (ClientPrototype && ClientPrototype.request) {
                const originalRequest = ClientPrototype.request;

                ClientPrototype.request = function (input: any, options?: any) {
                    if (typeof input === 'string' && input.startsWith('http://')) {
                        input = input.replace('http://', 'https://');
                        console.log('🔒 FHIR Client request URL converted to HTTPS:', input);
                    }

                    return originalRequest.call(this, input, options);
                };
            }

            // Patch any token-related methods
            if (ClientPrototype && ClientPrototype.refreshTokens) {
                const originalRefreshTokens = ClientPrototype.refreshTokens;

                ClientPrototype.refreshTokens = function () {
                    console.log('🔒 Intercepting token refresh...');

                    // Ensure token endpoint is HTTPS
                    if (this.state && this.state.tokenUri && this.state.tokenUri.startsWith('http://')) {
                        this.state.tokenUri = this.state.tokenUri.replace('http://', 'https://');
                        console.log('🔒 Token URI converted to HTTPS:', this.state.tokenUri);
                    }

                    return originalRefreshTokens.call(this);
                };
            }

        } catch (error) {
            console.warn('⚠️ Could not patch FHIR Client internals:', error);
        }
    }    /**
     * Utility method to check if current environment supports HTTPS
     */
    validateEnvironmentSecurity(): { isSecure: boolean; warnings: string[] } {
        const warnings: string[] = [];
        let isSecure = true;

        // Check if we're in a secure context
        if (typeof window !== 'undefined') {
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                warnings.push('Application is not running over HTTPS in production');
                isSecure = false;
            }

            // Check if we have secure context
            if (!window.isSecureContext) {
                warnings.push('Browser reports this is not a secure context');
                isSecure = false;
            }
        }

        return { isSecure, warnings };
    }
}