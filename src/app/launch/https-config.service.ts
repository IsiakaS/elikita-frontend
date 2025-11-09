import { Injectable } from '@angular/core';

export interface HttpsEnforcementConfig {
    enforceHttps: boolean;
    allowLocalhostHttp: boolean;
    strictMode: boolean;
    logSecurityWarnings: boolean;
    throwOnInsecureUrls: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class HttpsConfigService {

    private config: HttpsEnforcementConfig = {
        enforceHttps: true,
        allowLocalhostHttp: true, // Allow http for localhost development
        strictMode: true, // Throw errors for non-HTTPS in production
        logSecurityWarnings: true,
        throwOnInsecureUrls: true
    };

    /**
     * Get current HTTPS enforcement configuration
     */
    getConfig(): HttpsEnforcementConfig {
        return { ...this.config };
    }

    /**
     * Update HTTPS enforcement configuration
     */
    updateConfig(newConfig: Partial<HttpsEnforcementConfig>): void {
        this.config = { ...this.config, ...newConfig };
        console.log('🔒 HTTPS enforcement config updated:', this.config);
    }

    /**
     * Check if URL should be enforced to HTTPS based on current config
     */
    shouldEnforceHttps(url: string): boolean {
        if (!this.config.enforceHttps) return false;

        // Allow localhost HTTP in development if configured
        if (this.config.allowLocalhostHttp && this.isLocalhost(url)) {
            return false;
        }

        return true;
    }

    /**
     * Check if URL is localhost
     */
    private isLocalhost(url: string): boolean {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'localhost' ||
                urlObj.hostname === '127.0.0.1' ||
                urlObj.hostname === '0.0.0.0';
        } catch {
            return false;
        }
    }

    /**
     * Check if we're in production environment
     */
    isProduction(): boolean {
        return window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1';
    }

    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig(): HttpsEnforcementConfig {
        if (this.isProduction()) {
            // Production: strict HTTPS enforcement
            return {
                enforceHttps: true,
                allowLocalhostHttp: false,
                strictMode: true,
                logSecurityWarnings: true,
                throwOnInsecureUrls: true
            };
        } else {
            // Development: more lenient
            return {
                enforceHttps: true,
                allowLocalhostHttp: true,
                strictMode: false,
                logSecurityWarnings: true,
                throwOnInsecureUrls: false
            };
        }
    }

    /**
     * Initialize with environment-appropriate defaults
     */
    initializeEnvironmentDefaults(): void {
        this.config = this.getEnvironmentConfig();
        console.log('🔒 HTTPS config initialized for environment:', {
            environment: this.isProduction() ? 'production' : 'development',
            config: this.config
        });
    }
}